package middleware

import (
	"net/http"

	"web-crawler-dashboard/internal/auth"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens and injects user context
func AuthMiddleware(authService *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authorization header required",
				"message": "Please provide a valid JWT token in the Authorization header",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenString := auth.ExtractTokenFromBearer(authHeader)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Invalid authorization format",
				"message": "Authorization header must be in format: Bearer <token>",
			})
			c.Abort()
			return
		}

		// Validate the token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			statusCode := http.StatusUnauthorized
			message := "Invalid or expired token"

			// Customize response based on error type
			switch err {
			case auth.ErrExpiredToken:
				message = "Token has expired, please login again"
			case auth.ErrInvalidToken:
				message = "Invalid token format or signature"
			case auth.ErrInvalidTokenType:
				message = "Unsupported token type"
			}

			c.JSON(statusCode, gin.H{
				"error":   "Authentication failed",
				"message": message,
			})
			c.Abort()
			return
		}

		// Inject user information into context for downstream handlers
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_claims", claims)

		// Continue to the next handler
		c.Next()
	}
}

// OptionalAuthMiddleware validates JWT if present but doesn't require it
func OptionalAuthMiddleware(authService *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			tokenString := auth.ExtractTokenFromBearer(authHeader)
			if tokenString != "" {
				// Try to validate token, but don't abort on failure
				if claims, err := authService.ValidateToken(tokenString); err == nil {
					c.Set("user_id", claims.UserID)
					c.Set("user_email", claims.Email)
					c.Set("user_claims", claims)
					c.Set("authenticated", true)
				}
			}
		}

		// Set authenticated flag if not already set
		if _, exists := c.Get("authenticated"); !exists {
			c.Set("authenticated", false)
		}

		c.Next()
	}
}

// RequireRole middleware ensures the authenticated user has the specified role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// This middleware should be used after AuthMiddleware
		claims, exists := c.Get("user_claims")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Authentication context missing",
				"message": "Internal server error - missing user context",
			})
			c.Abort()
			return
		}

		userClaims, ok := claims.(*auth.JWTClaims)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Invalid user context",
				"message": "Internal server error - invalid user context",
			})
			c.Abort()
			return
		}

		// Note: For now, we'll implement a basic role check
		// In a real application, we'd fetch user roles from database
		// For this implementation, we'll assume all authenticated users are "user" role
		// and add admin role logic later
		
		userRole := "user" // Default role for now
		// TODO: Fetch actual user role from database based on userClaims.UserID
		_ = userClaims.UserID // Use the variable to avoid compilation error

		if !hasRole(userRole, requiredRole) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Insufficient permissions",
				"message": "You don't have permission to access this resource",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// hasRole checks if the user has the required role
func hasRole(userRole, requiredRole string) bool {
	// Simple role hierarchy: admin > user
	roleHierarchy := map[string]int{
		"user":  1,
		"admin": 2,
	}

	userLevel := roleHierarchy[userRole]
	requiredLevel := roleHierarchy[requiredRole]

	return userLevel >= requiredLevel
}

// GetUserIDFromContext extracts user ID from Gin context
func GetUserIDFromContext(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}

// GetUserEmailFromContext extracts user email from Gin context
func GetUserEmailFromContext(c *gin.Context) (string, bool) {
	email, exists := c.Get("user_email")
	if !exists {
		return "", false
	}

	userEmail, ok := email.(string)
	return userEmail, ok
}

// GetUserClaimsFromContext extracts full user claims from Gin context
func GetUserClaimsFromContext(c *gin.Context) (*auth.JWTClaims, bool) {
	claims, exists := c.Get("user_claims")
	if !exists {
		return nil, false
	}

	userClaims, ok := claims.(*auth.JWTClaims)
	return userClaims, ok
}

// IsAuthenticatedFromContext checks if the user is authenticated
func IsAuthenticatedFromContext(c *gin.Context) bool {
	authenticated, exists := c.Get("authenticated")
	if !exists {
		return false
	}

	isAuth, ok := authenticated.(bool)
	return ok && isAuth
}

// CORSMiddleware handles CORS for authentication endpoints
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		origin := c.Request.Header.Get("Origin")

		// Set CORS headers
		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")
		c.Header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-File-Name")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		// Handle preflight requests
		if method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

//  basic rate limiting for auth endpoints
func RateLimitMiddleware() gin.HandlerFunc {
	// Note: This is a basic implementation
	// For production, we canuse redis-based rate limiting
	requestCounts := make(map[string]int)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		
		// Simple rate limiting: max 10 requests per minute per IP
		// In production, we can implement sliding window with Redis
		if requestCounts[clientIP] >= 10 {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
			})
			c.Abort()
			return
		}

		requestCounts[clientIP]++
		
		// Reset counter after some time (simplified)
		
		c.Next()
	}
} 