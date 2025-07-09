package auth

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents the claims structure for JWT tokens
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// JWT service errors
var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrExpiredToken     = errors.New("token has expired")
	ErrMissingSecret    = errors.New("JWT secret not configured")
	ErrInvalidTokenType = errors.New("invalid token type")
)

// JWTService handles JWT token operations
type JWTService struct {
	secretKey   []byte
	tokenExpiry time.Duration
}

// NewJWTService creates a new JWT service instance
func NewJWTService() (*JWTService, error) {
	// Get JWT secret from environment
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, ErrMissingSecret
	}

	// Get token expiry from environment (default: 24 hours)
	expiryStr := os.Getenv("JWT_EXPIRY_HOURS")
	expiry := 24 * time.Hour // default
	
	if expiryStr != "" {
		if hours, err := strconv.Atoi(expiryStr); err == nil {
			expiry = time.Duration(hours) * time.Hour
		}
	}

	return &JWTService{
		secretKey:   []byte(secret),
		tokenExpiry: expiry,
	}, nil
}

// GenerateToken creates a new JWT token for the given user
func (j *JWTService) GenerateToken(userID uint, email string) (string, error) {
	now := time.Now()
	
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.tokenExpiry)),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "web-crawler-dashboard",
			Subject:   strconv.Itoa(int(userID)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(j.secretKey)
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

// ValidateToken parses and validates a JWT token
func (j *JWTService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidTokenType
		}
		return j.secretKey, nil
	})

	if err != nil {
		// Check for specific JWT errors
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	// Extract and validate claims
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Additional validation can be added here
	if claims.UserID == 0 {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// RefreshToken generates a new token with extended expiry for valid tokens
func (j *JWTService) RefreshToken(tokenString string) (string, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return "", err
	}

	// Generate a new token with the same user info
	return j.GenerateToken(claims.UserID, claims.Email)
}

// ExtractTokenFromBearer extracts JWT token from "Bearer <token>" format
func ExtractTokenFromBearer(authHeader string) string {
	const bearerPrefix = "Bearer "
	if len(authHeader) > len(bearerPrefix) && authHeader[:len(bearerPrefix)] == bearerPrefix {
		return authHeader[len(bearerPrefix):]
	}
	return ""
}

// GetTokenExpiry returns the configured token expiry duration
func (j *JWTService) GetTokenExpiry() time.Duration {
	return j.tokenExpiry
} 