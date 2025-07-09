package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"web-crawler-dashboard/internal/models"
)

var DB *gorm.DB

// ConnectDatabase initializes the database connection
func ConnectDatabase() error {
	// Get required environment variables (no defaults for sensitive data)
	dbUser := getRequiredEnv("DB_USER")
	dbPassword := getRequiredEnv("DB_PASSWORD")
	dbName := getRequiredEnv("DB_NAME")
	
	// Get optional environment variables with safe defaults
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")

	// Build DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)
	if getEnv("GIN_MODE", "debug") == "release" {
		gormLogger = logger.Default.LogMode(logger.Silent)
	}

	// Connect to database with retries
	var err error
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
			Logger: gormLogger,
		})
		
		if err == nil {
			log.Println("Database connected successfully")
			break
		}
		
		log.Printf("Failed to connect to database (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			time.Sleep(time.Duration(i+1) * 2 * time.Second)
		}
	}
	
	if err != nil {
		return fmt.Errorf("failed to connect to database after %d attempts: %v", maxRetries, err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return nil
}

// AutoMigrate runs database migrations
func AutoMigrate() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	log.Println("Running database migrations...")
	
	// Migrate models in proper order to handle foreign key dependencies
	err := DB.AutoMigrate(
		&models.User{},
		&models.URL{},
		&models.AnalysisResult{},
		&models.BrokenLink{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to run database migrations: %v", err)
	}
	
	log.Println("Database migrations completed successfully")
	return nil
}

// getEnv gets environment variable with default value (for non-sensitive config)
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getRequiredEnv gets required environment variable (no default for sensitive data)
func getRequiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return value
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}

// CloseDatabase closes the database connection
func CloseDatabase() error {
	if DB == nil {
		return nil
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	
	return sqlDB.Close()
}
