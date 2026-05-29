package controller

import (
	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AdminController struct {
	svc *service.AdminService
}

func NewAdminController() *AdminController {
	return &AdminController{svc: service.NewAdminService()}
}

func (ctrl *AdminController) RegisterRoutes(r *gin.RouterGroup) {
	admin := r.Group("/admin",
		middleware.Protected(),
		middleware.Rbac(model.RoleAdmin),
	)

	admin.GET("/dashboard", ctrl.getDashboard)

	admin.GET("/properties/pending", ctrl.getPendingProperties)
	admin.PUT("/properties/:id/approve", ctrl.approveProperty)

	admin.GET("/agents", ctrl.listAgents)
	admin.GET("/agents/:id", ctrl.getAgent)
	admin.PUT("/agents/:id", ctrl.updateAgent)
	admin.POST("/agents/:id/role", ctrl.updateAgentRole)

	admin.GET("/users", ctrl.listUsers)
	admin.GET("/users/:id", ctrl.getUser)
	admin.PUT("/users/:id", ctrl.updateUser)

	admin.POST("/bookings/:id/reassign", ctrl.reassignBooking)

	admin.GET("/financial", ctrl.getFinancial)
	admin.GET("/financial/export", ctrl.exportFinancial)
}

func (ctrl *AdminController) getDashboard(c *gin.Context) {
	dash, err := ctrl.svc.GetDashboard()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dash)
}

func (ctrl *AdminController) getPendingProperties(c *gin.Context) {
	svc := service.NewPropertyService()
	dtos, err := svc.GetPendingProperties()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) approveProperty(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	var body struct {
		Action string `json:"action" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	svc := service.NewPropertyService()
	dto, err := svc.ApproveProperty(id, body.Action)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dto)
}

func (ctrl *AdminController) listAgents(c *gin.Context) {
	dtos, err := ctrl.svc.ListAgents()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) getAgent(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid agent id")
		return
	}
	dto, err := ctrl.svc.GetAgent(id)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) updateAgent(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid agent id")
		return
	}

	var body struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.Phone != "" {
		updates["phone"] = body.Phone
	}
	if body.Email != "" {
		updates["email"] = body.Email
	}

	dto, err := ctrl.svc.UpdateAgent(id, updates)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) updateAgentRole(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid agent id")
		return
	}

	var body struct {
		Role model.UserRole `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.svc.UpdateAgentRole(id, body.Role)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) listUsers(c *gin.Context) {
	dtos, err := ctrl.svc.ListUsers()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) getUser(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid user id")
		return
	}
	dto, err := ctrl.svc.GetUser(id)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) updateUser(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid user id")
		return
	}

	var body struct {
		Name   string `json:"name"`
		Phone  string `json:"phone"`
		LineID string `json:"line_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if body.Name != "" {
		updates["name"] = body.Name
	}
	if body.Phone != "" {
		updates["phone"] = body.Phone
	}
	if body.LineID != "" {
		updates["line_id"] = body.LineID
	}

	dto, err := ctrl.svc.UpdateUser(id, updates)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) reassignBooking(c *gin.Context) {
	bookingID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid booking id")
		return
	}

	var body struct {
		AgentID uint `json:"agent_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.svc.ReassignBooking(bookingID, body.AgentID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AdminController) getFinancial(c *gin.Context) {
	dtos, err := ctrl.svc.GetFinancialReport()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) exportFinancial(c *gin.Context) {
	if err := ctrl.svc.ExportFinancial(c.Writer); err != nil {
		errorResponse(c, err)
		return
	}
}
