package controller

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database/model"
)

// parseIntCSV converts "12,34,56" → []int32. Non-numeric tokens are skipped.
func parseIntCSV(s string) []int32 {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]int32, 0, len(parts))
	for _, p := range parts {
		n, err := strconv.Atoi(strings.TrimSpace(p))
		if err != nil || n <= 0 {
			continue
		}
		out = append(out, int32(n))
	}
	return out
}

type PropertyController struct {
	svc *service.PropertyService
}

func NewPropertyController() *PropertyController {
	return &PropertyController{svc: service.NewPropertyService()}
}

func (ctrl *PropertyController) RegisterRoutes(r *gin.RouterGroup) {
	props := r.Group("/properties", middleware.OptionalAuth())
	props.GET("", ctrl.listProperties)
	props.GET("/:id", ctrl.getProperty)
	props.GET("/:id/reviews", ctrl.getPropertyReviews)
}

// canSeeOwnerInfo returns true if the viewer is an agent or admin.
// Owner contact fields are restricted to those roles per requirement.md.
func canSeeOwnerInfo(role model.UserRole) bool {
	return role == model.RoleAgent || role == model.RoleAdmin
}

func (ctrl *PropertyController) listProperties(c *gin.Context) {
	filter := service.PropertyFilter{
		Type:      c.Query("type"),
		Location:  c.Query("location"),
		Search:    c.Query("search"),
		MinPrice:  c.Query("min_price"),
		MaxPrice:  c.Query("max_price"),
		Kind:      c.Query("kind"),
		Province:  c.Query("province"),
		District:  c.Query("district"),
		BtsMrtIDs: parseIntCSV(c.Query("bts_mrt_ids")),
	}

	dtos, err := ctrl.svc.ListProperties(filter)
	if err != nil {
		errorResponse(c, err)
		return
	}

	if !canSeeOwnerInfo(middleware.GetRole(c)) {
		for i := range dtos {
			dtos[i].StripOwnerInfo()
		}
	}

	successResponse(c, dtos)
}

func (ctrl *PropertyController) getProperty(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	dto, err := ctrl.svc.GetProperty(id)
	if err != nil {
		errorResponse(c, err)
		return
	}

	role := middleware.GetRole(c)
	viewerID := middleware.GetUserID(c)

	// Hide pending_approve from anyone other than the owning agent or admins.
	if dto.Status == model.StatusPendingApprove {
		isOwningAgent := role == model.RoleAgent && dto.AgentID != nil && *dto.AgentID == viewerID
		if role != model.RoleAdmin && !isOwningAgent {
			errorResponse(c, apperror.NotFound("property"))
			return
		}
	}

	if !canSeeOwnerInfo(role) {
		dto.StripOwnerInfo()
	}

	successResponse(c, dto)
}

func (ctrl *PropertyController) getPropertyReviews(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	reviews, err := ctrl.svc.GetPropertyReviews(id)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, reviews)
}

// parseUintParam extracts and parses a uint route parameter.
func parseUintParam(c *gin.Context, name string) (uint, error) {
	v := c.Param(name)
	n, err := strconv.ParseUint(v, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(n), nil
}
