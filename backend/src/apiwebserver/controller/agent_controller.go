package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AgentController struct {
	svc         *service.AgentService
	propertySvc *service.PropertyService
}

func NewAgentController() *AgentController {
	return &AgentController{
		svc:         service.NewAgentService(),
		propertySvc: service.NewPropertyService(),
	}
}

func (ctrl *AgentController) RegisterRoutes(r *gin.RouterGroup) {
	agent := r.Group("/agent",
		middleware.Protected(),
		middleware.Rbac(model.RoleAgent),
	)

	agent.GET("/dashboard", ctrl.getDashboard)

	agent.GET("/properties", ctrl.listProperties)
	agent.POST("/properties", ctrl.createProperty)
	agent.PATCH("/properties/:id/status", ctrl.updateStatus)

	agent.GET("/contacts", ctrl.getContacts)
	agent.PATCH("/contacts/:bookingId/note", ctrl.updateNote)

	agent.GET("/review-link/:propertyId", ctrl.getReviewLink)
}

func (ctrl *AgentController) getDashboard(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	dash, err := ctrl.svc.GetDashboard(agentID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dash)
}

func (ctrl *AgentController) listProperties(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	dtos, err := ctrl.propertySvc.GetAgentProperties(agentID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AgentController) createProperty(c *gin.Context) {
	agentID := middleware.GetUserID(c)

	form, err := c.MultipartForm()
	if err != nil {
		badRequest(c, "multipart form required")
		return
	}

	title := formVal(form.Value, "title")
	projectName := formVal(form.Value, "project_name")
	location := formVal(form.Value, "location")
	ownerInfo := formVal(form.Value, "owner_info")
	propType := formVal(form.Value, "type")

	if title == "" || projectName == "" || location == "" || ownerInfo == "" || propType == "" {
		badRequest(c, "title, project_name, location, owner_info, and type are required")
		return
	}

	priceStr := formVal(form.Value, "price")
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil || price <= 0 {
		badRequest(c, "valid price is required")
		return
	}

	var sizeSqm float64
	if s := formVal(form.Value, "size_sqm"); s != "" {
		sizeSqm, _ = strconv.ParseFloat(s, 64)
	}

	var rentalPeriodMonths *int
	if r := formVal(form.Value, "rental_period_months"); r != "" {
		if n, err := strconv.Atoi(r); err == nil {
			rentalPeriodMonths = &n
		}
	}

	// Duplicate check
	isDuplicate, err := ctrl.propertySvc.DuplicateCheck(projectName, ownerInfo)
	if err != nil {
		errorResponse(c, err)
		return
	}
	if isDuplicate {
		c.JSON(409, gin.H{"success": false, "error": "property with same project name and owner already exists"})
		return
	}

	images := form.File["images"]

	dto, err := ctrl.propertySvc.CreateProperty(service.CreatePropertyInput{
		Title:              title,
		ProjectName:        projectName,
		Location:           location,
		Price:              price,
		Type:               model.PropertyType(propType),
		SizeSqm:            sizeSqm,
		AgentID:            &agentID,
		OwnerInfo:          ownerInfo,
		RentalPeriodMonths: rentalPeriodMonths,
		Images:             images,
	})
	if err != nil {
		errorResponse(c, err)
		return
	}

	created(c, dto)
}

func (ctrl *AgentController) updateStatus(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	propertyID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		badRequest(c, "multipart form required")
		return
	}

	statusStr := formVal(form.Value, "status")
	if statusStr == "" {
		badRequest(c, "status is required")
		return
	}

	input := service.UpdateStatusInput{
		Status: model.PropertyStatus(statusStr),
	}

	if slipFiles, ok := form.File["slip"]; ok && len(slipFiles) > 0 {
		input.SlipFile = slipFiles[0]
	}

	dto, err := ctrl.propertySvc.UpdateStatus(propertyID, agentID, input)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dto)
}

func (ctrl *AgentController) getContacts(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	dtos, err := ctrl.svc.GetContacts(agentID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AgentController) updateNote(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	bookingID, err := parseUintParam(c, "bookingId")
	if err != nil {
		badRequest(c, "invalid booking id")
		return
	}

	var body struct {
		Note string `json:"note" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.svc.UpdateNote(agentID, bookingID, body.Note)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dto)
}

func (ctrl *AgentController) getReviewLink(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	propertyID, err := parseUintParam(c, "propertyId")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	origin := c.GetHeader("Origin")
	if origin == "" {
		origin = c.GetHeader("Referer")
	}

	url, err := ctrl.svc.GenerateReviewLink(agentID, propertyID, origin)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, gin.H{"url": url})
}

// formVal safely reads a form value by key.
func formVal(values map[string][]string, key string) string {
	if vals, ok := values[key]; ok && len(vals) > 0 {
		return vals[0]
	}
	return ""
}
