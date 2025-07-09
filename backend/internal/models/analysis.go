package models

import (
	"time"

	"gorm.io/gorm"
)

type AnalysisResult struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	URLID         uint           `gorm:"not null;uniqueIndex" json:"url_id"`
	HTMLVersion   string         `gorm:"size:50" json:"html_version"`
	Title         string         `gorm:"size:255" json:"title"`
	InternalLinks int            `gorm:"default:0" json:"internal_links"`
	ExternalLinks int            `gorm:"default:0" json:"external_links"`
	BrokenLinks   int            `gorm:"default:0" json:"broken_links"`
	HasLoginForm  bool           `gorm:"default:false" json:"has_login_form"`
	H1Count       int            `gorm:"default:0" json:"h1_count"`
	H2Count       int            `gorm:"default:0" json:"h2_count"`
	H3Count       int            `gorm:"default:0" json:"h3_count"`
	H4Count       int            `gorm:"default:0" json:"h4_count"`
	H5Count       int            `gorm:"default:0" json:"h5_count"`
	H6Count       int            `gorm:"default:0" json:"h6_count"`
	AnalyzedAt    *time.Time     `json:"analyzed_at"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	URL                URL          `gorm:"foreignKey:URLID" json:"url,omitempty"`
	BrokenLinksDetails []BrokenLink `gorm:"foreignKey:AnalysisID" json:"broken_links_details,omitempty"`
}

// TableName returns the table name for the AnalysisResult model
func (AnalysisResult) TableName() string {
	return "analysis_results"
}
