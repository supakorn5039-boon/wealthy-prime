package service

import (
	"errors"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type BookingService struct {
	db *gorm.DB
}

func NewBookingService() *BookingService {
	return &BookingService{db: database.DB}
}

type CreateBookingsInput struct {
	PropertyIDs     []uint    `json:"property_ids" binding:"required,min=1"`
	AppointmentDate time.Time `json:"appointment_date" binding:"required"`
	Note            string    `json:"note"`
}

// CreateBookings creates one booking per property ID, auto-assigning the least-loaded agent.
func (s *BookingService) CreateBookings(userID uint, input CreateBookingsInput) ([]model.BookingDto, error) {
	var results []model.BookingDto

	for _, propertyID := range input.PropertyIDs {
		// Verify property exists
		var property model.Property
		err := s.db.First(&property, propertyID).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NotFound("property " + uintToStr(propertyID))
		}
		if err != nil {
			return nil, apperror.Wrap(err, 500, "database error fetching property")
		}

		// Auto-assign agent: pick agent with fewest pending bookings
		agentID, err := s.autoAssignAgent(propertyID)
		if err != nil {
			return nil, err
		}

		status := model.BookingPending
		if agentID != nil {
			status = model.BookingAssigned
		}

		booking := model.Booking{
			UserID:          userID,
			PropertyID:      propertyID,
			AppointmentDate: input.AppointmentDate,
			Note:            input.Note,
			Status:          status,
			AssignedAgentID: agentID,
		}

		if err := s.db.Create(&booking).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to create booking")
		}

		// Reload with preloads
		var full model.Booking
		if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
			First(&full, booking.ID).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to reload booking")
		}
		results = append(results, *full.ToDto())
	}

	return results, nil
}

// autoAssignAgent picks the agent globally with fewest pending bookings.
func (s *BookingService) autoAssignAgent(propertyID uint) (*uint, error) {
	// Pick agent with fewest pending bookings globally
	type agentLoad struct {
		UserID uint
		Count  int64
	}
	var result agentLoad

	err := s.db.Raw(`
		SELECT u.id AS user_id, COUNT(b.id) AS count
		FROM users u
		LEFT JOIN bookings b ON b.assigned_agent_id = u.id AND b.status = ? AND b.deleted_at IS NULL
		WHERE u.role = ? AND u.deleted_at IS NULL
		GROUP BY u.id
		ORDER BY count ASC
		LIMIT 1
	`, model.BookingPending, model.RoleAgent).Scan(&result).Error

	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to auto-assign agent")
	}

	if result.UserID == 0 {
		// No agents exist — allow booking without assignment
		return nil, nil
	}

	agentID := result.UserID
	return &agentID, nil
}

// GetUserBookings returns all bookings for a given user.
func (s *BookingService) GetUserBookings(userID uint) ([]model.BookingDto, error) {
	var bookings []model.Booking
	if err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		Where("user_id = ?", userID).Find(&bookings).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch bookings")
	}
	dtos := make([]model.BookingDto, len(bookings))
	for i, b := range bookings {
		dtos[i] = *b.ToDto()
	}
	return dtos, nil
}

func uintToStr(v uint) string {
	return strconv.FormatUint(uint64(v), 10)
}
