package crawler

import (
	"fmt"
	"io"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

// ParseResult contains the result of HTML parsing
type ParseResult struct {
	Title         string
	HTMLVersion   string
	HeadingCounts map[string]int
	MetaTags      map[string]string
	InternalLinks []string
	ExternalLinks []string
	HasLoginForm  bool
	Error         string
}

// ParseHTML parses HTML content and extracts various information
func ParseHTML(htmlReader io.Reader, baseURL string) (*ParseResult, error) {
	// Parse base URL for link classification
	parsedBaseURL, err := url.Parse(baseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse base URL: %w", err)
	}

	// Load HTML document
	doc, err := goquery.NewDocumentFromReader(htmlReader)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML document: %w", err)
	}

	result := &ParseResult{
		HeadingCounts: make(map[string]int),
		MetaTags:      make(map[string]string),
		InternalLinks: []string{},
		ExternalLinks: []string{},
	}

	// Extract title
	result.Title = extractTitle(doc)

	// Detect HTML version
	result.HTMLVersion = detectHTMLVersion(doc)

	// Count headings
	result.HeadingCounts = extractHeadingCounts(doc)

	// Extract meta tags
	result.MetaTags = extractMetaTags(doc)

	// Extract and classify links
	result.InternalLinks, result.ExternalLinks = extractLinks(doc, parsedBaseURL)

	// Detect login forms
	result.HasLoginForm = detectLoginForm(doc)

	return result, nil
}

// extractTitle extracts the page title
func extractTitle(doc *goquery.Document) string {
	title := doc.Find("title").First().Text()
	title = strings.TrimSpace(title)
	
	// If no title tag found, try to get it from h1
	if title == "" {
		title = doc.Find("h1").First().Text()
		title = strings.TrimSpace(title)
	}

	// Limit title length
	if len(title) > 255 {
		title = title[:255]
	}

	return title
}

// detectHTMLVersion detects the HTML version from doctype
func detectHTMLVersion(doc *goquery.Document) string {
	// Check for HTML5 doctype (most common)
	if doc.Find("html").Length() > 0 {
		// Look for HTML5 specific elements or attributes
		if doc.Find("nav, article, section, aside, header, footer, main, figure, figcaption").Length() > 0 {
			return "HTML5"
		}
		
		if doc.Find("[role], [data-*]").Length() > 0 {
			return "HTML5"
		}
		
		// Check for meta charset (HTML5 style)
		if doc.Find("meta[charset]").Length() > 0 {
			return "HTML5"
		}
	}

	// Try to detect from DOCTYPE (this is limited since goquery doesn't parse DOCTYPE well)
	// In a real implementation, we might need to parse the raw HTML for DOCTYPE
	
	// Check for XHTML indicators
	htmlTag := doc.Find("html").First()
	if xmlns, exists := htmlTag.Attr("xmlns"); exists && xmlns == "http://www.w3.org/1999/xhtml" {
		return "XHTML 1.0"
	}

	// Default to HTML5 for modern websites
	return "HTML5"
}

// extractHeadingCounts counts heading elements H1-H6
func extractHeadingCounts(doc *goquery.Document) map[string]int {
	counts := map[string]int{
		"h1": 0,
		"h2": 0,
		"h3": 0,
		"h4": 0,
		"h5": 0,
		"h6": 0,
	}

	for i := 1; i <= 6; i++ {
		selector := fmt.Sprintf("h%d", i)
		count := doc.Find(selector).Length()
		counts[selector] = count
	}

	return counts
}

// extractMetaTags extracts important meta tags
func extractMetaTags(doc *goquery.Document) map[string]string {
	metaTags := make(map[string]string)

	// Extract common meta tags
	doc.Find("meta").Each(func(i int, s *goquery.Selection) {
		if name, exists := s.Attr("name"); exists {
			if content, exists := s.Attr("content"); exists {
				// Convert to lowercase for consistency
				name = strings.ToLower(name)
				switch name {
				case "description", "keywords", "author", "robots", "viewport":
					metaTags[name] = content
				}
			}
		}

		// Handle property-based meta tags (like Open Graph)
		if property, exists := s.Attr("property"); exists {
			if content, exists := s.Attr("content"); exists {
				property = strings.ToLower(property)
				switch property {
				case "og:title", "og:description", "og:type", "og:url", "og:image":
					metaTags[property] = content
				}
			}
		}

		// Handle charset
		if charset, exists := s.Attr("charset"); exists {
			metaTags["charset"] = charset
		}

		// Handle http-equiv
		if httpEquiv, exists := s.Attr("http-equiv"); exists {
			if content, exists := s.Attr("content"); exists {
				httpEquiv = strings.ToLower(httpEquiv)
				if httpEquiv == "content-type" || httpEquiv == "refresh" {
					metaTags[httpEquiv] = content
				}
			}
		}
	})

	return metaTags
}

// extractLinks extracts and classifies links as internal or external
func extractLinks(doc *goquery.Document, baseURL *url.URL) (internal []string, external []string) {
	seenInternal := make(map[string]bool)
	seenExternal := make(map[string]bool)

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists || href == "" {
			return
		}

		// Clean and normalize the URL
		href = strings.TrimSpace(href)
		
		// Skip javascript:, mailto:, tel:, etc.
		if strings.HasPrefix(href, "javascript:") || 
		   strings.HasPrefix(href, "mailto:") || 
		   strings.HasPrefix(href, "tel:") ||
		   strings.HasPrefix(href, "#") {
			return
		}

		// Parse the link URL
		linkURL, err := url.Parse(href)
		if err != nil {
			return
		}

		// Resolve relative URLs
		resolvedURL := baseURL.ResolveReference(linkURL)
		
		// Remove fragment for deduplication
		cleanURL := resolvedURL.Scheme + "://" + resolvedURL.Host + resolvedURL.Path
		if resolvedURL.RawQuery != "" {
			cleanURL += "?" + resolvedURL.RawQuery
		}

		// Classify as internal or external
		if resolvedURL.Host == baseURL.Host {
			// Internal link
			if !seenInternal[cleanURL] {
				internal = append(internal, cleanURL)
				seenInternal[cleanURL] = true
			}
		} else {
			// External link
			if !seenExternal[cleanURL] {
				external = append(external, cleanURL)
				seenExternal[cleanURL] = true
			}
		}
	})

	return internal, external
}

// detectLoginForm detects if the page contains a login form
func detectLoginForm(doc *goquery.Document) bool {
	// Look for password input fields
	passwordInputs := doc.Find("input[type='password']")
	if passwordInputs.Length() > 0 {
		return true
	}

	// Look for common login form patterns
	loginIndicators := []string{
		"form[action*='login']",
		"form[id*='login']",
		"form[class*='login']",
		"form[action*='signin']",
		"form[id*='signin']",
		"form[class*='signin']",
		"form[action*='auth']",
		"form[id*='auth']",
		"form[class*='auth']",
	}

	for _, selector := range loginIndicators {
		if doc.Find(selector).Length() > 0 {
			// Check if this form also has email/username inputs
			form := doc.Find(selector).First()
			emailInputs := form.Find("input[type='email'], input[type='text'][name*='email'], input[type='text'][name*='username'], input[type='text'][name*='user']")
			if emailInputs.Length() > 0 {
				return true
			}
		}
	}

	// Look for input fields with login-related names
	loginInputPatterns := []string{
		"input[name*='login']",
		"input[name*='signin']",
		"input[name*='username']",
		"input[name*='email']",
		"input[id*='login']",
		"input[id*='signin']",
		"input[id*='username']",
		"input[id*='email']",
	}

	for _, pattern := range loginInputPatterns {
		inputs := doc.Find(pattern)
		if inputs.Length() > 0 {
			// Check if there's also a password field nearby
			found := false
			inputs.Each(func(i int, s *goquery.Selection) {
				if found {
					return
				}
				form := s.Closest("form")
				if form.Length() > 0 {
					passwordFields := form.Find("input[type='password']")
					if passwordFields.Length() > 0 {
						found = true
					}
				}
			})
			if found {
				return true
			}
		}
	}

	// Look for common login button text
	loginButtonTexts := []string{"login", "log in", "signin", "sign in", "log on", "logon"}
	buttons := doc.Find("button, input[type='submit'], input[type='button']")
	
	found := false
	buttons.Each(func(i int, s *goquery.Selection) {
		if found {
			return
		}

		buttonText := strings.ToLower(strings.TrimSpace(s.Text()))
		value, _ := s.Attr("value")
		buttonValue := strings.ToLower(strings.TrimSpace(value))

		for _, loginText := range loginButtonTexts {
			if strings.Contains(buttonText, loginText) || strings.Contains(buttonValue, loginText) {
				// Check if this button is in a form with password input
				form := s.Closest("form")
				if form.Length() > 0 {
					passwordFields := form.Find("input[type='password']")
					if passwordFields.Length() > 0 {
						found = true
						return
					}
				}
			}
		}
	})

	return found
}

// SanitizeText cleans up extracted text content
func SanitizeText(text string) string {
	// Remove extra whitespace and normalize
	text = strings.TrimSpace(text)
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")
	return text
}

// IsValidURL checks if a URL is valid for crawling
func IsValidURL(rawURL string) bool {
	if rawURL == "" {
		return false
	}

	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	// Check scheme
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return false
	}

	// Check host
	if parsedURL.Host == "" {
		return false
	}

	return true
} 