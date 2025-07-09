package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"

	"web-crawler-dashboard/internal/database"
)

func main() {
	// Connect to database
	if err := database.ConnectDatabase(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run database migrations
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Setup Gin router
	router := setupRouter()

	// Get port from environment
	port := getEnv("PORT", "8080")
	
	// Create server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	// Close database connection
	if err := database.CloseDatabase(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server exited")
}

func setupRouter() *gin.Engine {
	// Set Gin mode
	gin.SetMode(getEnv("GIN_MODE", "debug"))
	
	// Create router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Setup routes
	setupRoutes(router)

	return router
}

func setupRoutes(router *gin.Engine) {
	// API group
	api := router.Group("/api")
	
	// Health check endpoint
	api.GET("/health", healthCheck)
}

func healthCheck(c *gin.Context) {
	// Check database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"message":  "Database not connected",
			"database": "disconnected",
		})
		return
	}

	// Test database connectivity
	sqlDB, err := db.DB()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"message":  "Failed to get database instance",
			"database": "error",
		})
		return
	}

	if err := sqlDB.Ping(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "error",
			"message":  "Database ping failed",
			"database": "disconnected",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "ok",
		"message":  "Service is healthy",
		"database": "connected",
		"time":     time.Now().Unix(),
	})
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
} 