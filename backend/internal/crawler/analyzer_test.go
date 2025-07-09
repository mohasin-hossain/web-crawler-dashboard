package crawler

import (
	"context"
	"testing"
	"time"
)

func TestLinkAnalyzer_AnalyzeLinks(t *testing.T) {
	config := DefaultConfig()
	analyzer := NewLinkAnalyzer(config)

	tests := []struct {
		name  string
		links []string
		want  int // expected number of broken links
	}{
		{
			name:  "empty links",
			links: []string{},
			want:  0,
		},
		{
			name: "valid links only",
			links: []string{
				"https://www.google.com",
				"https://github.com",
			},
			want: 0,
		},
		{
			name: "mixed valid and invalid links",
			links: []string{
				"https://www.google.com",
				"https://this-definitely-does-not-exist-12345.com",
				"https://httpstat.us/404",
			},
			want: 2, // The non-existent domain and 404 status
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			brokenLinks := analyzer.AnalyzeLinks(ctx, tt.links)
			
			if len(brokenLinks) < tt.want {
				t.Errorf("AnalyzeLinks() returned %d broken links, expected at least %d", len(brokenLinks), tt.want)
			}

			// Verify broken link structure
			for _, broken := range brokenLinks {
				if broken.URL == "" {
					t.Error("Broken link URL should not be empty")
				}
				if broken.Error == "" {
					t.Error("Broken link error should not be empty")
				}
			}
		})
	}
}

func TestClassifyLinks(t *testing.T) {
	baseURL := "https://example.com"
	links := []string{
		"https://example.com/page1",
		"https://example.com/page2",
		"/relative/path",
		"https://external.com/page",
		"https://another-external.com/page",
	}

	internal, external, err := ClassifyLinks(links, baseURL)
	if err != nil {
		t.Fatalf("ClassifyLinks() error = %v", err)
	}

	expectedInternal := 3 // Two absolute and one relative that resolves to internal
	expectedExternal := 2

	if len(internal) != expectedInternal {
		t.Errorf("Expected %d internal links, got %d", expectedInternal, len(internal))
	}

	if len(external) != expectedExternal {
		t.Errorf("Expected %d external links, got %d", expectedExternal, len(external))
	}
}

func TestDeduplicateLinks(t *testing.T) {
	links := []string{
		"https://example.com/page1",
		"https://example.com/page2",
		"https://example.com/page1", // duplicate
		"https://external.com/page",
		"https://external.com/page", // duplicate
	}

	unique := DeduplicateLinks(links)
	expected := 3

	if len(unique) != expected {
		t.Errorf("Expected %d unique links, got %d", expected, len(unique))
	}

	// Verify no duplicates
	seen := make(map[string]bool)
	for _, link := range unique {
		if seen[link] {
			t.Errorf("Found duplicate link after deduplication: %s", link)
		}
		seen[link] = true
	}
}

func TestFilterLinksForAnalysis(t *testing.T) {
	analyzer := NewLinkAnalyzer(nil)
	
	links := []string{
		"https://example.com/page1",           // should be kept
		"https://facebook.com/page",           // should be filtered
		"https://custom-domain.com/api",       // should be kept
		"https://github.com/user/repo",        // should be filtered
		"https://googleapis.com/maps/api",     // should be filtered
		"https://unknown-domain.org/contact",  // should be kept
	}

	filtered := analyzer.filterLinksForAnalysis(links)
	
	expected := 3 // example.com, custom-domain.com, unknown-domain.org
	if len(filtered) != expected {
		t.Errorf("Expected %d filtered links, got %d", expected, len(filtered))
	}

	// Verify the right links were kept
	for _, link := range filtered {
		if link == "https://facebook.com/page" || 
		   link == "https://github.com/user/repo" || 
		   link == "https://googleapis.com/maps/api" {
			t.Errorf("Link should have been filtered out: %s", link)
		}
	}
} 