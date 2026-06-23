package controller

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AdminController struct {
	svc      *service.AdminService
	auditSvc *service.AuditService
}

func NewAdminController() *AdminController {
	return &AdminController{svc: service.NewAdminService(), auditSvc: service.NewAuditService()}
}

func (ctrl *AdminController) RegisterRoutes(r *gin.RouterGroup) {
	admin := r.Group("/admin",
		middleware.Protected(),
		middleware.Rbac(model.RoleAdmin),
	)

	admin.GET("/dashboard", ctrl.getDashboard)

	admin.GET("/agents", ctrl.listAgents)
	admin.GET("/agents/:id", ctrl.getAgent)
	admin.PUT("/agents/:id", ctrl.updateAgent)
	admin.POST("/agents/:id/role", ctrl.updateAgentRole)

	admin.GET("/users/pending", ctrl.listPendingUsers)
	admin.PUT("/users/:id/approve", ctrl.approveUser)
	admin.PUT("/users/:id/reject", ctrl.rejectUser)

	admin.GET("/users", ctrl.listUsers)
	admin.GET("/users/:id", ctrl.getUser)
	admin.PUT("/users/:id", ctrl.updateUser)

	admin.GET("/bookings", ctrl.listBookings)
	admin.POST("/bookings/:id/reassign", ctrl.reassignBooking)

	admin.GET("/properties", ctrl.listProperties)

	admin.GET("/financial", ctrl.getFinancial)
	admin.GET("/financial/export", ctrl.exportFinancial)

	admin.GET("/audit-logs", ctrl.listAuditLogs)
}

func (ctrl *AdminController) listAuditLogs(c *gin.Context) {
	filter := service.AuditFilter{
		ActorRole:  model.UserRole(c.Query("actor_role")),
		Action:     model.AuditAction(c.Query("action")),
		EntityType: model.AuditEntityType(c.Query("entity_type")),
		Search:     c.Query("search"),
	}
	if v, err := strconv.Atoi(c.Query("limit")); err == nil {
		filter.Limit = v
	}
	if v, err := strconv.Atoi(c.Query("offset")); err == nil {
		filter.Offset = v
	}

	dtos, err := ctrl.auditSvc.List(filter)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) listProperties(c *gin.Context) {
	filter := service.PropertyFilter{
		Search:      c.Query("search"),
		Types:       parseStringCSV(c.Query("types")),
		Kinds:       parseStringCSV(c.Query("kinds")),
		Provinces:   parseStringCSV(c.Query("provinces")),
		Districts:   parseStringCSV(c.Query("districts")),
		PriceRanges: parsePriceRanges(c.Query("price_ranges")),
		BtsMrtIDs:   parseIntCSV(c.Query("bts_mrt_ids")),
		Statuses:    parseStringCSV(c.Query("statuses")),
		ProjectName: c.Query("project_name"),
	}
	if id := c.Query("agent_id"); id != "" {
		n, err := strconv.ParseUint(id, 10, 64)
		if err == nil && n > 0 {
			v := uint(n)
			filter.AgentID = &v
		}
	}

	dtos, err := ctrl.svc.ListAllProperties(filter)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) getDashboard(c *gin.Context) {
	dash, err := ctrl.svc.GetDashboard()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dash)
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

	var body profileUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := body.validate(); err != nil {
		badRequest(c, err.Error())
		return
	}

	updates := body.toUpdates()

	dto, err := ctrl.svc.UpdateAgent(id, updates)
	if err != nil {
		errorResponse(c, err)
		return
	}
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditUpdate,
		EntityType: model.EntityAgent,
		EntityID:   &id,
		Summary:    fmt.Sprintf("Updated agent profile %s", dto.Name),
		Metadata:   updates,
	})
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
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditRoleChange,
		EntityType: model.EntityUser,
		EntityID:   &id,
		Summary:    fmt.Sprintf("Set role of %s to %s", dto.Name, body.Role),
		Metadata:   map[string]any{"role": body.Role},
	})
	successResponse(c, dto)
}

func (ctrl *AdminController) listPendingUsers(c *gin.Context) {
	dtos, err := ctrl.svc.ListPendingUsers()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *AdminController) approveUser(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid user id")
		return
	}
	dto, err := ctrl.svc.ApproveUser(id)
	if err != nil {
		errorResponse(c, err)
		return
	}
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditApprove,
		EntityType: model.EntityUser,
		EntityID:   &id,
		Summary:    fmt.Sprintf("Approved user %s (%s)", dto.Name, dto.Email),
	})
	successResponse(c, dto)
}

func (ctrl *AdminController) rejectUser(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid user id")
		return
	}
	if err := ctrl.svc.RejectUser(id); err != nil {
		errorResponse(c, err)
		return
	}
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditReject,
		EntityType: model.EntityUser,
		EntityID:   &id,
	})
	successResponse(c, gin.H{"ok": true})
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

	var body profileUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := body.validate(); err != nil {
		badRequest(c, err.Error())
		return
	}

	updates := body.toUpdates()

	dto, err := ctrl.svc.UpdateUser(id, updates)
	if err != nil {
		errorResponse(c, err)
		return
	}
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditUpdate,
		EntityType: model.EntityUser,
		EntityID:   &id,
		Summary:    fmt.Sprintf("Updated user profile %s", dto.Name),
		Metadata:   updates,
	})
	successResponse(c, dto)
}

func (ctrl *AdminController) listBookings(c *gin.Context) {
	dtos, err := ctrl.svc.ListBookings()
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
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
	ctrl.auditSvc.Log(c, service.AuditEntry{
		Action:     model.AuditReassign,
		EntityType: model.EntityBooking,
		EntityID:   &bookingID,
		Summary:    fmt.Sprintf("Reassigned booking #%d to agent #%d", bookingID, body.AgentID),
		Metadata:   map[string]any{"agentId": body.AgentID},
	})
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

// profileUpdateBody captures the JSON shape used by admin updateUser / updateAgent
// and by personal-info self-updates. Empty strings are dropped from the update map
// so callers can do partial updates without overwriting existing values.
type profileUpdateBody struct {
	Name           string `json:"name"`
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	SecondaryPhone string `json:"secondaryPhone"`
	LineID         string `json:"lineId"`
	Facebook       string `json:"facebook"`
	Wechat         string `json:"wechat"`
	Whatsapp       string `json:"whatsapp"`
}

func (b profileUpdateBody) toUpdates() map[string]any {
	updates := map[string]any{}
	setIfNotEmpty := func(key, v string) {
		if v != "" {
			updates[key] = v
		}
	}

	// If firstName or lastName provided, sync the legacy Name field too.
	if b.FirstName != "" || b.LastName != "" {
		composed := b.FirstName
		if b.FirstName != "" && b.LastName != "" {
			composed = b.FirstName + " " + b.LastName
		} else if b.FirstName == "" {
			composed = b.LastName
		}
		updates["first_name"] = b.FirstName
		updates["last_name"] = b.LastName
		updates["name"] = composed
	} else if b.Name != "" {
		updates["name"] = b.Name
	}

	setIfNotEmpty("email", b.Email)
	setIfNotEmpty("phone", b.Phone)
	setIfNotEmpty("secondary_phone", b.SecondaryPhone)
	setIfNotEmpty("line_id", b.LineID)
	setIfNotEmpty("facebook", b.Facebook)
	setIfNotEmpty("wechat", b.Wechat)
	setIfNotEmpty("whatsapp", b.Whatsapp)
	return updates
}

// Accepts either legacy Thai local format (0XXXXXXXXX) or E.164 (+CCXXXXXX...).
// Frontend collects via libphonenumber and submits E.164; legacy rows can still
// pass through unchanged.
var phoneFormat = regexp.MustCompile(`^\+?[1-9]\d{6,14}$|^0\d{8,9}$`)

// validate enforces phone-format rules per requirement.md lines 5-6: both phone
// and secondary phone must match Thai mobile format and must not be all-zeros.
func (b profileUpdateBody) validate() error {
	if b.Phone != "" {
		if err := validatePhone("phone", b.Phone); err != nil {
			return err
		}
	}
	if b.SecondaryPhone != "" {
		if err := validatePhone("secondaryPhone", b.SecondaryPhone); err != nil {
			return err
		}
	}
	return nil
}

func validatePhone(field, raw string) error {
	cleaned := strings.NewReplacer("-", "", " ", "").Replace(raw)
	if !phoneFormat.MatchString(cleaned) {
		return fmt.Errorf("%s must be a valid phone number in E.164 (e.g., +66812345678) or local Thai (e.g., 0812345678) format", field)
	}
	allZeros := true
	for _, c := range cleaned {
		if c != '0' {
			allZeros = false
			break
		}
	}
	if allZeros {
		return fmt.Errorf("%s cannot be all zeros", field)
	}
	return nil
}
