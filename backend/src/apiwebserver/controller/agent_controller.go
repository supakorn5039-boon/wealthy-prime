package controller

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AgentController struct {
	svc         *service.AgentService
	propertySvc *service.PropertyService
	inquirySvc  *service.InquiryService
}

func NewAgentController() *AgentController {
	return &AgentController{
		svc:         service.NewAgentService(),
		propertySvc: service.NewPropertyService(),
		inquirySvc:  service.NewInquiryService(),
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
	agent.PUT("/properties/:id", ctrl.editProperty)
	agent.PUT("/properties/:id/status", ctrl.updateStatus)
	agent.DELETE("/properties/:id", ctrl.deleteProperty)

	agent.GET("/contacts", ctrl.getContacts)
	agent.PUT("/contacts/:bookingId/note", ctrl.updateNote)
	agent.PUT("/contacts/:bookingId/work-status", ctrl.updateWorkStatus)

	agent.GET("/inquiries", ctrl.listInquiries)
	agent.PUT("/inquiries/:id/status", ctrl.updateInquiryStatus)

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
	filter := service.PropertyFilter{
		Search:      c.Query("search"),
		Types:       parseStringCSV(c.Query("types")),
		Kinds:       parseStringCSV(c.Query("kinds")),
		Statuses:    parseStringCSV(c.Query("statuses")),
		ProjectName: c.Query("project_name"),
	}
	dtos, err := ctrl.propertySvc.GetAgentProperties(agentID, filter)
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

	projectName := formVal(form.Value, "project_name")
	location := formVal(form.Value, "location")
	ownerInfo := formVal(form.Value, "owner_info")
	// `type` is no longer sent by the frontend; it is derived from `listing` server-side.
	propType := formVal(form.Value, "type")

	if projectName == "" || location == "" || ownerInfo == "" {
		badRequest(c, "project_name, location, and owner_info are required")
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
		v, err := strconv.ParseFloat(s, 64)
		if err != nil || v < 0 {
			badRequest(c, "size_sqm must be a non-negative number")
			return
		}
		sizeSqm = v
	}

	var rentalPeriodMonths *int
	if r := formVal(form.Value, "rental_period_months"); r != "" {
		n, err := strconv.Atoi(r)
		if err != nil || n <= 0 {
			badRequest(c, "rental_period_months must be a positive integer")
			return
		}
		rentalPeriodMonths = &n
	}

	lat, lng, err := parseLatLng(form.Value)
	if err != nil {
		badRequest(c, err.Error())
		return
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

	fields := buildPropertyFields(form.Value, projectName, location, ownerInfo, price, sizeSqm, model.PropertyType(propType), rentalPeriodMonths, lat, lng)

	dto, err := ctrl.propertySvc.CreateProperty(service.CreatePropertyInput{
		PropertyFields: fields,
		AgentID:        &agentID,
		Images:         images,
	})
	if err != nil {
		errorResponse(c, err)
		return
	}

	created(c, dto)
}

func (ctrl *AgentController) editProperty(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	role := middleware.GetRole(c)
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

	projectName := formVal(form.Value, "project_name")
	location := formVal(form.Value, "location")
	ownerInfo := formVal(form.Value, "owner_info")
	// `type` is derived from `listing` server-side; not required from frontend.
	propType := formVal(form.Value, "type")
	if projectName == "" || location == "" || ownerInfo == "" {
		badRequest(c, "project_name, location, and owner_info are required")
		return
	}

	price, err := strconv.ParseFloat(formVal(form.Value, "price"), 64)
	if err != nil || price <= 0 {
		badRequest(c, "valid price is required")
		return
	}

	var sizeSqm float64
	if s := formVal(form.Value, "size_sqm"); s != "" {
		v, err := strconv.ParseFloat(s, 64)
		if err != nil || v < 0 {
			badRequest(c, "size_sqm must be a non-negative number")
			return
		}
		sizeSqm = v
	}

	var rentalPeriodMonths *int
	if r := formVal(form.Value, "rental_period_months"); r != "" {
		n, err := strconv.Atoi(r)
		if err != nil || n <= 0 {
			badRequest(c, "rental_period_months must be a positive integer")
			return
		}
		rentalPeriodMonths = &n
	}

	lat, lng, err := parseLatLng(form.Value)
	if err != nil {
		badRequest(c, err.Error())
		return
	}

	deleteImageIDs, err := parseImageIDs(form.Value["delete_image_ids"])
	if err != nil {
		badRequest(c, err.Error())
		return
	}

	fields := buildPropertyFields(form.Value, projectName, location, ownerInfo, price, sizeSqm, model.PropertyType(propType), rentalPeriodMonths, lat, lng)

	dto, err := ctrl.propertySvc.UpdateProperty(propertyID, agentID, role, service.UpdatePropertyInput{
		PropertyFields: fields,
		NewImages:      form.File["images"],
		DeleteImageIDs: deleteImageIDs,
	})
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dto)
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

	if r := formVal(form.Value, "rental_period_months"); r != "" {
		n, err := strconv.Atoi(r)
		if err != nil || n <= 0 {
			badRequest(c, "rental_period_months must be a positive integer")
			return
		}
		input.RentalPeriodMonths = &n
	}

	dto, err := ctrl.propertySvc.UpdateStatus(propertyID, agentID, input)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dto)
}

func (ctrl *AgentController) deleteProperty(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	role := middleware.GetRole(c)
	propertyID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	if err := ctrl.propertySvc.DeleteProperty(propertyID, agentID, role); err != nil {
		errorResponse(c, err)
		return
	}

	c.JSON(200, gin.H{"success": true})
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

func (ctrl *AgentController) updateWorkStatus(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	bookingID, err := parseUintParam(c, "bookingId")
	if err != nil {
		badRequest(c, "invalid booking id")
		return
	}

	var body struct {
		WorkStatus model.AppointmentWorkStatus `json:"workStatus" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.svc.UpdateWorkStatus(agentID, bookingID, body.WorkStatus)
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

func (ctrl *AgentController) listInquiries(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	dtos, err := ctrl.inquirySvc.GetAgentInquiries(agentID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AgentController) updateInquiryStatus(c *gin.Context) {
	agentID := middleware.GetUserID(c)
	inquiryID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid inquiry id")
		return
	}

	var body struct {
		Status model.InquiryStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.inquirySvc.UpdateInquiryStatus(agentID, inquiryID, body.Status)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

// formVal safely reads a form value by key.
func formVal(values map[string][]string, key string) string {
	if vals, ok := values[key]; ok && len(vals) > 0 {
		return vals[0]
	}
	return ""
}

// parseImageIDs accepts repeated form values OR a single comma-separated value
// and returns the deduplicated list of positive uint IDs.
func parseImageIDs(raw []string) ([]uint, error) {
	if len(raw) == 0 {
		return nil, nil
	}
	seen := map[uint]struct{}{}
	out := []uint{}
	for _, v := range raw {
		for _, part := range strings.Split(v, ",") {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}
			n, err := strconv.ParseUint(part, 10, 64)
			if err != nil || n == 0 {
				return nil, fmt.Errorf("invalid image id: %q", part)
			}
			id := uint(n)
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			out = append(out, id)
		}
	}
	return out, nil
}

// buildPropertyFields assembles the shared PropertyFields struct from
// the multipart form values, layering the required fields on top of the optional ones.
func buildPropertyFields(
	values map[string][]string,
	projectName, location, ownerInfo string,
	price, sizeSqm float64,
	propType model.PropertyType,
	rentalPeriodMonths *int,
	lat, lng *float64,
) service.PropertyFields {
	atoi := func(s string) int {
		n, _ := strconv.Atoi(s)
		return n
	}
	return service.PropertyFields{
		ProjectName:        projectName,
		Location:           location,
		Price:              price,
		Type:               propType,
		SizeSqm:            sizeSqm,
		OwnerInfo:          ownerInfo,
		RentalPeriodMonths: rentalPeriodMonths,
		Lat:                lat,
		Lng:                lng,

		Kind:         model.PropertyKind(formVal(values, "kind")),
		Listing:      model.ListingType(formVal(values, "listing")),
		Province:     formVal(values, "province"),
		District:     formVal(values, "district"),
		GoogleMapURL: formVal(values, "google_map_url"),
		BtsMrt:       pq.Int32Array(parseIntCSV(formVal(values, "bts_mrt"))),
		Bedrooms:     atoi(formVal(values, "bedrooms")),
		Bathrooms:    atoi(formVal(values, "bathrooms")),
		Floor:        atoi(formVal(values, "floor")),
		MinContract:  atoi(formVal(values, "min_contract")),
		Pets:         model.PetPolicy(formVal(values, "pets")),
		Furniture:    model.FurniturePolicy(formVal(values, "furniture")),
		AdCaption:    formVal(values, "ad_caption"),

		OwnerName:     formVal(values, "owner_name"),
		OwnerPhone:    formVal(values, "owner_phone"),
		OwnerLineID:   formVal(values, "owner_line_id"),
		OwnerEmail:    formVal(values, "owner_email"),
		OwnerFacebook: formVal(values, "owner_facebook"),
		OwnerWechat:   formVal(values, "owner_wechat"),
		OwnerWhatsapp: formVal(values, "owner_whatsapp"),
	}
}

// parseLatLng extracts optional lat/lng form values. Both must be supplied
// together (a single coordinate without its pair is meaningless), or both omitted.
func parseLatLng(values map[string][]string) (*float64, *float64, error) {
	latStr := formVal(values, "lat")
	lngStr := formVal(values, "lng")
	if latStr == "" && lngStr == "" {
		return nil, nil, nil
	}
	if latStr == "" || lngStr == "" {
		return nil, nil, fmt.Errorf("lat and lng must be provided together")
	}
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil || lat < -90 || lat > 90 {
		return nil, nil, fmt.Errorf("lat must be a number between -90 and 90")
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil || lng < -180 || lng > 180 {
		return nil, nil, fmt.Errorf("lng must be a number between -180 and 180")
	}
	return &lat, &lng, nil
}
