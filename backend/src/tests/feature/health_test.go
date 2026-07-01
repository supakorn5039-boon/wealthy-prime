package feature

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func TestHealthz(t *testing.T) {
	r := helpers.NewPublicEngine()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status: got %d, want 200", w.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON: %v (body=%s)", err, w.Body.String())
	}
	if body["status"] != "ok" {
		t.Errorf("status field: got %q, want %q", body["status"], "ok")
	}
}
