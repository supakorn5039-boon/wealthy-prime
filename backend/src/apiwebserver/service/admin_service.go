package service

import (
	"errors"
	"io"
	"net/http"

	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AdminService struct {
	db          *gorm.DB
	bookingSvc  *BookingService
	propertySvc *PropertyService
}

func NewAdminService() *AdminService {
	return &AdminService{
		db:          database.DB,
		bookingSvc:  NewBookingService(),
		propertySvc: NewPropertyService(),
	}
}

func (s *AdminService) ListAllProperties(filter PropertyFilter) ([]model.PropertyDto, error) {
	return s.propertySvc.ListProperties(filter)
}

type PropertyStatusCount struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type AgentLeaderEntry struct {
	AgentID     uint   `json:"agentId"`
	AgentName   string `json:"agentName"`
	ClosedCount int64  `json:"closedCount"`
}

type AdminDashboard struct {
	TotalProperties     int64                 `json:"totalProperties"`
	TotalUsers          int64                 `json:"totalUsers"`
	TotalAgents         int64                 `json:"totalAgents"`
	TotalRevenue        float64               `json:"totalRevenue"`
	PropertyStatusChart []PropertyStatusCount `json:"propertyStatusChart"`
	AgentLeaderboard    []AgentLeaderEntry    `json:"agentLeaderboard"`
}

func (s *AdminService) GetDashboard() (*AdminDashboard, error) {
	var totalProperties, totalUsers, totalAgents int64
	if err := s.db.Model(&model.Property{}).Count(&totalProperties).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count properties")
	}
	if err := s.db.Model(&model.User{}).Where("role = ?", model.RoleUser).Count(&totalUsers).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count users")
	}
	if err := s.db.Model(&model.User{}).Where("role = ?", model.RoleAgent).Count(&totalAgents).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count agents")
	}

	var totalRevenue float64
	if err := s.db.Model(&model.Property{}).
		Where("status = ?", model.StatusSold).
		Select("COALESCE(SUM(price), 0)").
		Scan(&totalRevenue).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to sum revenue")
	}

	var chart []PropertyStatusCount
	if err := s.db.Model(&model.Property{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&chart).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count property statuses")
	}

	var leaderboard []AgentLeaderEntry
	if err := s.db.Model(&model.Property{}).
		Select("agent_id, users.name as agent_name, COUNT(properties.id) as closed_count").
		Joins("JOIN users ON users.id = properties.agent_id").
		Where("properties.status = ? AND properties.agent_id IS NOT NULL AND properties.deleted_at IS NULL AND users.deleted_at IS NULL", model.StatusSold).
		Group("properties.agent_id, users.name").
		Order("closed_count DESC").
		Scan(&leaderboard).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch agent leaderboard")
	}

	return &AdminDashboard{
		TotalProperties:     totalProperties,
		TotalUsers:          totalUsers,
		TotalAgents:         totalAgents,
		TotalRevenue:        totalRevenue,
		PropertyStatusChart: chart,
		AgentLeaderboard:    leaderboard,
	}, nil
}

func (s *AdminService) ListBookings() ([]model.BookingDto, error) {
	var bookings []model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		Where("status IN ?", ActiveBookingStatuses).
		Where("work_status IS NULL OR work_status IN ?", AdminVisibleWorkStatuses).
		Order("created_at DESC").Find(&bookings).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to list bookings")
	}
	dtos := make([]model.BookingDto, len(bookings))
	for i, b := range bookings {
		dtos[i] = *b.ToDto()
	}
	return dtos, nil
}

func (s *AdminService) ReassignBooking(bookingID, agentID uint) (*model.BookingDto, error) {
	var booking model.Booking
	err := s.db.First(&booking, bookingID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("booking")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	var agent model.User
	err = s.db.Where("id = ? AND role = ?", agentID, model.RoleAgent).First(&agent).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("agent")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error verifying agent")
	}

	updates := map[string]interface{}{
		"assigned_agent_id": agentID,
		"status":            model.BookingAssigned,
	}
	if err := s.db.Model(&booking).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reassign booking")
	}

	var full model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		First(&full, bookingID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload booking")
	}

	s.bookingSvc.NotifyAgentAssignedAsync(full)

	return full.ToDto(), nil
}

type FinancialRecord struct {
	ID            uint    `json:"id"`
	PropertyID    uint    `json:"propertyId"`
	PropertyTitle string  `json:"propertyTitle"`
	AgentName     string  `json:"agentName"`
	Amount        float64 `json:"amount"`
	Type          string  `json:"type"`
	ClosedAt      string  `json:"closedAt"`
}

func (s *AdminService) GetFinancialReport() ([]FinancialRecord, error) {
	var properties []model.Property
	if err := s.db.Preload("Agent").
		Where("status = ?", model.StatusSold).Find(&properties).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch financial report")
	}
	records := make([]FinancialRecord, len(properties))
	for i, p := range properties {
		agentName := ""
		if p.Agent != nil {
			agentName = p.Agent.Name
		}
		records[i] = FinancialRecord{
			ID:            p.ID,
			PropertyID:    p.ID,
			PropertyTitle: p.ProjectName,
			AgentName:     agentName,
			Amount:        p.Price,
			Type:          string(p.Type),
			ClosedAt:      p.UpdatedAt.Format("2006-01-02"),
		}
	}
	return records, nil
}

func (s *AdminService) ExportFinancial(w http.ResponseWriter) error {
	var properties []model.Property
	if err := s.db.Preload("Agent").Where("status = ?", model.StatusSold).Find(&properties).Error; err != nil {
		return apperror.Wrap(err, 500, "failed to fetch data for export")
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Financial Report"
	f.NewSheet(sheet)
	f.DeleteSheet("Sheet1")

	headers := []string{"ID", "Project Name", "Location", "Price", "Type", "Size (sqm)", "Agent", "Owner Info", "Created At"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	for rowIdx, p := range properties {
		row := rowIdx + 2
		agentName := ""
		if p.Agent != nil {
			agentName = p.Agent.Name
		}
		values := []interface{}{
			p.ID,
			p.ProjectName,
			p.Location,
			p.Price,
			string(p.Type),
			p.SizeSqm,
			agentName,
			p.OwnerInfo,
			p.CreatedAt.Format("2006-01-02"),
		}
		for colIdx, v := range values {
			cell, _ := excelize.CoordinatesToCellName(colIdx+1, row)
			f.SetCellValue(sheet, cell, v)
		}
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", `attachment; filename="financial_report.xlsx"`)

	pr, pw := io.Pipe()
	errCh := make(chan error, 1)
	go func() {
		_, err := f.WriteTo(pw)
		pw.CloseWithError(err)
		errCh <- err
	}()

	_, copyErr := io.Copy(w, pr)
	writeErr := <-errCh
	if writeErr != nil {
		return apperror.Wrap(writeErr, 500, "failed to write xlsx")
	}
	if copyErr != nil {
		return apperror.Wrap(copyErr, 500, "failed to stream xlsx")
	}

	return nil
}

func (s *AdminService) ListAgents() ([]model.UserDto, error) {
	var agents []model.User
	if err := s.db.Where("role = ?", model.RoleAgent).Find(&agents).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to list agents")
	}
	dtos := make([]model.UserDto, len(agents))
	for i, a := range agents {
		dtos[i] = *a.ToDto()
	}
	return dtos, nil
}

func (s *AdminService) GetAgent(agentID uint) (*model.UserDto, error) {
	var agent model.User
	err := s.db.Where("id = ? AND role = ?", agentID, model.RoleAgent).First(&agent).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("agent")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}
	return agent.ToDto(), nil
}

func (s *AdminService) UpdateAgentRole(userID uint, role model.UserRole) (*model.UserDto, error) {
	var user model.User
	err := s.db.First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("user")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if err := s.db.Model(&user).Update("role", role).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update role")
	}

	return user.ToDto(), nil
}

func (s *AdminService) UpdateAgent(agentID uint, updates map[string]interface{}) (*model.UserDto, error) {
	var agent model.User
	err := s.db.First(&agent, agentID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("agent")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if err := s.db.Model(&agent).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update agent")
	}

	return agent.ToDto(), nil
}

func (s *AdminService) ListUsers() ([]model.UserDto, error) {
	var users []model.User
	if err := s.db.Find(&users).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to list users")
	}
	dtos := make([]model.UserDto, len(users))
	for i, u := range users {
		dtos[i] = *u.ToDto()
	}
	return dtos, nil
}

func (s *AdminService) GetUser(userID uint) (*model.UserDto, error) {
	var user model.User
	err := s.db.First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("user")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}
	return user.ToDto(), nil
}

func (s *AdminService) ListPendingUsers() ([]model.UserDto, error) {
	var users []model.User
	if err := s.db.
		Where("is_approved = ? AND role <> ?", false, model.RoleAdmin).
		Order("created_at ASC").
		Find(&users).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to list pending users")
	}
	dtos := make([]model.UserDto, len(users))
	for i, u := range users {
		dtos[i] = *u.ToDto()
	}
	return dtos, nil
}

func (s *AdminService) ApproveUser(userID uint) (*model.UserDto, error) {
	var user model.User
	err := s.db.First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("user")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if err := s.db.Model(&user).Update("is_approved", true).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to approve user")
	}
	user.IsApproved = true
	return user.ToDto(), nil
}

func (s *AdminService) RejectUser(userID uint) error {
	var user model.User
	err := s.db.First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperror.NotFound("user")
	}
	if err != nil {
		return apperror.Wrap(err, 500, "database error")
	}
	if err := s.db.Delete(&user).Error; err != nil {
		return apperror.Wrap(err, 500, "failed to reject user")
	}
	return nil
}

func (s *AdminService) UpdateUser(userID uint, updates map[string]interface{}) (*model.UserDto, error) {
	var user model.User
	err := s.db.First(&user, userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("user")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if err := s.db.Model(&user).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update user")
	}

	return user.ToDto(), nil
}
