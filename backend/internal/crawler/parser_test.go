package crawler

import (
	"strings"
	"testing"
)

func TestParseHTML(t *testing.T) {
	// Sample HTML for testing
	sampleHTML := `
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <meta name="description" content="A test page for HTML parsing">
    <meta name="keywords" content="test, html, parsing">
    <meta charset="utf-8">
</head>
<body>
    <header>
        <h1>Main Heading</h1>
        <nav>
            <a href="/page1">Internal Link</a>
            <a href="https://external.com">External Link</a>
        </nav>
    </header>
    <main>
        <h2>Subheading 1</h2>
        <h2>Subheading 2</h2>
        <h3>Sub-subheading</h3>
        
        <form id="login-form">
            <input type="email" name="email" placeholder="Email">
            <input type="password" name="password" placeholder="Password">
            <button type="submit">Login</button>
        </form>
    </main>
    <footer>
        <a href="mailto:test@example.com">Contact</a>
    </footer>
</body>
</html>`

	reader := strings.NewReader(sampleHTML)
	result, err := ParseHTML(reader, "https://example.com")

	if err != nil {
		t.Fatalf("Failed to parse HTML: %v", err)
	}

	// Test title extraction
	if result.Title != "Test Page" {
		t.Errorf("Expected title 'Test Page', got '%s'", result.Title)
	}

	// Test HTML version detection
	if result.HTMLVersion != "HTML5" {
		t.Errorf("Expected HTML version 'HTML5', got '%s'", result.HTMLVersion)
	}

	// Test heading counts
	expectedHeadings := map[string]int{
		"h1": 1,
		"h2": 2,
		"h3": 1,
		"h4": 0,
		"h5": 0,
		"h6": 0,
	}

	for tag, expectedCount := range expectedHeadings {
		if result.HeadingCounts[tag] != expectedCount {
			t.Errorf("Expected %d %s tags, got %d", expectedCount, tag, result.HeadingCounts[tag])
		}
	}

	// Test meta tags
	if result.MetaTags["description"] != "A test page for HTML parsing" {
		t.Errorf("Expected description meta tag, got '%s'", result.MetaTags["description"])
	}

	if result.MetaTags["keywords"] != "test, html, parsing" {
		t.Errorf("Expected keywords meta tag, got '%s'", result.MetaTags["keywords"])
	}

	// Test login form detection
	if !result.HasLoginForm {
		t.Error("Expected login form to be detected")
	}

	// Test link classification
	if len(result.InternalLinks) == 0 {
		t.Error("Expected to find internal links")
	}

	if len(result.ExternalLinks) == 0 {
		t.Error("Expected to find external links")
	}
}

func TestValidateURL(t *testing.T) {
	crawler := NewCrawlerService(nil)

	// Test valid URLs
	validURLs := []string{
		"https://example.com",
		"http://test.org",
		"https://sub.domain.com/path",
	}

	for _, url := range validURLs {
		_, err := crawler.ValidateURL(url)
		if err != nil {
			t.Errorf("Expected valid URL '%s' to pass validation, got error: %v", url, err)
		}
	}

	// Test invalid URLs
	invalidURLs := []string{
		"", // Empty URL
		"http://", // Missing host
	}

	for _, url := range invalidURLs {
		_, err := crawler.ValidateURL(url)
		if err == nil {
			t.Errorf("Expected invalid URL '%s' to fail validation", url)
		}
	}
} 