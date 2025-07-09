package crawler

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// LinkAnalyzer provides link analysis functionality
type LinkAnalyzer struct {
	client         *http.Client
	maxConcurrent  int
	timeout        time.Duration
	userAgent      string
}

// NewLinkAnalyzer creates a new link analyzer
func NewLinkAnalyzer(config *CrawlerConfig) *LinkAnalyzer {
	if config == nil {
		config = DefaultConfig()
	}

	return &LinkAnalyzer{
		client: &http.Client{
			Timeout: 15 * time.Second, // Slightly longer timeout for link checking
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Allow one redirect for better link checking accuracy
				if len(via) >= 1 {
					return http.ErrUseLastResponse
				}
				return nil
			},
		},
		maxConcurrent: 8, // Limit concurrent requests to be respectful to servers
		timeout:       15 * time.Second, // Match client timeout
		userAgent:     config.UserAgent,
	}
}

// AnalyzeLinks checks a list of links for broken ones
func (la *LinkAnalyzer) AnalyzeLinks(ctx context.Context, links []string) []BrokenLinkInfo {
	if len(links) == 0 {
		return []BrokenLinkInfo{}
	}

	// Filter links to avoid checking common external services
	filteredLinks := la.filterLinksForAnalysis(links)
	
	var brokenLinks []BrokenLinkInfo
	var mutex sync.Mutex
	var wg sync.WaitGroup

	// Create a semaphore to limit concurrent requests
	semaphore := make(chan struct{}, la.maxConcurrent)

	for _, link := range filteredLinks {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Check if context is cancelled
			if ctx.Err() != nil {
				return
			}

			// Check the link
			if brokenInfo := la.checkLink(ctx, url); brokenInfo != nil {
				mutex.Lock()
				brokenLinks = append(brokenLinks, *brokenInfo)
				mutex.Unlock()
			}
		}(link)
	}

	wg.Wait()
	return brokenLinks
}

// filterLinksForAnalysis filters out links that are commonly reliable or not worth checking
func (la *LinkAnalyzer) filterLinksForAnalysis(links []string) []string {
	skipPatterns := []string{
		// Social media platforms (usually reliable)
		"facebook.com", "twitter.com", "instagram.com", "linkedin.com", "youtube.com",
		"tiktok.com", "pinterest.com", "snapchat.com", "whatsapp.com",
		
		// Common CDNs and reliable services
		"googleapis.com", "cloudflare.com", "jsdelivr.net", "unpkg.com",
		"cdnjs.cloudflare.com", "maxcdn.bootstrapcdn.com",
		
		// Major tech companies (usually reliable)
		"microsoft.com", "apple.com", "amazon.com", "google.com",
		
		// Common development tools
		"github.com", "gitlab.com", "bitbucket.com", "stackoverflow.com",
	}

	var filtered []string
	for _, link := range links {
		shouldSkip := false
		linkLower := strings.ToLower(link)
		
		for _, pattern := range skipPatterns {
			if strings.Contains(linkLower, pattern) {
				shouldSkip = true
				break
			}
		}
		
		if !shouldSkip {
			filtered = append(filtered, link)
		}
	}
	
	return filtered
}

// checkLink checks if a single link is broken
func (la *LinkAnalyzer) checkLink(ctx context.Context, linkURL string) *BrokenLinkInfo {
	// Validate URL first
	if !IsValidHTTPURL(linkURL) {
		return &BrokenLinkInfo{
			URL:        linkURL,
			StatusCode: 0,
			Error:      "Invalid URL format",
		}
	}

	// Try HEAD request first (more efficient)
	if brokenInfo := la.tryRequest(ctx, "HEAD", linkURL); brokenInfo == nil {
		return nil // Link is working
	}

	// If HEAD fails, try GET request (some servers don't support HEAD)
	return la.tryRequest(ctx, "GET", linkURL)
}

// tryRequest attempts a single HTTP request with retries
func (la *LinkAnalyzer) tryRequest(ctx context.Context, method, linkURL string) *BrokenLinkInfo {
	var lastErr error
	maxRetries := 2

	for attempt := 0; attempt <= maxRetries; attempt++ {
		// Check context first
		if ctx.Err() != nil {
			return &BrokenLinkInfo{
				URL:        linkURL,
				StatusCode: 0,
				Error:      "Request cancelled",
			}
		}

		// Create request with context
		req, err := http.NewRequestWithContext(ctx, method, linkURL, nil)
		if err != nil {
			return &BrokenLinkInfo{
				URL:        linkURL,
				StatusCode: 0,
				Error:      fmt.Sprintf("Failed to create request: %v", err),
			}
		}

		// Set headers
		req.Header.Set("User-Agent", la.userAgent)
		req.Header.Set("Accept", "*/*")
		req.Header.Set("Cache-Control", "no-cache")

		// Perform request
		resp, err := la.client.Do(req)
		if err != nil {
			lastErr = err
			if attempt < maxRetries {
				// Brief delay before retry
				select {
				case <-ctx.Done():
					return &BrokenLinkInfo{
						URL:        linkURL,
						StatusCode: 0,
						Error:      "Request cancelled",
					}
				case <-time.After(time.Millisecond * 500):
					continue
				}
			}
			continue
		}

		defer resp.Body.Close()

		// Check status code
		if resp.StatusCode >= 400 {
			return &BrokenLinkInfo{
				URL:        linkURL,
				StatusCode: resp.StatusCode,
				Error:      fmt.Sprintf("HTTP %d: %s", resp.StatusCode, http.StatusText(resp.StatusCode)),
			}
		}

		// Success - link is working
		return nil
	}

	// All attempts failed
	return &BrokenLinkInfo{
		URL:        linkURL,
		StatusCode: 0,
		Error:      fmt.Sprintf("Request failed after %d attempts: %v", maxRetries+1, lastErr),
	}
}

// ClassifyLinks separates internal and external links based on base URL
func ClassifyLinks(links []string, baseURL string) (internal []string, external []string, err error) {
	parsedBase, err := url.Parse(baseURL)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid base URL: %w", err)
	}

	for _, link := range links {
		parsedLink, err := url.Parse(link)
		if err != nil {
			continue // Skip invalid URLs
		}

		// Resolve relative URLs
		resolvedLink := parsedBase.ResolveReference(parsedLink)

		if resolvedLink.Host == parsedBase.Host {
			internal = append(internal, resolvedLink.String())
		} else {
			external = append(external, resolvedLink.String())
		}
	}

	return internal, external, nil
}

// GetLinkDomain extracts the domain from a URL
func GetLinkDomain(linkURL string) (string, error) {
	parsedURL, err := url.Parse(linkURL)
	if err != nil {
		return "", err
	}
	return parsedURL.Host, nil
}

// IsValidHTTPURL checks if a URL is a valid HTTP/HTTPS URL
func IsValidHTTPURL(rawURL string) bool {
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	return parsedURL.Scheme == "http" || parsedURL.Scheme == "https"
}

// DeduplicateLinks removes duplicate URLs from a slice
func DeduplicateLinks(links []string) []string {
	seen := make(map[string]bool)
	var unique []string

	for _, link := range links {
		if !seen[link] {
			seen[link] = true
			unique = append(unique, link)
		}
	}

	return unique
} 