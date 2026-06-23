// Package helpers provides shared setup for feature tests:
//   - newTestEngine() returns a Gin engine with public (no-DB) routes mounted
//   - feature/* tests use it via httptest to exercise the HTTP layer without
//     standing up a full server
//
// DB-backed tests (booking flow, audit assertions) are gated behind the
// `integration` build tag — they need a live test postgres reachable via
// the TEST_DATABASE_URL env var. See tests/README.md.
package helpers

import (
	"github.com/gin-gonic/gin"
)

// NewPublicEngine returns a minimal Gin engine wired with only the no-DB
// endpoints (currently /healthz). Use for fast smoke / contract checks.
func NewPublicEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	return r
}
