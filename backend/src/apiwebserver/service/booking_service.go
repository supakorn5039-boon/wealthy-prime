package service

import (
	"errors"
	"log"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/email"
)

type BookingService struct {
	db     *gorm.DB
	mailer email.Sender
}

func NewBookingService() *BookingService {
	return &BookingService{db: database.DB, mailer: email.New()}
}

type CreateBookingsInput struct {
	PropertyIDs     []uint    `json:"property_ids" binding:"required,min=1"`
	AppointmentDate time.Time `json:"appointment_date" binding:"required"`
	Note            string    `json:"note"`

	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Phone          string `json:"phone"`
	SecondaryPhone string `json:"secondaryPhone"`
	LatestContact  string `json:"latestContact"`
	LineID         string `json:"lineId"`
	Email          string `json:"email"`
	Facebook       string `json:"facebook"`
	Wechat         string `json:"wechat"`
	Whatsapp       string `json:"whatsapp"`
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
			FirstName:       input.FirstName,
			LastName:        input.LastName,
			Phone:           input.Phone,
			SecondaryPhone:  input.SecondaryPhone,
			LatestContact:   input.LatestContact,
			LineID:          input.LineID,
			Email:           input.Email,
			Facebook:        input.Facebook,
			Wechat:          input.Wechat,
			Whatsapp:        input.Whatsapp,
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

		// Fire-and-forget notification to the assigned agent.
		// Booking creation already succeeded — email failures must not roll it back.
		s.notifyAgentAsync(full)

		results = append(results, *full.ToDto())
	}

	return results, nil
}

// notifyAgentAsync sends the appointment notification on a goroutine so the
// HTTP response doesn't wait on SMTP. Panics are swallowed and logged.
func (s *BookingService) notifyAgentAsync(b model.Booking) {
	if b.AssignedAgent == nil || b.AssignedAgent.Email == "" {
		log.Printf("[email] skipping booking %d notification — no assigned agent or agent email", b.ID)
		return
	}
	go func(b model.Booking) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[email] panic while sending booking %d notification: %v", b.ID, r)
			}
		}()
		msg, err := email.BuildAppointmentNotification(&b, b.AssignedAgent)
		if err != nil {
			log.Printf("[email] failed to build booking %d notification: %v", b.ID, err)
			return
		}
		if err := s.mailer.Send(msg); err != nil {
			log.Printf("[email] failed to send booking %d notification: %v", b.ID, err)
			return
		}
		log.Printf("[email] booking %d notification sent to %s", b.ID, msg.To)
	}(b)
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

// GetUserBooking returns a single booking owned by the given user.
func (s *BookingService) GetUserBooking(userID, bookingID uint) (*model.BookingDto, error) {
	var booking model.Booking
	err := s.db.Preload("User").Preload("Property").Preload("AssignedAgent").
		Where("user_id = ? AND id = ?", userID, bookingID).First(&booking).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("booking")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch booking")
	}
	return booking.ToDto(), nil
}

// UpdateUserBookingStatus changes the status of a user's own booking
// (currently only used for self-cancellation).
func (s *BookingService) UpdateUserBookingStatus(userID, bookingID uint, status model.BookingStatus) (*model.BookingDto, error) {
	var booking model.Booking
	err := s.db.Where("user_id = ? AND id = ?", userID, bookingID).First(&booking).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("booking")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch booking")
	}

	if err := s.db.Model(&booking).Update("status", status).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update booking")
	}

	return s.GetUserBooking(userID, bookingID)
}

func uintToStr(v uint) string {
	return strconv.FormatUint(uint64(v), 10)
}
