package feature

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/controller"
)

func TestGeocodeRouteRequiresAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api")
	controller.NewGeocodeController().RegisterRoutes(api)

	req := httptest.NewRequest(http.MethodGet, "/api/geocode/resolve?url=https://maps.app.goo.gl/abc", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated geocode resolve: got %d, want 401 (body=%s)", w.Code, w.Body.String())
	}
}
