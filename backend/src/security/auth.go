package security

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
)

var jwtKey []byte

func InitJWT() {
	jwtKey = []byte(config.App.Server.JWTSecret)
}

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
