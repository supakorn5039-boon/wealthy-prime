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

func NewAgentServiceWithDB(db *gorm.DB) *AgentService {
	return &AgentService{db: db}
}

type AgentDashboard struct {
	TotalProperties     int64 `json:"totalProperties"`
	ReservedProperties  int64 `json:"reservedProperties"`
	AvailableProperties int64 `json:"availableProperties"`

	SellListings int64 `json:"sellListings"`
	RentListings int64 `json:"rentListings"`
	BothListings int64 `json:"bothListings"`
}

func (s *AgentService) GetDashboard(agentID uint) (*AgentDashboard, error) {
	var d AgentDashboard
	err := s.db.Model(&model.Property{}).
		Select(`
			COUNT(*) AS total_properties,
			COUNT(*) FILTER (WHERE status = ?) AS available_properties,
			COUNT(*) FILTER (WHERE status = ?) AS reserved_properties,
			COUNT(*) FILTER (WHERE listing = ?) AS sell_listings,
			COUNT(*) FILTER (WHERE listing = ?) AS rent_listings,
			COUNT(*) FILTER (WHERE listing = ?) AS both_listings`,
			model.StatusAvailable, model.StatusReserved,
			model.ListingSell, model.ListingRent, model.ListingBoth,
		).
		Where("agent_id = ?", agentID).
		Scan(&d).Error
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to load agent dashboard")
	}
	return &d, nil
}

func (s *AgentService) GetContacts(agentID uint) ([]model.BookingDto, error) {
	var bookings []model.Booking
	if err := s.db.
		Preload("User").
		Preload("Property").
		Preload("AssignedAgent").
		Where("assigned_agent_id = ?", agentID).
		Find(&bookings).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch contacts")
	}
	dtos := make([]model.BookingDto, len(bookings))
	for i, b := range bookings {
		dto := *b.ToDto()
		dto.ListingOwner = model.NewListingOwnerPreview(&b.Property)
		dto.PropertyDocumentURL = b.Property.OwnerDocumentURL
		dtos[i] = dto
	}
	return dtos, nil
}

func (s *AgentService) UpdateWorkStatus(agentID, bookingID uint, ws model.AppointmentWorkStatus) (*model.BookingDto, error) {
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

	if ws == model.WorkBooked || ws == model.WorkClosedDeal {
		var property model.Property
		if err := s.db.Select("id", "status").First(&property, booking.PropertyID).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "database error fetching property")
		}
		if property.Status == model.StatusReserved || property.Status == model.StatusUnavailable || property.Status == model.StatusSold {
			return nil, apperror.Conflict("property is reserved or unavailable; cannot set work status to booked or closed deal")
		}

		var count int64
		if err := s.db.Model(&model.Booking{}).
			Where("property_id = ? AND id <> ? AND (work_status = ? OR work_status = ?)",
				booking.PropertyID, bookingID, model.WorkBooked, model.WorkClosedDeal).
			Count(&count).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "database error checking existing bookings")
		}
		if count > 0 {
			return nil, apperror.Conflict("another booking for this property is already booked or closed deal")
		}
	}

	updates := map[string]interface{}{"work_status": ws}
	switch ws {
	case model.WorkClosedDeal:
		updates["status"] = model.BookingCompleted
	case model.WorkCustomerCancelled:
		updates["status"] = model.BookingCancelled
	}
	if err := s.db.Model(&booking).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update work status")
	}

	var full model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		First(&full, bookingID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload booking")
	}
	return full.ToDto(), nil
}

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

	var full model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		First(&full, bookingID).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to reload booking")
	}

	return full.ToDto(), nil
}

func (s *AgentService) GenerateReviewLink(agentID, propertyID uint, baseURL string) (string, error) {
	token := signReviewToken(propertyID, agentID)

	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}

	url := fmt.Sprintf("%s/review/%s", baseURL, token)
	return url, nil
}

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
