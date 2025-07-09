package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"web-crawler-dashboard/internal/crawler"
	"web-crawler-dashboard/internal/models"

	"gorm.io/gorm"
)

// URLService provides business logic for URL management and crawling
type URLService struct {
	db             *gorm.DB
	crawlerService *crawler.CrawlerService
	linkAnalyzer   *crawler.LinkAnalyzer
}

// NewURLService creates a new URL service
func NewURLService(db *gorm.DB) *URLService {
	// Initialize crawler with default config
	crawlerConfig := crawler.DefaultConfig()
	
	return &URLService{
		db:             db,
		crawlerService: crawler.NewCrawlerService(crawlerConfig),
		linkAnalyzer:   crawler.NewLinkAnalyzer(crawlerConfig),
	}
}

// CreateURL creates a new URL for a user
func (s *URLService) CreateURL(userID uint, urlString string) (*models.URL, error) {
	// Validate URL format
	_, err := s.crawlerService.ValidateURL(urlString)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Check if URL already exists for this user
	var existingURL models.URL
	result := s.db.Where("user_id = ? AND url = ?", userID, urlString).First(&existingURL)
	if result.Error == nil {
		return nil, fmt.Errorf("URL already exists for this user")
	}

	// Create new URL
	newURL := models.URL{
		UserID: userID,
		URL:    urlString,
		Status: models.StatusQueued,
	}

	if err := s.db.Create(&newURL).Error; err != nil {
		return nil, fmt.Errorf("failed to create URL: %w", err)
	}

	return &newURL, nil
}

// GetURLs retrieves URLs for a user with filtering and pagination
func (s *URLService) GetURLs(userID uint, page, limit int, search, status string) ([]models.URL, int64, error) {
	// Build query
	query := s.db.Where("user_id = ?", userID)

	// Add search filter
	if search != "" {
		query = query.Where("url LIKE ? OR title LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Add status filter
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Get total count
	var total int64
	if err := query.Model(&models.URL{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count URLs: %w", err)
	}

	// Get URLs with pagination
	var urls []models.URL
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&urls).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to retrieve URLs: %w", err)
	}

	return urls, total, nil
}

// GetURL retrieves a specific URL by ID for a user
func (s *URLService) GetURL(userID, urlID uint) (*models.URL, error) {
	var url models.URL
	result := s.db.Where("id = ? AND user_id = ?", urlID, userID).First(&url)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("URL not found")
		}
		return nil, fmt.Errorf("failed to retrieve URL: %w", result.Error)
	}

	return &url, nil
}

// DeleteURL deletes a URL for a user
func (s *URLService) DeleteURL(userID, urlID uint) error {
	// First check if URL exists and belongs to user
	url, err := s.GetURL(userID, urlID)
	if err != nil {
		return err
	}

	// Check if URL is currently being processed
	if url.Status == models.StatusRunning {
		return fmt.Errorf("cannot delete URL while analysis is running")
	}

	// Delete the URL (this will cascade delete analysis results)
	if err := s.db.Delete(url).Error; err != nil {
		return fmt.Errorf("failed to delete URL: %w", err)
	}

	return nil
}

// StartAnalysis starts crawling analysis for a URL
func (s *URLService) StartAnalysis(ctx context.Context, userID, urlID uint) error {
	// Get and validate URL
	url, err := s.GetURL(userID, urlID)
	if err != nil {
		return err
	}

	// Check if analysis is already running
	if url.Status == models.StatusRunning {
		return fmt.Errorf("analysis is already running for this URL")
	}

	// Check if crawler service reports it's running (additional safety check)
	if s.crawlerService.IsRunning(urlID) {
		return fmt.Errorf("crawler reports analysis is already running")
	}

	// Update status to running
	url.Status = models.StatusRunning
	if err := s.db.Save(url).Error; err != nil {
		return fmt.Errorf("failed to update URL status: %w", err)
	}

	// Start crawling asynchronously
	// Use background context instead of request context since this is async operation
	err = s.crawlerService.CrawlAsync(context.Background(), urlID, url.URL, func(result *crawler.CrawlResult) {
		s.handleCrawlResult(urlID, result)
	})

	if err != nil {
		// Revert status if crawl start failed
		url.Status = models.StatusQueued
		s.db.Save(url)
		return fmt.Errorf("failed to start crawling: %w", err)
	}

	log.Printf("Started analysis for URL ID %d: %s", urlID, url.URL)
	return nil
}

// StopAnalysis stops crawling analysis for a URL
func (s *URLService) StopAnalysis(userID, urlID uint) error {
	// Get and validate URL
	url, err := s.GetURL(userID, urlID)
	if err != nil {
		return err
	}

	// Check if analysis is running
	if url.Status != models.StatusRunning {
		return fmt.Errorf("no analysis is currently running for this URL")
	}

	// Stop the crawler
	err = s.crawlerService.StopCrawl(urlID)
	if err != nil {
		log.Printf("Warning: failed to stop crawler for URL ID %d: %v", urlID, err)
	}

	// Update status back to queued
	url.Status = models.StatusQueued
	if err := s.db.Save(url).Error; err != nil {
		return fmt.Errorf("failed to update URL status: %w", err)
	}

	log.Printf("Stopped analysis for URL ID %d: %s", urlID, url.URL)
	return nil
}

// GetAnalysisResult retrieves analysis results for a URL
func (s *URLService) GetAnalysisResult(userID, urlID uint) (*models.AnalysisResult, error) {
	// First verify user owns the URL
	_, err := s.GetURL(userID, urlID)
	if err != nil {
		return nil, err
	}

	// Get analysis result
	var analysis models.AnalysisResult
	result := s.db.Where("url_id = ?", urlID).Preload("BrokenLinksDetails").First(&analysis)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("no analysis results found for this URL")
		}
		return nil, fmt.Errorf("failed to retrieve analysis results: %w", result.Error)
	}

	return &analysis, nil
}

// handleCrawlResult processes the result of a crawl operation
func (s *URLService) handleCrawlResult(urlID uint, result *crawler.CrawlResult) {
	log.Printf("[SERVICE] Processing crawl result for URL ID %d", urlID)
	
	// Simple approach: just update the URL status first, then handle analysis separately
	// This ensures the URL status gets updated even if analysis saving fails
	
	// Step 1: Update URL status (most important)
	var url models.URL
	if err := s.db.First(&url, urlID).Error; err != nil {
		log.Printf("[SERVICE] Failed to get URL record for ID %d: %v", urlID, err)
		return
	}

	// Update URL status and title
	if result.Error != "" {
		url.Status = models.StatusError
		log.Printf("[SERVICE] Marking URL ID %d as error: %s", urlID, result.Error)
	} else {
		url.Status = models.StatusCompleted
		url.Title = result.Title
		log.Printf("[SERVICE] Marking URL ID %d as completed (title: %s)", urlID, result.Title)
	}

	if err := s.db.Save(&url).Error; err != nil {
		log.Printf("[SERVICE] Failed to update URL status for ID %d: %v", urlID, err)
		return
	}

	log.Printf("[SERVICE] URL status updated successfully for ID %d", urlID)

	// Step 2: Save analysis results (if successful and no critical errors)
	if result.Error == "" {
		log.Printf("[SERVICE] Saving analysis results for URL ID %d", urlID)
		
		// Check if analysis already exists for this URL (due to uniqueIndex on URLID)
		var existingAnalysis models.AnalysisResult
		err := s.db.Where("url_id = ?", urlID).First(&existingAnalysis).Error
		
		analysis := &models.AnalysisResult{
			URLID:         urlID,
			Title:         result.Title,
			HTMLVersion:   result.HTMLVersion,
			InternalLinks: result.InternalLinks,
			ExternalLinks: result.ExternalLinks,
			BrokenLinks:   result.BrokenLinks,
			HasLoginForm:  result.HasLoginForm,
			H1Count:       result.HeadingCounts["h1"],
			H2Count:       result.HeadingCounts["h2"],
			H3Count:       result.HeadingCounts["h3"],
			H4Count:       result.HeadingCounts["h4"],
			H5Count:       result.HeadingCounts["h5"],
			H6Count:       result.HeadingCounts["h6"],
		}

		// Set analyzed time
		now := time.Now()
		analysis.AnalyzedAt = &now

		if err == gorm.ErrRecordNotFound {
			// Create new analysis
			log.Printf("[SERVICE] Creating new analysis result for URL ID %d", urlID)
			if err := s.db.Create(analysis).Error; err != nil {
				log.Printf("[SERVICE] Failed to create analysis result for URL ID %d: %v", urlID, err)
			} else {
				log.Printf("[SERVICE] New analysis result created successfully for URL ID %d", urlID)
			}
		} else if err == nil {
			// Update existing analysis
			log.Printf("[SERVICE] Updating existing analysis result for URL ID %d", urlID)
			analysis.ID = existingAnalysis.ID
			if err := s.db.Save(analysis).Error; err != nil {
				log.Printf("[SERVICE] Failed to update analysis result for URL ID %d: %v", urlID, err)
			} else {
				log.Printf("[SERVICE] Analysis result updated successfully for URL ID %d", urlID)
			}
		} else {
			log.Printf("[SERVICE] Error checking existing analysis for URL ID %d: %v", urlID, err)
		}
	}

	log.Printf("[SERVICE] Crawl result processing completed for URL ID %d", urlID)
}

// GetRunningAnalyses returns the count of currently running analyses for a user
func (s *URLService) GetRunningAnalyses(userID uint) (int64, error) {
	var count int64
	err := s.db.Model(&models.URL{}).Where("user_id = ? AND status = ?", userID, models.StatusRunning).Count(&count).Error
	if err != nil {
		return 0, fmt.Errorf("failed to count running analyses: %w", err)
	}
	return count, nil
}

// GetUserStats returns statistics for a user's URLs
func (s *URLService) GetUserStats(userID uint) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count URLs by status
	var urlCounts []struct {
		Status string
		Count  int64
	}

	err := s.db.Model(&models.URL{}).
		Select("status, count(*) as count").
		Where("user_id = ?", userID).
		Group("status").
		Scan(&urlCounts).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get URL counts: %w", err)
	}

	// Convert to map
	statusCounts := make(map[string]int64)
	for _, count := range urlCounts {
		statusCounts[count.Status] = count.Count
	}

	stats["status_counts"] = statusCounts
	stats["total_urls"] = statusCounts["queued"] + statusCounts["running"] + statusCounts["completed"] + statusCounts["error"]

	// Get recent activity (last 10 URLs)
	var recentURLs []models.URL
	err = s.db.Where("user_id = ?", userID).
		Order("updated_at DESC").
		Limit(10).
		Find(&recentURLs).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get recent URLs: %w", err)
	}

	stats["recent_activity"] = recentURLs

	return stats, nil
} 