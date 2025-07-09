package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"web-crawler-dashboard/internal/api/middleware"
	"web-crawler-dashboard/internal/models"
	"web-crawler-dashboard/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type URLHandler struct {
	db         *gorm.DB
	urlService *services.URLService
}

// NewURLHandler creates a new URL handler
func NewURLHandler(db *gorm.DB, urlService *services.URLService) *URLHandler {
	return &URLHandler{
		db:         db,
		urlService: urlService,
	}
}

// CreateURLRequest represents the request body for creating a URL
type CreateURLRequest struct {
	URL string `json:"url" binding:"required,url"`
}

// URLResponse represents the API response for URL operations
type URLResponse struct {
	ID        uint                `json:"id"`
	URL       string              `json:"url"`
	Title     string              `json:"title"`
	Status    models.URLStatus    `json:"status"`
	CreatedAt time.Time           `json:"created_at"`
	UpdatedAt time.Time           `json:"updated_at"`
	Analysis  *models.AnalysisResult `json:"analysis,omitempty"`
}

// URLListResponse represents the paginated URL list response
type URLListResponse struct {
	URLs       []URLResponse `json:"urls"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

// CreateURL creates a new URL for analysis
func (h *URLHandler) CreateURL(c *gin.Context) {
	var req CreateURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "validation_failed",
			"message": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Use service layer to create URL
	newURL, err := h.urlService.CreateURL(userID, req.URL)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "url_exists",
				"message": err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "invalid URL") {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_url",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to create URL",
		})
		return
	}

	response := URLResponse{
		ID:        newURL.ID,
		URL:       newURL.URL,
		Title:     newURL.Title,
		Status:    newURL.Status,
		CreatedAt: newURL.CreatedAt,
		UpdatedAt: newURL.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// GetURLs retrieves URLs for the authenticated user with pagination
func (h *URLHandler) GetURLs(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := strings.TrimSpace(c.Query("search"))
	status := c.Query("status")

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Use service layer to get URLs
	urls, total, err := h.urlService.GetURLs(userID, page, limit, search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to retrieve URLs",
		})
		return
	}

	// Convert to response format
	var urlResponses []URLResponse
	for _, url := range urls {
		response := URLResponse{
			ID:        url.ID,
			URL:       url.URL,
			Title:     url.Title,
			Status:    url.Status,
			CreatedAt: url.CreatedAt,
			UpdatedAt: url.UpdatedAt,
		}
		urlResponses = append(urlResponses, response)
	}

	// Calculate total pages
	totalPages := int((total + int64(limit) - 1) / int64(limit))

	response := URLListResponse{
		URLs:       urlResponses,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// GetURL retrieves a specific URL by ID
func (h *URLHandler) GetURL(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Get URL ID from params
	urlID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_id",
			"message": "Invalid URL ID",
		})
		return
	}

	// Find URL
	var url models.URL
	result := h.db.Where("id = ? AND user_id = ?", urlID, userID).Preload("Analysis").First(&url)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "url_not_found",
				"message": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "database_error",
			"message": "Failed to retrieve URL",
		})
		return
	}

	response := URLResponse{
		ID:        url.ID,
		URL:       url.URL,
		Title:     url.Title,
		Status:    url.Status,
		CreatedAt: url.CreatedAt,
		UpdatedAt: url.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteURL deletes a URL
func (h *URLHandler) DeleteURL(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Get URL ID from params
	urlID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_id",
			"message": "Invalid URL ID",
		})
		return
	}

	// Find URL first to check ownership and status
	var url models.URL
	result := h.db.Where("id = ? AND user_id = ?", urlID, userID).First(&url)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "url_not_found",
				"message": "URL not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "database_error",
			"message": "Failed to retrieve URL",
		})
		return
	}

	// Check if URL is currently being processed
	if url.Status == models.StatusRunning {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "url_processing",
			"message": "Cannot delete URL while analysis is running. Stop the analysis first.",
		})
		return
	}

	// Delete the URL (this will cascade delete analysis results due to foreign key constraints)
	if err := h.db.Delete(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "database_error",
			"message": "Failed to delete URL",
		})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// StartAnalysis triggers analysis for a URL
func (h *URLHandler) StartAnalysis(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Get URL ID from params
	urlID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_id",
			"message": "Invalid URL ID",
		})
		return
	}

	// Use service layer to start analysis
	err = h.urlService.StartAnalysis(c.Request.Context(), userID, uint(urlID))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "url_not_found",
				"message": err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "already running") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "analysis_running",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to start analysis",
		})
		return
	}

	// Get updated URL to return current status
	url, err := h.urlService.GetURL(userID, uint(urlID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Analysis started but failed to retrieve updated status",
		})
		return
	}

	response := URLResponse{
		ID:        url.ID,
		URL:       url.URL,
		Title:     url.Title,
		Status:    url.Status,
		CreatedAt: url.CreatedAt,
		UpdatedAt: url.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// StopAnalysis stops the analysis for a URL
func (h *URLHandler) StopAnalysis(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Get URL ID from params
	urlID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_id",
			"message": "Invalid URL ID",
		})
		return
	}

	// Use service layer to stop analysis
	err = h.urlService.StopAnalysis(userID, uint(urlID))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "url_not_found",
				"message": err.Error(),
			})
			return
		}
		if strings.Contains(err.Error(), "not running") {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "analysis_not_running",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to stop analysis",
		})
		return
	}

	// Get updated URL to return current status
	url, err := h.urlService.GetURL(userID, uint(urlID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Analysis stopped but failed to retrieve updated status",
		})
		return
	}

	response := URLResponse{
		ID:        url.ID,
		URL:       url.URL,
		Title:     url.Title,
		Status:    url.Status,
		CreatedAt: url.CreatedAt,
		UpdatedAt: url.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetAnalysisResult retrieves analysis results for a URL
func (h *URLHandler) GetAnalysisResult(c *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "unauthorized",
			"message": "User context not found",
		})
		return
	}

	// Get URL ID from params
	urlID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid_id",
			"message": "Invalid URL ID",
		})
		return
	}

	// Get URL details first
	url, err := h.urlService.GetURL(userID, uint(urlID))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "url_not_found",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to retrieve URL",
		})
		return
	}

	// Get analysis result using service layer
	analysis, err := h.urlService.GetAnalysisResult(userID, uint(urlID))
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "analysis_not_found",
				"message": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "service_error",
			"message": "Failed to retrieve analysis results",
		})
		return
	}

	// Create detailed response
	response := map[string]interface{}{
		"id":              url.ID,
		"url":             url.URL,
		"title":           analysis.Title,
		"status":          url.Status,
		"html_version":    analysis.HTMLVersion,
		"internal_links":  analysis.InternalLinks,
		"external_links":  analysis.ExternalLinks,
		"broken_links":    analysis.BrokenLinks,
		"has_login_form":  analysis.HasLoginForm,
		"headings": map[string]int{
			"h1": analysis.H1Count,
			"h2": analysis.H2Count,
			"h3": analysis.H3Count,
			"h4": analysis.H4Count,
			"h5": analysis.H5Count,
			"h6": analysis.H6Count,
		},
		"broken_links_details": analysis.BrokenLinksDetails,
		"analyzed_at":          analysis.AnalyzedAt,
	}

	c.JSON(http.StatusOK, response)
} 