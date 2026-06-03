package middleware

import (
	"net/http"
	"slices"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

const (
	CtxUserID = "user_id"
	CtxRole   = "role"
)

// OptionalAuth reads a Bearer JWT IF present and sets user_id/role in the context.
// Unlike Protected, it never aborts: missing or invalid tokens just leave the
// context empty. Use this on public endpoints that change behavior based on role
// (e.g., hiding owner info from anonymous viewers).
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.Next()
			return
		}
		claims, err := security.ValidateToken(parts[1])
		if err != nil {
			c.Next()
			return
		}
		c.Set(CtxUserID, claims.ID)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}

// Protected validates a Bearer JWT and sets user_id, role, email in the Gin context.
func Protected() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}

		claims, err := security.ValidateToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		c.Set(CtxUserID, claims.ID)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}

// Rbac checks that the authenticated user's role is in the allowed list.
func Rbac(roles ...model.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(CtxRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no role found in context"})
			return
		}

		userRole, ok := roleVal.(model.UserRole)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid role type"})
			return
		}

		if userRole == model.RoleAdmin || slices.Contains(roles, userRole) {
			c.Next()
			return
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}

// SecurityHeaders adds basic security headers to every response.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Next()
	}
}

// GetUserID extracts the authenticated user ID from context.
func GetUserID(c *gin.Context) uint {
	v, _ := c.Get(CtxUserID)
	id, _ := v.(uint)
	return id
}

// GetRole extracts the authenticated user role from context.
func GetRole(c *gin.Context) model.UserRole {
	v, _ := c.Get(CtxRole)
	role, _ := v.(model.UserRole)
	return role
}
