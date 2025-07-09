package crawler

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
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
			Timeout: config.Timeout,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Don't follow redirects for link checking (too many redirects might indicate issues)
				return http.ErrUseLastResponse
			},
		},
		maxConcurrent: 10, // Limit concurrent requests to be respectful
		timeout:       10 * time.Second, // Shorter timeout for link checking
		userAgent:     config.UserAgent,
	}
}

// AnalyzeLinks checks a list of links for broken ones
func (la *LinkAnalyzer) AnalyzeLinks(ctx context.Context, links []string) []BrokenLinkInfo {
	if len(links) == 0 {
		return []BrokenLinkInfo{}
	}

	var brokenLinks []BrokenLinkInfo
	var mutex sync.Mutex
	var wg sync.WaitGroup

	// Create a semaphore to limit concurrent requests
	semaphore := make(chan struct{}, la.maxConcurrent)

	for _, link := range links {
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

// checkLink checks if a single link is broken
func (la *LinkAnalyzer) checkLink(ctx context.Context, linkURL string) *BrokenLinkInfo {
	// Create request with context
	req, err := http.NewRequestWithContext(ctx, "HEAD", linkURL, nil)
	if err != nil {
		// Try with GET if HEAD fails
		req, err = http.NewRequestWithContext(ctx, "GET", linkURL, nil)
		if err != nil {
			return &BrokenLinkInfo{
				URL:        linkURL,
				StatusCode: 0,
				Error:      fmt.Sprintf("Failed to create request: %v", err),
			}
		}
	}

	// Set user agent
	req.Header.Set("User-Agent", la.userAgent)

	// Perform request
	resp, err := la.client.Do(req)
	if err != nil {
		return &BrokenLinkInfo{
			URL:        linkURL,
			StatusCode: 0,
			Error:      fmt.Sprintf("Request failed: %v", err),
		}
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

	// Link is okay
	return nil
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