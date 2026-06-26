package controller

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
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

// parseStringCSV trims and drops empty tokens.
func parseStringCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// parsePriceRanges accepts "min-max,min-max" where either side may be empty
// to denote unbounded (e.g. "-5000" = up to 5000, "50000-" = 50000+).
func parsePriceRanges(s string) []service.PriceRange {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]service.PriceRange, 0, len(parts))
	for _, p := range parts {
		bits := strings.SplitN(strings.TrimSpace(p), "-", 2)
		if len(bits) != 2 {
			continue
		}
		var r service.PriceRange
		if v, err := strconv.ParseFloat(strings.TrimSpace(bits[0]), 64); err == nil {
			r.Min = &v
		}
		if v, err := strconv.ParseFloat(strings.TrimSpace(bits[1]), 64); err == nil {
			r.Max = &v
		}
		if r.Min == nil && r.Max == nil {
			continue
		}
		out = append(out, r)
	}
	return out
}

type PropertyController struct {
	svc      *service.PropertyService
	auditSvc *service.AuditService
}

func NewPropertyController() *PropertyController {
	return &PropertyController{svc: service.NewPropertyService(), auditSvc: service.NewAuditService()}
}

func (ctrl *PropertyController) RegisterRoutes(r *gin.RouterGroup) {
	props := r.Group("/properties", middleware.OptionalAuth())
	props.GET("", ctrl.listProperties)
	props.GET("/:id", ctrl.getProperty)
	props.GET("/:id/reviews", ctrl.getPropertyReviews)
	props.GET("/:id/listing-owner", ctrl.getListingOwner)
}

// canSeeOwnerInfo returns true if the viewer is an agent or admin.
// Owner contact fields are restricted to those roles per requirement.md.
func canSeeOwnerInfo(role model.UserRole) bool {
	return role == model.RoleAgent || role == model.RoleAdmin
}

func (ctrl *PropertyController) listProperties(c *gin.Context) {
	filter := service.PropertyFilter{
		Location:    c.Query("location"),
		Search:      c.Query("search"),
		Types:       parseStringCSV(c.Query("types")),
		Kinds:       parseStringCSV(c.Query("kinds")),
		Provinces:   parseStringCSV(c.Query("provinces")),
		Districts:   parseStringCSV(c.Query("districts")),
		PriceRanges: parsePriceRanges(c.Query("price_ranges")),
		BtsMrtIDs:   parseIntCSV(c.Query("bts_mrt_ids")),
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

	if !canSeeOwnerInfo(middleware.GetRole(c)) {
		dto.StripOwnerInfo()
	} else {
		ctrl.auditSvc.LogViewOwner(c, id, "Viewed owner info for "+dto.ProjectName)
	}

	successResponse(c, dto)
}

// getListingOwner returns the property owner's contact preview (Name/Phone/
// Email/Line/etc. captured at listing time). Gated behind canSeeOwnerInfo —
// same restriction applied to the owner fields embedded in the property detail
// response. Returns null when every owner field is empty.
func (ctrl *PropertyController) getListingOwner(c *gin.Context) {
	if !canSeeOwnerInfo(middleware.GetRole(c)) {
		successResponse(c, nil)
		return
	}
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}
	preview, err := ctrl.svc.GetListingOwner(id)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, preview)
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
