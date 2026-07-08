package controller

import (
	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
)

type GeocodeController struct {
	svc *service.GeocodeService
}

func NewGeocodeController() *GeocodeController {
	return &GeocodeController{svc: service.NewGeocodeService()}
}

func (ctrl *GeocodeController) RegisterRoutes(r *gin.RouterGroup) {
	geocode := r.Group("/geocode", middleware.Protected())
	geocode.GET("/resolve", ctrl.resolveMapURL)
}

func (ctrl *GeocodeController) resolveMapURL(c *gin.Context) {
	result, err := ctrl.svc.ResolveMapURL(c.Request.Context(), c.Query("url"))
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, result)
}
