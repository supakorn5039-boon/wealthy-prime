package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database/model"
)

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

func parseIntPtr(s string) *int {
	if s = strings.TrimSpace(s); s == "" {
		return nil
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &n
}

func parseFloatPtr(s string) *float64 {
	if s = strings.TrimSpace(s); s == "" {
		return nil
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil
	}
	return &v
}

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
	props.GET("/suggest", ctrl.suggestProjectNames)
	props.GET("/:id", ctrl.getProperty)
	props.GET("/:id/reviews", ctrl.getPropertyReviews)
	props.GET("/:id/listing-owner", ctrl.getListingOwner)
	props.GET("/:id/images-archive", ctrl.downloadImagesArchive)
}

func canSeeOwnerInfo(role model.UserRole) bool {
	return role == model.RoleAgent || role == model.RoleAdmin
}

func (ctrl *PropertyController) listProperties(c *gin.Context) {
	filter := service.PropertyFilter{
		Location:         c.Query("location"),
		Search:           c.Query("search"),
		SearchStationIDs: parseIntCSV(c.Query("search_station_ids")),
		Types:            parseStringCSV(c.Query("types")),
		Kinds:            parseStringCSV(c.Query("kinds")),
		Provinces:        parseStringCSV(c.Query("provinces")),
		Districts:        parseStringCSV(c.Query("districts")),
		PriceRanges:      parsePriceRanges(c.Query("price_ranges")),
		BtsMrtIDs:        parseIntCSV(c.Query("bts_mrt_ids")),
		Pets:             parseStringCSV(c.Query("pets")),
		Statuses:         parseStringCSV(c.Query("statuses")),
		MinBedrooms:      parseIntPtr(c.Query("min_bedrooms")),
		Bathrooms:        parseIntPtr(c.Query("bathrooms")),
		SizeMin:          parseFloatPtr(c.Query("size_min")),
		SizeMax:          parseFloatPtr(c.Query("size_max")),
		FloorMin:         parseIntPtr(c.Query("floor_min")),
		FloorMax:         parseIntPtr(c.Query("floor_max")),
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

func (ctrl *PropertyController) suggestProjectNames(c *gin.Context) {
	names, err := ctrl.svc.SuggestProjectNames(c.Query("q"), 10)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, names)
}

func (ctrl *PropertyController) downloadImagesArchive(c *gin.Context) {
	if !canSeeOwnerInfo(middleware.GetRole(c)) {
		errorResponse(c, apperror.Forbidden("agent or admin role required"))
		return
	}
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}
	archive, err := ctrl.svc.BuildImagesArchive(id)
	if err != nil {
		errorResponse(c, err)
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", archive.Filename))
	c.Data(http.StatusOK, "application/zip", archive.Data)
}

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

func parseUintParam(c *gin.Context, name string) (uint, error) {
	v := c.Param(name)
	n, err := strconv.ParseUint(v, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(n), nil
}
