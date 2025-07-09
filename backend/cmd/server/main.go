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
	"github.com/joho/godotenv"

	"web-crawler-dashboard/internal/auth"
	"web-crawler-dashboard/internal/api/handlers"
	"web-crawler-dashboard/internal/api/middleware"
	"web-crawler-dashboard/internal/database"
	"web-crawler-dashboard/internal/services"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load("../.env"); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
		log.Println("Continuing with system environment variables...")
	}

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
	// Initialize auth service
	authService, err := auth.NewAuthService()
	if err != nil {
		log.Fatalf("Failed to initialize auth service: %v", err)
	}

	// Initialize services
	urlService := services.NewURLService(database.GetDB())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(database.GetDB(), authService)
	urlHandler := handlers.NewURLHandler(database.GetDB(), urlService)

	// API group
	api := router.Group("/api")
	
	// Health check endpoint
	api.GET("/health", healthCheck)

	// Authentication routes
	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
		authRoutes.POST("/refresh", authHandler.RefreshToken)
	}

	// Protected URL management routes
	urlRoutes := api.Group("/urls")
	urlRoutes.Use(middleware.AuthMiddleware(authService))
	{
		// CRUD operations
		urlRoutes.POST("", urlHandler.CreateURL)
		urlRoutes.GET("", urlHandler.GetURLs)
		urlRoutes.GET("/:id", urlHandler.GetURL)
		urlRoutes.DELETE("/:id", urlHandler.DeleteURL)
		
		// Analysis control endpoints
		urlRoutes.POST("/:id/analyze", urlHandler.StartAnalysis)
		urlRoutes.POST("/:id/stop", urlHandler.StopAnalysis)
		urlRoutes.GET("/:id/result", urlHandler.GetAnalysisResult)
	}

	log.Println("Routes initialized successfully with crawler integration")
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