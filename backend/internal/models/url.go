package models

import (
	"time"

	"gorm.io/gorm"
)

type URLStatus string

const (
	StatusQueued     URLStatus = "queued"
	StatusProcessing URLStatus = "processing"
	StatusCompleted  URLStatus = "completed"
	StatusError      URLStatus = "error"
)

type URL struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	URL       string         `gorm:"not null;size:2048" json:"url" binding:"required,url"`
	Title     string         `gorm:"size:255" json:"title"`
	Status    URLStatus      `gorm:"not null;default:'queued'" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User     User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Analysis *AnalysisResult `gorm:"foreignKey:URLID" json:"analysis,omitempty"`
}

// TableName returns the table name for the URL model
func (URL) TableName() string {
	return "urls"
}
