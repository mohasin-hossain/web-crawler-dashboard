package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;not null;size:50" json:"username" binding:"required,min=3,max=50"`
	Email     string         `gorm:"uniqueIndex;not null;size:255" json:"email" binding:"required,email"`
	Password  string         `gorm:"not null;size:255" json:"-"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	URLs []URL `gorm:"foreignKey:UserID" json:"urls,omitempty"`
}

// TableName returns the table name for the User model
func (User) TableName() string {
	return "users"
}
