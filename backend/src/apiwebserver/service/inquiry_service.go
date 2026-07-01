package service

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type InquiryService struct {
	db *gorm.DB
}

func NewInquiryService() *InquiryService {
	return &InquiryService{db: database.DB}
}

type CreateInquiryInput struct {
	PropertyID uint   `json:"property_id" binding:"required"`
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	Message    string `json:"message"`
}

func (s *InquiryService) CreateInquiry(userID uint, input CreateInquiryInput) (*model.InquiryDto, error) {
	var property model.Property
	err := s.db.First(&property, input.PropertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error fetching property")
	}

	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "database error fetching user")
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		name = user.Name
	}
	phone := strings.TrimSpace(input.Phone)
	if phone == "" {
		phone = user.Phone
	}
	if name == "" || phone == "" {
		return nil, apperror.BadRequest("name and phone are required")
	}

	inquiry := model.Inquiry{
		UserID:     userID,
		PropertyID: input.PropertyID,
		AgentID:    property.AgentID,
		Name:       name,
		Phone:      phone,
		Message:    strings.TrimSpace(input.Message),
		Status:     model.InquiryNew,
	}
	if err := s.db.Create(&inquiry).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to create inquiry")
	}

	var full model.Inquiry
	if err := s.db.Preload("User").Preload("Property").Preload("Agent").
		First(&full, inquiry.ID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload inquiry")
	}
	return full.ToDto(), nil
}

func (s *InquiryService) GetAgentInquiries(agentID uint) ([]model.InquiryDto, error) {
	var inquiries []model.Inquiry
	if err := s.db.Preload("User").Preload("Property").Preload("Agent").
		Where("agent_id = ?", agentID).Order("created_at DESC").Find(&inquiries).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch inquiries")
	}
	dtos := make([]model.InquiryDto, len(inquiries))
	for i, q := range inquiries {
		dtos[i] = *q.ToDto()
	}
	return dtos, nil
}

func (s *InquiryService) UpdateInquiryStatus(agentID, inquiryID uint, status model.InquiryStatus) (*model.InquiryDto, error) {
	var inquiry model.Inquiry
	err := s.db.First(&inquiry, inquiryID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("inquiry")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if inquiry.AgentID == nil || *inquiry.AgentID != agentID {
		return nil, apperror.Forbidden("this inquiry is not assigned to you")
	}

	if status != model.InquiryNew && status != model.InquiryContacted {
		return nil, apperror.BadRequest("invalid status")
	}

	if err := s.db.Model(&inquiry).Update("status", status).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update inquiry status")
	}

	var full model.Inquiry
	if err := s.db.Preload("User").Preload("Property").Preload("Agent").
		First(&full, inquiryID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload inquiry")
	}
	return full.ToDto(), nil
}
