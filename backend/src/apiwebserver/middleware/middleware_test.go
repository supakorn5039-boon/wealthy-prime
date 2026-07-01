package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/database/model"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func callRbac(actorRole model.UserRole, allowed ...model.UserRole) int {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Set(CtxRole, actorRole)

	Rbac(allowed...)(c)
	return w.Code
}

func TestRbac_AllowsMatchingRole(t *testing.T) {
	if status := callRbac(model.RoleAdmin, model.RoleAdmin); status != http.StatusOK {
		t.Errorf("admin accessing admin route: got %d, want 200", status)
	}
}

func TestRbac_AllowsAnyOfMultipleAllowed(t *testing.T) {
	if status := callRbac(model.RoleAgent, model.RoleAdmin, model.RoleAgent); status != http.StatusOK {
		t.Errorf("agent accessing admin-or-agent route: got %d, want 200", status)
	}
}

func TestRbac_RejectsNonMatchingRole(t *testing.T) {
	if status := callRbac(model.RoleUser, model.RoleAdmin); status != http.StatusForbidden {
		t.Errorf("user accessing admin-only route: got %d, want 403", status)
	}
}

func TestRbac_RejectsMissingRole(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)

	Rbac(model.RoleAdmin)(c)
	if w.Code != http.StatusForbidden {
		t.Errorf("missing role: got %d, want 403", w.Code)
	}
}
