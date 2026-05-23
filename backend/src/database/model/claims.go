package model

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	ID    uint     `json:"id"`
	Role  UserRole `json:"role"`
	Email string   `json:"email"`
	jwt.RegisteredClaims
}
