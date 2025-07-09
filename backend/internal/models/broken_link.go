package models

import (
	"time"

	"gorm.io/gorm"
)

type BrokenLink struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	AnalysisID uint           `gorm:"not null;index" json:"analysis_id"`
	URL        string         `gorm:"not null;size:2048" json:"url"`
	StatusCode int            `gorm:"not null" json:"status_code"`
	Error      string         `gorm:"size:500" json:"error"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Analysis AnalysisResult `gorm:"foreignKey:AnalysisID" json:"analysis,omitempty"`
}

// TableName returns the table name for the BrokenLink model
func (BrokenLink) TableName() string {
	return "broken_links"
}
