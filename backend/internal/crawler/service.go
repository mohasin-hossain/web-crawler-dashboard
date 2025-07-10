package crawler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"web-crawler-dashboard/internal/models"
)

// CrawlerConfig holds configuration for the crawler
type CrawlerConfig struct {
	Timeout         time.Duration
	UserAgent       string
	MaxRedirects    int
	FollowRedirects bool
	MaxRetries      int
	RetryDelay      time.Duration
}

// DefaultConfig returns a default crawler configuration
func DefaultConfig() *CrawlerConfig {
	return &CrawlerConfig{
		Timeout:         30 * time.Second,
		UserAgent:       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
		MaxRedirects:    5,
		FollowRedirects: true,
		MaxRetries:      3,
		RetryDelay:      2 * time.Second, // Increased delay to avoid rate limiting
	}
}

// CrawlerService provides web crawling functionality
type CrawlerService struct {
	config *CrawlerConfig
	client *http.Client
	jobs   map[uint]context.CancelFunc // Track running jobs for cancellation
}

// NewCrawlerService creates a new crawler service with the given configuration
func NewCrawlerService(config *CrawlerConfig) *CrawlerService {
	if config == nil {
		config = DefaultConfig()
	}

	// Create HTTP client with timeout and redirect policy
	client := &http.Client{
		Timeout: config.Timeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if !config.FollowRedirects {
				return http.ErrUseLastResponse
			}
			if len(via) >= config.MaxRedirects {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	return &CrawlerService{
		config: config,
		client: client,
		jobs:   make(map[uint]context.CancelFunc),
	}
}

// ValidateURL validates and sanitizes a URL
func (c *CrawlerService) ValidateURL(rawURL string) (*url.URL, error) {
	// Trim whitespace
	rawURL = strings.TrimSpace(rawURL)
	
	if rawURL == "" {
		return nil, fmt.Errorf("URL cannot be empty")
	}

	// Add scheme if missing
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	// Parse URL
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL format: %w", err)
	}

	// Validate scheme
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return nil, fmt.Errorf("unsupported URL scheme: %s", parsedURL.Scheme)
	}

	// Validate host
	if parsedURL.Host == "" {
		return nil, fmt.Errorf("URL must have a valid host")
	}

	// Sanitize URL (remove fragments, normalize)
	parsedURL.Fragment = ""
	
	return parsedURL, nil
}

// CrawlResult contains the result of a crawling operation
type CrawlResult struct {
	URL           string
	StatusCode    int
	Title         string
	HTMLVersion   string
	InternalLinks int
	ExternalLinks int
	BrokenLinks   int
	HasLoginForm  bool
	HeadingCounts map[string]int
	MetaTags      map[string]string
	BrokenLinksDetails []BrokenLinkInfo
	Error         string
}

// BrokenLinkInfo contains information about a broken link
type BrokenLinkInfo struct {
	URL        string
	StatusCode int
	Error      string
}

// CrawlAsync starts an asynchronous crawl operation
func (c *CrawlerService) CrawlAsync(ctx context.Context, urlID uint, targetURL string, resultCallback func(*CrawlResult)) error {
	// Validate URL first
	parsedURL, err := c.ValidateURL(targetURL)
	if err != nil {
		return fmt.Errorf("URL validation failed: %w", err)
	}

	// Create a cancellable context for this job
	jobCtx, cancel := context.WithCancel(ctx)
	
	// Store the cancel function for this job
	c.jobs[urlID] = cancel

	// Start crawling in a goroutine
	go func() {
		defer func() {
			// Clean up job tracking
			delete(c.jobs, urlID)
			// Don't call cancel() here - that would cancel our own context!
		}()

		result := c.crawlURL(jobCtx, parsedURL.String())
		
		// Always call the callback, even if there was an error or cancellation
		// The callback needs to update the URL status regardless of success/failure
		resultCallback(result)
	}()

	return nil
}

// StopCrawl stops a running crawl operation
func (c *CrawlerService) StopCrawl(urlID uint) error {
	if cancel, exists := c.jobs[urlID]; exists {
		cancel()
		delete(c.jobs, urlID)
		return nil
	}
	return fmt.Errorf("no running crawl job found for URL ID %d", urlID)
}

// IsRunning checks if a crawl is currently running for the given URL ID
func (c *CrawlerService) IsRunning(urlID uint) bool {
	_, exists := c.jobs[urlID]
	return exists
}

// crawlURL performs the actual crawling of a URL
func (c *CrawlerService) crawlURL(ctx context.Context, targetURL string) *CrawlResult {
	log.Printf("[CRAWLER] Starting crawl for URL: %s", targetURL)
	
	result := &CrawlResult{
		URL:           targetURL,
		HeadingCounts: make(map[string]int),
		MetaTags:      make(map[string]string),
	}

	// Check context first
	if ctx.Err() != nil {
		result.Error = "Crawl was cancelled"
		log.Printf("[CRAWLER] Crawl cancelled for URL: %s", targetURL)
		return result
	}

	// Create request with context
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		log.Printf("[CRAWLER] Failed to create request for URL %s: %v", targetURL, err)
		return result
	}

	// Set browser-like headers to avoid bot detection
	req.Header.Set("User-Agent", c.config.UserAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Cache-Control", "max-age=0")
	
	log.Printf("[CRAWLER] Making HTTP request to: %s", targetURL)

	// Perform request with retries
	var resp *http.Response
	for attempt := 0; attempt <= c.config.MaxRetries; attempt++ {
		if ctx.Err() != nil {
			result.Error = "Crawl was cancelled"
			return result
		}

		resp, err = c.client.Do(req)
		if err == nil {
			break
		}

		if attempt < c.config.MaxRetries {
			select {
			case <-ctx.Done():
				result.Error = "Crawl was cancelled"
				return result
			case <-time.After(c.config.RetryDelay):
				continue
			}
		}
	}

	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch URL after %d attempts: %v", c.config.MaxRetries+1, err)
		log.Printf("[CRAWLER] HTTP request failed for URL %s after %d attempts: %v", targetURL, c.config.MaxRetries+1, err)
		return result
	}

	defer resp.Body.Close()
	result.StatusCode = resp.StatusCode
	log.Printf("[CRAWLER] HTTP response for URL %s: status=%d", targetURL, resp.StatusCode)

	// Check if response is HTML
	contentType := resp.Header.Get("Content-Type")
	log.Printf("[CRAWLER] Content-Type for URL %s: %s", targetURL, contentType)
	if !strings.Contains(strings.ToLower(contentType), "text/html") {
		result.Error = fmt.Sprintf("URL does not return HTML content (Content-Type: %s)", contentType)
		log.Printf("[CRAWLER] Invalid content type for URL %s: %s", targetURL, contentType)
		return result
	}

	// Parse HTML content
	log.Printf("[CRAWLER] Parsing HTML content for URL: %s", targetURL)
	parseResult, err := ParseHTML(resp.Body, targetURL)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		log.Printf("[CRAWLER] HTML parsing failed for URL %s: %v", targetURL, err)
		return result
	}

	// Populate result with parsed data
	result.Title = parseResult.Title
	result.HTMLVersion = parseResult.HTMLVersion
	result.HeadingCounts = parseResult.HeadingCounts
	result.MetaTags = parseResult.MetaTags
	result.HasLoginForm = parseResult.HasLoginForm
	result.InternalLinks = len(parseResult.InternalLinks)
	result.ExternalLinks = len(parseResult.ExternalLinks)
	
	log.Printf("[CRAWLER] HTML parsed successfully for URL %s: title='%s', internal=%d, external=%d", 
		targetURL, result.Title, result.InternalLinks, result.ExternalLinks)

	// Perform advanced link analysis with broken link detection
	allLinks := append(parseResult.InternalLinks, parseResult.ExternalLinks...)
	
	// Deduplicate links before analysis
	allLinks = DeduplicateLinks(allLinks)
	
	// Create link analyzer and check for broken links
	if len(allLinks) > 0 && ctx.Err() == nil {
		linkAnalyzer := NewLinkAnalyzer(c.config)
		result.BrokenLinksDetails = linkAnalyzer.AnalyzeLinks(ctx, allLinks)
		result.BrokenLinks = len(result.BrokenLinksDetails)
	} else {
		result.BrokenLinks = 0
		result.BrokenLinksDetails = []BrokenLinkInfo{}
	}

	return result
}

// ConvertToAnalysisResult converts CrawlResult to database model
func (c *CrawlerService) ConvertToAnalysisResult(crawlResult *CrawlResult, urlID uint) *models.AnalysisResult {
	analysis := &models.AnalysisResult{
		URLID:         urlID,
		Title:         crawlResult.Title,
		HTMLVersion:   crawlResult.HTMLVersion,
		InternalLinks: crawlResult.InternalLinks,
		ExternalLinks: crawlResult.ExternalLinks,
		BrokenLinks:   crawlResult.BrokenLinks,
		HasLoginForm:  crawlResult.HasLoginForm,
		H1Count:       crawlResult.HeadingCounts["h1"],
		H2Count:       crawlResult.HeadingCounts["h2"],
		H3Count:       crawlResult.HeadingCounts["h3"],
		H4Count:       crawlResult.HeadingCounts["h4"],
		H5Count:       crawlResult.HeadingCounts["h5"],
		H6Count:       crawlResult.HeadingCounts["h6"],
	}

	// Set analyzed time
	now := time.Now()
	analysis.AnalyzedAt = &now

	return analysis
}

// ConvertToBrokenLinks converts broken link info to database models
func (c *CrawlerService) ConvertToBrokenLinks(crawlResult *CrawlResult, analysisID uint) []models.BrokenLink {
	var brokenLinks []models.BrokenLink
	
	for _, linkInfo := range crawlResult.BrokenLinksDetails {
		brokenLink := models.BrokenLink{
			AnalysisID: analysisID,
			URL:        linkInfo.URL,
			StatusCode: linkInfo.StatusCode,
			Error:      linkInfo.Error,
		}
		brokenLinks = append(brokenLinks, brokenLink)
	}
	
	return brokenLinks
} 