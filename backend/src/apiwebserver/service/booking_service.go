package service

import (
	"errors"
	"log"
	mathRand "math/rand/v2"
	"strconv"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/email"
	"github.com/wealthy-prime/backend/src/pkg/timezone"
)

// ActiveBookingStatuses are the states that count toward an agent's daily
// load and a user's active-booking cap. Exported so admin queries that
// filter "open" bookings share the same definition.
var ActiveBookingStatuses = []model.BookingStatus{model.BookingPending, model.BookingAssigned}

// maxBookingsPerAgentPerDay caps an agent at 3 active bookings per calendar
// day (ICT). Beyond that, new bookings get assigned to a random other agent
// to spread the load.
const maxBookingsPerAgentPerDay = 3

// Per-request input caps that bound the blast radius of automated/scripted
// abuse before any agent-assignment logic runs.
const (
	maxPropertiesPerRequest  = 5
	maxActiveBookingsPerUser = 20
)

type BookingService struct {
	db     *gorm.DB
	mailer email.Sender
}

func NewBookingService() *BookingService {
	return &BookingService{db: database.DB, mailer: email.New()}
}

// NewBookingServiceWithDeps lets tests inject an isolated DB + non-real
// email sender instead of mutating the package globals.
func NewBookingServiceWithDeps(db *gorm.DB, mailer email.Sender) *BookingService {
	return &BookingService{db: db, mailer: mailer}
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

// CreateBookings creates one booking per property ID. The booking is
// auto-assigned to the property's owning agent (status = assigned). If that
// agent already has maxBookingsPerAgentPerDay bookings on the appointment
// day, the booking is assigned to a random other approved agent instead. If
// the property has no agent at all, the booking stays pending and the admin
// queue picks it up.
func (s *BookingService) CreateBookings(userID uint, input CreateBookingsInput) ([]model.BookingDto, error) {
	if len(input.PropertyIDs) > maxPropertiesPerRequest {
		return nil, apperror.BadRequest("too many properties in one request; max " + strconv.Itoa(maxPropertiesPerRequest))
	}

	// Cap each user's active (pending + assigned) bookings. Stops a single
	// account — including an auto-approved one — from flooding agents' days.
	var userActive int64
	if err := s.db.Model(&model.Booking{}).
		Where("user_id = ? AND status IN ?", userID, ActiveBookingStatuses).
		Count(&userActive).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "database error counting user bookings")
	}
	if userActive+int64(len(input.PropertyIDs)) > int64(maxActiveBookingsPerUser) {
		return nil, apperror.BadRequest("too many active bookings; finish or cancel existing ones first")
	}

	results := make([]model.BookingDto, 0, len(input.PropertyIDs))

	for _, propertyID := range input.PropertyIDs {
		var notify model.Booking
		var dto *model.BookingDto

		// Each booking runs in its own tx so the advisory lock on
		// (preferredAgent, day) is held across the count and the insert. This
		// closes the read-then-write race that would otherwise let many
		// concurrent requests all read count=0 and all assign to the same
		// agent past the cap.
		txErr := s.db.Transaction(func(tx *gorm.DB) error {
			var property model.Property
			err := tx.First(&property, propertyID).Error
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return apperror.NotFound("property " + uintToStr(propertyID))
			}
			if err != nil {
				return apperror.Wrap(err, 500, "database error fetching property")
			}

			status := model.BookingPending
			assignedAgentID := property.AgentID
			if assignedAgentID != nil {
				reassign, err := s.maybeReassignForLoadTx(tx, *assignedAgentID, input.AppointmentDate)
				if err != nil {
					return err
				}
				if reassign != nil {
					assignedAgentID = reassign
				}
				status = model.BookingAssigned
			}

			booking := model.Booking{
				UserID:          userID,
				PropertyID:      propertyID,
				AppointmentDate: input.AppointmentDate,
				Note:            input.Note,
				Status:          status,
				AssignedAgentID: assignedAgentID,
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

			if err := tx.Create(&booking).Error; err != nil {
				return apperror.Wrap(err, 500, "failed to create booking")
			}

			if err := tx.Preload("User").Preload("Property").Preload("AssignedAgent").
				First(&notify, booking.ID).Error; err != nil {
				return apperror.Wrap(err, 500, "failed to reload booking")
			}
			dto = notify.ToDto()
			return nil
		})
		if txErr != nil {
			return nil, txErr
		}

		// Notify only after the tx commits, so we never email about a booking
		// that was rolled back.
		s.notifyAppointmentAsync(notify)
		results = append(results, *dto)
	}

	return results, nil
}

// notifyAppointmentAsync sends the customer confirmation and, when the
// booking was auto-assigned, the agent notification — both off the request
// path. SMTP failures must not roll the booking back, so panics are recovered
// + logged. When unassigned, the customer email still goes out (the template
// omits agent rows when fields are blank) and the agent step is skipped.
func (s *BookingService) notifyAppointmentAsync(b model.Booking) {
	go func(b model.Booking) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[email] panic while sending booking %d notifications: %v", b.ID, r)
			}
		}()

		agent := b.AssignedAgent
		if agent == nil {
			agent = &model.User{}
		}
		if msg, err := email.BuildAppointmentConfirmation(&b, agent); err != nil {
			log.Printf("[email] skipping booking %d customer confirmation: %v", b.ID, err)
		} else if err := s.mailer.Send(msg); err != nil {
			log.Printf("[email] failed to send booking %d customer confirmation: %v", b.ID, err)
		} else {
			log.Printf("[email] booking %d customer confirmation sent to %s (bcc=%q)", b.ID, msg.To, msg.Bcc)
		}

		s.sendAgentNotification(b)
	}(b)
}

// sendAgentNotification builds and sends the agent notification, logging the
// outcome. Synchronous — the caller owns goroutine + panic recovery.
func (s *BookingService) sendAgentNotification(b model.Booking) {
	if b.AssignedAgent == nil || b.AssignedAgent.Email == "" {
		log.Printf("[email] skipping booking %d agent notification — no assigned agent or agent email", b.ID)
		return
	}
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
}

// maybeReassignForLoadTx returns a different agent ID when preferredAgentID
// already has maxBookingsPerAgentPerDay active bookings on the appointment
// day (00:00–23:59 ICT). Returns nil when no reassignment is needed or no
// other approved agent is available — the caller falls back to
// preferredAgentID in that case.
//
// Must run inside a transaction. Takes a per-tx Postgres advisory lock keyed
// on (preferredAgentID, dayStart) so the count, decision, and insert that
// follows are serialized for that (agent, day) pair. The lock auto-releases
// when the tx commits or rolls back. Different (agent, day) pairs do not
// contend, so unrelated bookings stay parallel.
func (s *BookingService) maybeReassignForLoadTx(tx *gorm.DB, preferredAgentID uint, appointmentDate time.Time) (*uint, error) {
	local := appointmentDate.In(timezone.ICT)
	dayStart := time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, timezone.ICT)
	dayEnd := dayStart.Add(24 * time.Hour)

	// pg_advisory_xact_lock(int4, int4) — agent ID + days-since-epoch fit
	// comfortably in int32. Two-key form keeps the lock space sparse.
	daysSinceEpoch := int32(dayStart.Unix() / 86400)
	if err := tx.Exec("SELECT pg_advisory_xact_lock(?, ?)", int32(preferredAgentID), daysSinceEpoch).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to acquire booking lock")
	}

	var count int64
	if err := tx.Model(&model.Booking{}).
		Where("assigned_agent_id = ? AND status IN ? AND appointment_date >= ? AND appointment_date < ?",
			preferredAgentID, ActiveBookingStatuses, dayStart, dayEnd).
		Count(&count).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "database error counting agent bookings")
	}
	if count < maxBookingsPerAgentPerDay {
		return nil, nil
	}

	var pool []model.User
	if err := tx.Select("id").
		Where("role = ? AND is_approved = ? AND id <> ?", model.RoleAgent, true, preferredAgentID).
		Find(&pool).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "database error fetching agent pool")
	}
	if len(pool) == 0 {
		log.Printf("[booking] agent %d at cap (%d) on %s but no other agent available; keeping assignment",
			preferredAgentID, count, dayStart.Format("2006-01-02"))
		return nil, nil
	}

	pick := pool[mathRand.IntN(len(pool))].ID
	log.Printf("[booking] agent %d at cap (%d) on %s; reassigning to agent %d",
		preferredAgentID, count, dayStart.Format("2006-01-02"), pick)
	return &pick, nil
}

// NotifyAgentAssignedAsync sends the agent the appointment notification when
// an admin assigns/reassigns the booking to them. Called by AdminService.
func (s *BookingService) NotifyAgentAssignedAsync(b model.Booking) {
	go func(b model.Booking) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[email] panic while sending booking %d agent notification: %v", b.ID, r)
			}
		}()
		s.sendAgentNotification(b)
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

func uintToStr(v uint) string {
	return strconv.FormatUint(uint64(v), 10)
}
