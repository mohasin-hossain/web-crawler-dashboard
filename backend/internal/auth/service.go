package auth

import (
	"errors"
	"fmt"
	"regexp"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// Password security configuration
const (
	BcryptCost = 12

	// Password requirements
	MinPasswordLength = 8
	MaxPasswordLength = 128
)

// Password validation errors
var (
	ErrPasswordTooShort    = fmt.Errorf("password must be at least %d characters long", MinPasswordLength)
	ErrPasswordTooLong     = fmt.Errorf("password must be no more than %d characters long", MaxPasswordLength)
	ErrPasswordNoUppercase = errors.New("password must contain at least one uppercase letter")
	ErrPasswordNoLowercase = errors.New("password must contain at least one lowercase letter")
	ErrPasswordNoDigit     = errors.New("password must contain at least one digit")
	ErrPasswordNoSpecial   = errors.New("password must contain at least one special character")
	ErrPasswordCommon      = errors.New("password is too common or weak")
	ErrPasswordMismatch    = errors.New("password does not match")
)

// AuthService handles authentication operations
type AuthService struct {
	jwtService *JWTService
}

// NewAuthService creates a new authentication service
func NewAuthService() (*AuthService, error) {
	jwtService, err := NewJWTService()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize JWT service: %w", err)
	}

	return &AuthService{
		jwtService: jwtService,
	}, nil
}

// HashPassword securely hashes a password using bcrypt
func (a *AuthService) HashPassword(password string) (string, error) {
	// Validate password strength first
	if err := a.ValidatePasswordStrength(password); err != nil {
		return "", err
	}

	// Generate bcrypt hash
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedBytes), nil
}

// ComparePassword verifies a password against its hash
func (a *AuthService) ComparePassword(hashedPassword, password string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return ErrPasswordMismatch
		}
		return fmt.Errorf("password comparison failed: %w", err)
	}
	return nil
}

// ValidatePasswordStrength checks if a password meets security requirements
func (a *AuthService) ValidatePasswordStrength(password string) error {
	// Check length
	if len(password) < MinPasswordLength {
		return ErrPasswordTooShort
	}
	if len(password) > MaxPasswordLength {
		return ErrPasswordTooLong
	}

	// Check character requirements
	var (
		hasUpper   = false
		hasLower   = false
		hasDigit   = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return ErrPasswordNoUppercase
	}
	if !hasLower {
		return ErrPasswordNoLowercase
	}
	if !hasDigit {
		return ErrPasswordNoDigit
	}
	if !hasSpecial {
		return ErrPasswordNoSpecial
	}

	// Check for common patterns
	if err := a.checkCommonPatterns(password); err != nil {
		return err
	}

	return nil
}

// checkCommonPatterns validates against common weak password patterns
func (a *AuthService) checkCommonPatterns(password string) error {
	// List of common weak patterns
	weakPatterns := []string{
		`^password`,
		`^123456`,
		`^qwerty`,
		`^admin`,
		`^letmein`,
		`^welcome`,
		`(.)\1{3,}`, // Repeated characters (aaaa, 1111, etc.)
	}

	for _, pattern := range weakPatterns {
		matched, err := regexp.MatchString(pattern, password)
		if err != nil {
			continue // Skip malformed patterns
		}
		if matched {
			return ErrPasswordCommon
		}
	}

	return nil
}

// GenerateToken creates a JWT token for authenticated user
func (a *AuthService) GenerateToken(userID uint, email string) (string, error) {
	return a.jwtService.GenerateToken(userID, email)
}

// ValidateToken validates a JWT token and returns user claims
func (a *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	return a.jwtService.ValidateToken(tokenString)
}

// RefreshToken generates a new token for valid existing token
func (a *AuthService) RefreshToken(tokenString string) (string, error) {
	return a.jwtService.RefreshToken(tokenString)
}

// GetJWTService returns the underlying JWT service
func (a *AuthService) GetJWTService() *JWTService {
	return a.jwtService
}

// PasswordStrengthScore returns a score (0-100) indicating password strength
func (a *AuthService) PasswordStrengthScore(password string) int {
	score := 0

	// Length scoring
	length := len(password)
	switch {
	case length >= 12:
		score += 25
	case length >= 10:
		score += 20
	case length >= 8:
		score += 15
	default:
		return 0 // Too short
	}

	// Character variety scoring
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if hasUpper {
		score += 15
	}
	if hasLower {
		score += 15
	}
	if hasDigit {
		score += 15
	}
	if hasSpecial {
		score += 20
	}

	// Complexity bonus
	uniqueChars := make(map[rune]bool)
	for _, char := range password {
		uniqueChars[char] = true
	}
	
	if len(uniqueChars) >= len(password)*3/4 {
		score += 10 // High character diversity
	}

	// Cap at 100
	if score > 100 {
		score = 100
	}

	return score
} 