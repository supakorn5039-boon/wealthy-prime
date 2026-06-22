package model

import (
	"time"

	"gorm.io/gorm"
)

type BookingStatus string
type AppointmentWorkStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingAssigned  BookingStatus = "assigned"
	BookingCompleted BookingStatus = "completed"
	BookingCancelled BookingStatus = "cancelled"

	WorkContacted          AppointmentWorkStatus = "contacted"
	WorkVisited            AppointmentWorkStatus = "visited"
	WorkBooked             AppointmentWorkStatus = "booked"
	WorkClosedDeal         AppointmentWorkStatus = "closed_deal"
	WorkCustomerCancelled  AppointmentWorkStatus = "customer_cancelled"
)

type Booking struct {
	gorm.Model
	UserID          uint          `gorm:"not null;index"`
	User            User          `gorm:"foreignKey:UserID"`
	PropertyID      uint          `gorm:"not null"`
	Property        Property      `gorm:"foreignKey:PropertyID"`
	AppointmentDate time.Time     `gorm:"not null"`
	Note            string
	Status          BookingStatus `gorm:"type:varchar(20);not null;default:'pending'"`
	AssignedAgentID *uint         `gorm:"index"`
	AssignedAgent   *User         `gorm:"foreignKey:AssignedAgentID"`

	// Captured contact details at booking time (snapshot)
	FirstName      string
	LastName       string
	Phone          string
	SecondaryPhone string
	LatestContact  string
	LineID         string
	Email          string
	Facebook       string
	Wechat         string
	Whatsapp       string

	// Agent-side work tracking (parallel to Status)
	WorkStatus AppointmentWorkStatus `gorm:"type:varchar(30)"`
}

type BookingDto struct {
	ID              uint                  `json:"id"`
	UserID          uint                  `json:"userId"`
	UserName        string                `json:"userName"`
	UserEmail       string                `json:"userEmail"`
	UserPhone       string                `json:"userPhone"`
	PropertyID      uint                  `json:"propertyId"`
	PropertyTitle   string                `json:"propertyTitle"`
	PropertyCode    string                `json:"propertyCode"`
	AppointmentDate string                `json:"appointmentDate"`
	Note            string                `json:"note"`
	Status          BookingStatus         `json:"status"`
	WorkStatus      AppointmentWorkStatus `json:"workStatus"`
	AssignedAgentID *uint                 `json:"assignedAgentId"`
	AgentName       string                `json:"agentName"`
	FirstName       string                `json:"firstName"`
	LastName        string                `json:"lastName"`
	Phone           string                `json:"phone"`
	SecondaryPhone  string                `json:"secondaryPhone"`
	LatestContact   string                `json:"latestContact"`
	LineID          string                `json:"lineId"`
	Email           string                `json:"email"`
	Facebook        string                `json:"facebook"`
	Wechat          string                `json:"wechat"`
	Whatsapp        string                `json:"whatsapp"`
	CreatedAt       string                `json:"createdAt"`
	// ListingAgent is populated only when the viewer is assigned to handle the
	// booking but is NOT the listing agent — they need the original agent's
	// contact info to ask questions about the unit. Hidden by omitempty so the
	// field is absent when the viewer owns the listing.
	ListingAgent *ListingAgentPreview `json:"listingAgent,omitempty"`
}

// ListingAgentPreview is the subset of an agent's profile shown to another
// agent who has been assigned a booking on this listing.
type ListingAgentPreview struct {
	ID       uint   `json:"id"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	LineID   string `json:"lineId"`
	Facebook string `json:"facebook"`
	Wechat   string `json:"wechat"`
	Whatsapp string `json:"whatsapp"`
}

func NewListingAgentPreview(a *User) *ListingAgentPreview {
	if a == nil {
		return nil
	}
	return &ListingAgentPreview{
		ID:       a.ID,
		Name:     a.Name,
		Phone:    a.Phone,
		Email:    a.Email,
		LineID:   a.LineID,
		Facebook: a.Facebook,
		Wechat:   a.Wechat,
		Whatsapp: a.Whatsapp,
	}
}

func (b *Booking) ToDto() *BookingDto {
	dto := &BookingDto{
		ID:              b.ID,
		UserID:          b.UserID,
		UserName:        b.User.Name,
		UserEmail:       b.User.Email,
		UserPhone:       b.User.Phone,
		PropertyID:      b.PropertyID,
		PropertyTitle:   b.Property.ProjectName,
		PropertyCode:    b.Property.PropertyCode,
		AppointmentDate: b.AppointmentDate.Format(time.RFC3339),
		Note:            b.Note,
		Status:          b.Status,
		WorkStatus:      b.WorkStatus,
		AssignedAgentID: b.AssignedAgentID,
		FirstName:       b.FirstName,
		LastName:        b.LastName,
		Phone:           b.Phone,
		SecondaryPhone:  b.SecondaryPhone,
		LatestContact:   b.LatestContact,
		LineID:          b.LineID,
		Email:           b.Email,
		Facebook:        b.Facebook,
		Wechat:          b.Wechat,
		Whatsapp:        b.Whatsapp,
		CreatedAt:       b.CreatedAt.Format(time.RFC3339),
	}
	if b.AssignedAgent != nil {
		dto.AgentName = b.AssignedAgent.Name
	}
	return dto
}
