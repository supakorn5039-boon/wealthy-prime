package service

import (
	"strings"
	"testing"

	"github.com/wealthy-prime/backend/src/config"
)

func setupReviewSecret(t *testing.T) {
	t.Helper()
	config.App.Server.ReviewSecret = "test-review-secret"
}

func TestReviewToken_RoundTrip(t *testing.T) {
	setupReviewSecret(t)

	token := signReviewToken(42, 7)
	if !strings.Contains(token, ".") {
		t.Fatalf("token should be payload.signature; got %q", token)
	}

	propID, agentID, err := ParseReviewToken(token)
	if err != nil {
		t.Fatalf("ParseReviewToken failed: %v", err)
	}
	if propID != 42 {
		t.Errorf("propertyID: got %d, want 42", propID)
	}
	if agentID != 7 {
		t.Errorf("agentID: got %d, want 7", agentID)
	}
}

func TestReviewToken_RejectsTamperedPayload(t *testing.T) {
	setupReviewSecret(t)

	token := signReviewToken(42, 7)
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		t.Fatalf("expected payload.sig; got %q", token)
	}

	wrongPayload := signReviewToken(999, 7)
	wrongPayloadPart := strings.Split(wrongPayload, ".")[0]
	tampered := wrongPayloadPart + "." + parts[1]

	if _, _, err := ParseReviewToken(tampered); err == nil {
		t.Fatal("ParseReviewToken should reject tampered payload")
	}
}

func TestReviewToken_RejectsWrongSecret(t *testing.T) {
	setupReviewSecret(t)
	token := signReviewToken(42, 7)

	config.App.Server.ReviewSecret = "different-secret"
	if _, _, err := ParseReviewToken(token); err == nil {
		t.Fatal("ParseReviewToken should reject token signed with old secret")
	}
}

func TestReviewToken_RejectsMalformed(t *testing.T) {
	setupReviewSecret(t)

	cases := []string{"", "no-dot", "too.many.dots.here", "...."}
	for _, c := range cases {
		if _, _, err := ParseReviewToken(c); err == nil {
			t.Errorf("ParseReviewToken should reject %q", c)
		}
	}
}
