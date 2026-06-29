package security

import (
	"strings"
	"testing"

	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
)

func setupJWT(t *testing.T) {
	t.Helper()
	config.App.Server.JWTSecret = "test-jwt-secret-do-not-use-in-prod"
	jwtKey = []byte(config.App.Server.JWTSecret)
}

func TestGenerateAndValidateJWT(t *testing.T) {
	setupJWT(t)

	token, err := GenerateJWT(42, model.RoleAdmin, "admin@example.com")
	if err != nil {
		t.Fatalf("GenerateJWT failed: %v", err)
	}
	if token == "" {
		t.Fatal("GenerateJWT returned empty token")
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.ID != 42 {
		t.Errorf("ID: got %d, want 42", claims.ID)
	}
	if claims.Role != model.RoleAdmin {
		t.Errorf("Role: got %s, want admin", claims.Role)
	}
	if claims.Email != "admin@example.com" {
		t.Errorf("Email: got %s, want admin@example.com", claims.Email)
	}
}

func TestValidateToken_RejectsTamperedToken(t *testing.T) {
	setupJWT(t)

	token, _ := GenerateJWT(1, model.RoleUser, "u@x.com")

	// Flip the FIRST char of the signature segment, not the last. The last
	// base64url char of an HS256 (32-byte) signature carries only 2 real
	// bits + 4 padding bits — so two different chars sharing the same top
	// two bits decode to identical bytes and the "tamper" silently no-ops.
	// The first char carries a full 6 bits, so a swap always changes the
	// decoded signature.
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("expected 3 JWT segments, got %d", len(parts))
	}
	flipped := byte('A')
	if parts[2][0] == 'A' {
		flipped = 'B'
	}
	parts[2] = string(flipped) + parts[2][1:]
	tampered := strings.Join(parts, ".")

	if _, err := ValidateToken(tampered); err == nil {
		t.Fatal("ValidateToken should reject tampered token")
	}
}

func TestValidateToken_RejectsWrongSecret(t *testing.T) {
	setupJWT(t)
	token, _ := GenerateJWT(1, model.RoleUser, "u@x.com")

	// Swap secret, then try to validate.
	jwtKey = []byte("different-secret")
	if _, err := ValidateToken(token); err == nil {
		t.Fatal("ValidateToken should reject token signed with old secret")
	}
}
