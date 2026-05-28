package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AgentService struct {
	db *gorm.DB
}

func NewAgentService() *AgentService {
	return &AgentService{db: database.DB}
}

type AgentDashboard struct {
	Total     int64 `json:"total"`
	Reserved  int64 `json:"reserved"`
	Available int64 `json:"available"`
}

// GetDashboard returns property counts for the agent.
func (s *AgentService) GetDashboard(agentID uint) (*AgentDashboard, error) {
	var total, reserved, available int64

	if err := s.db.Model(&model.Property{}).Where("agent_id = ?", agentID).Count(&total).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count total properties")
	}
	if err := s.db.Model(&model.Property{}).Where("agent_id = ? AND status = ?", agentID, model.StatusReserved).Count(&reserved).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count reserved properties")
	}
	if err := s.db.Model(&model.Property{}).Where("agent_id = ? AND status = ?", agentID, model.StatusAvailable).Count(&available).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to count available properties")
	}

	return &AgentDashboard{
		Total:     total,
		Reserved:  reserved,
		Available: available,
	}, nil
}

// GetContacts returns bookings assigned to the agent.
func (s *AgentService) GetContacts(agentID uint) ([]model.BookingDto, error) {
	var bookings []model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		Where("assigned_agent_id = ?", agentID).Find(&bookings).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch contacts")
	}
	dtos := make([]model.BookingDto, len(bookings))
	for i, b := range bookings {
		dtos[i] = *b.ToDto()
	}
	return dtos, nil
}

// UpdateNote updates the note on a booking assigned to this agent.
func (s *AgentService) UpdateNote(agentID, bookingID uint, note string) (*model.BookingDto, error) {
	var booking model.Booking
	err := s.db.First(&booking, bookingID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("booking")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if booking.AssignedAgentID == nil || *booking.AssignedAgentID != agentID {
		return nil, apperror.Forbidden("this booking is not assigned to you")
	}

	if err := s.db.Model(&booking).Update("note", note).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update note")
	}

	// Reload with preloads
	var full model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		First(&full, bookingID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload booking")
	}

	return full.ToDto(), nil
}

// GenerateReviewLink creates an HMAC-signed URL for a property review.
// Token format: base64url(propertyID:agentID).base64url(hmac)
// The token is self-contained — ParseReviewToken decodes it without DB lookup.
func (s *AgentService) GenerateReviewLink(agentID, propertyID uint, baseURL string) (string, error) {
	token := signReviewToken(propertyID, agentID)

	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}

	url := fmt.Sprintf("%s/review/%s", baseURL, token)
	return url, nil
}

// ParseReviewToken verifies the HMAC and returns the embedded property ID.
func ParseReviewToken(token string) (propertyID, agentID uint, err error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return 0, 0, apperror.BadRequest("invalid token format")
	}
	payloadRaw, decodeErr := base64.URLEncoding.DecodeString(parts[0])
	if decodeErr != nil {
		return 0, 0, apperror.BadRequest("invalid token payload")
	}
	gotSig, decodeErr := base64.URLEncoding.DecodeString(parts[1])
	if decodeErr != nil {
		return 0, 0, apperror.BadRequest("invalid token signature")
	}

	secret := config.App.Server.ReviewSecret
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payloadRaw)
	wantSig := mac.Sum(nil)
	if !hmac.Equal(gotSig, wantSig) {
		return 0, 0, apperror.Unauthorized("invalid or expired review link")
	}

	var pid, aid uint
	if _, err := fmt.Sscanf(string(payloadRaw), "%d:%d", &pid, &aid); err != nil {
		return 0, 0, apperror.BadRequest("invalid token payload format")
	}
	return pid, aid, nil
}

func signReviewToken(propertyID, agentID uint) string {
	payload := fmt.Appendf(nil, "%d:%d", propertyID, agentID)
	secret := config.App.Server.ReviewSecret
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	sig := mac.Sum(nil)
	return base64.URLEncoding.EncodeToString(payload) + "." + base64.URLEncoding.EncodeToString(sig)
}
