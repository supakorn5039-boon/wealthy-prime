package security

import "testing"

func TestHashPassword_ProducesDifferentHashes(t *testing.T) {
	plain := "p@ssw0rd-123"
	h1, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	h2, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if h1 == h2 {
		t.Fatal("bcrypt should produce a different salt per call; got identical hashes")
	}
}

func TestCheckPassword_RoundTrip(t *testing.T) {
	plain := "p@ssw0rd-123"
	hash, err := HashPassword(plain)
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if !CheckPassword(hash, plain) {
		t.Fatal("CheckPassword should accept the correct password")
	}
	if CheckPassword(hash, "wrong-password") {
		t.Fatal("CheckPassword should reject an incorrect password")
	}
}
