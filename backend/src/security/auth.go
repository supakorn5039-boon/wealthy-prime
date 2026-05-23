package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
)

var jwtKey []byte

func init() {
	// Deferred init: key is loaded when config is available.
	// Call InitJWT() after config.Load().
}

// InitJWT must be called once after config.Load().
func InitJWT() {
	jwtKey = []byte(config.App.Server.JWTSecret)
}

// GenerateJWT creates a signed HS256 JWT valid for 72 hours.
func GenerateJWT(id uint, role model.UserRole, email string) (string, error) {
	if len(jwtKey) == 0 {
		InitJWT()
	}
	claims := &model.Claims{
		ID:    id,
		Role:  role,
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// ValidateToken parses and verifies a JWT string, returning its claims.
func ValidateToken(tokenString string) (*model.Claims, error) {
	if len(jwtKey) == 0 {
		InitJWT()
	}
	claims := &model.Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtKey, nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
