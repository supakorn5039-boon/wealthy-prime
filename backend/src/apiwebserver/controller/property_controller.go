package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
)

type PropertyController struct {
	svc *service.PropertyService
}

func NewPropertyController() *PropertyController {
	return &PropertyController{svc: service.NewPropertyService()}
}

func (ctrl *PropertyController) RegisterRoutes(r *gin.RouterGroup) {
	props := r.Group("/properties")
	props.GET("", ctrl.listProperties)
	props.GET("/:id", ctrl.getProperty)
	props.GET("/:id/reviews", ctrl.getPropertyReviews)
}

func (ctrl *PropertyController) listProperties(c *gin.Context) {
	filter := service.PropertyFilter{
		Type:     c.Query("type"),
		Location: c.Query("location"),
		Search:   c.Query("search"),
		MinPrice: c.Query("min_price"),
		MaxPrice: c.Query("max_price"),
	}

	dtos, err := ctrl.svc.ListProperties(filter)
	if err != nil {
		errorResponse(c, err)
		return
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
