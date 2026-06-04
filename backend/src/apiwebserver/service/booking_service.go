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

		// The agent who listed the property is the one responsible for the
		// viewing — assign to them directly. Admin can reassign later if needed.
		// The real-estate owner (Property.OwnerInfo) is intentionally not
		// emailed; only the listing agent gets the company notification.
		agentID := property.AgentID

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

		// Fire-and-forget notifications to BOTH the assigned agent and the
		// customer. Booking creation already succeeded — email failures must
		// not roll it back.
		s.notifyAppointmentAsync(full)

		results = append(results, *full.ToDto())
	}

	return results, nil
}

// notifyAppointmentAsync fires both the LISTING AGENT notification and the
// CUSTOMER confirmation on a goroutine after a booking is created. The
// "listing agent" is the agent who posted the property — they receive a
// company-branded notification of the viewing request. The property's real
// owner is NOT emailed. Panics swallowed + logged so SMTP failures don't
// roll back the booking.
func (s *BookingService) notifyAppointmentAsync(b model.Booking) {
	go func(b model.Booking) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[email] panic while sending booking %d notifications: %v", b.ID, r)
			}
		}()
		// Listing agent notification.
		if b.AssignedAgent != nil && b.AssignedAgent.Email != "" {
			if msg, err := email.BuildAppointmentNotification(&b, b.AssignedAgent); err != nil {
				log.Printf("[email] failed to build booking %d agent notification: %v", b.ID, err)
			} else if err := s.mailer.Send(msg); err != nil {
				log.Printf("[email] failed to send booking %d agent notification: %v", b.ID, err)
			} else {
				log.Printf("[email] booking %d agent notification sent to %s (bcc=%q)", b.ID, msg.To, msg.Bcc)
			}
		} else {
			log.Printf("[email] booking %d has no listing agent with an email — skipping agent notification", b.ID)
		}
		// Customer confirmation.
		agent := b.AssignedAgent
		if agent == nil {
			agent = &model.User{} // empty fields → template omits agent rows
		}
		if msg, err := email.BuildAppointmentConfirmation(&b, agent); err != nil {
			log.Printf("[email] skipping booking %d customer confirmation: %v", b.ID, err)
		} else if err := s.mailer.Send(msg); err != nil {
			log.Printf("[email] failed to send booking %d customer confirmation: %v", b.ID, err)
		} else {
			log.Printf("[email] booking %d customer confirmation sent to %s (bcc=%q)", b.ID, msg.To, msg.Bcc)
		}
	}(b)
}

// NotifyAgentAssignedAsync sends the agent the appointment notification when
// an admin assigns/reassigns the booking to them. Called by AdminService.
func (s *BookingService) NotifyAgentAssignedAsync(b model.Booking) {
	if b.AssignedAgent == nil || b.AssignedAgent.Email == "" {
		log.Printf("[email] skipping booking %d agent notification — no assigned agent or agent email", b.ID)
		return
	}
	go func(b model.Booking) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[email] panic while sending booking %d agent notification: %v", b.ID, r)
			}
		}()
		msg, err := email.BuildAppointmentNotification(&b, b.AssignedAgent)
		if err != nil {
			log.Printf("[email] failed to build booking %d agent notification: %v", b.ID, err)
			return
		}
		if err := s.mailer.Send(msg); err != nil {
			log.Printf("[email] failed to send booking %d agent notification: %v", b.ID, err)
			return
		}
		log.Printf("[email] booking %d agent notification sent to %s (bcc=%q)", b.ID, msg.To, msg.Bcc)
	}(b)
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
