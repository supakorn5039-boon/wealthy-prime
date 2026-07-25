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

	WorkNotSet            AppointmentWorkStatus = ""
	WorkContacted         AppointmentWorkStatus = "contacted"
	WorkVisited           AppointmentWorkStatus = "visited"
	WorkBooked            AppointmentWorkStatus = "booked"
	WorkClosedDeal        AppointmentWorkStatus = "closed_deal"
	WorkCustomerCancelled AppointmentWorkStatus = "customer_cancelled"
)

type Booking struct {
	gorm.Model
	UserID          uint      `gorm:"not null;index"`
	User            User      `gorm:"foreignKey:UserID"`
	PropertyID      uint      `gorm:"not null"`
	Property        Property  `gorm:"foreignKey:PropertyID"`
	AppointmentDate time.Time `gorm:"not null"`
	Note            string
	Status          BookingStatus `gorm:"type:varchar(20);not null;default:'pending'"`
	AssignedAgentID *uint         `gorm:"index"`
	AssignedAgent   *User         `gorm:"foreignKey:AssignedAgentID"`

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

	WorkStatus AppointmentWorkStatus `gorm:"type:varchar(30)"`
}

type BookingDto struct {
	ID                  uint                  `json:"id"`
	UserID              uint                  `json:"userId"`
	UserName            string                `json:"userName"`
	UserEmail           string                `json:"userEmail"`
	UserPhone           string                `json:"userPhone"`
	PropertyID          uint                  `json:"propertyId"`
	PropertyTitle       string                `json:"propertyTitle"`
	PropertyCode        string                `json:"propertyCode"`
	PropertyStatus      PropertyStatus        `json:"propertyStatus"`
	AppointmentDate     string                `json:"appointmentDate"`
	Note                string                `json:"note"`
	Status              BookingStatus         `json:"status"`
	WorkStatus          AppointmentWorkStatus `json:"workStatus"`
	AssignedAgentID     *uint                 `json:"assignedAgentId"`
	AgentName           string                `json:"agentName"`
	FirstName           string                `json:"firstName"`
	LastName            string                `json:"lastName"`
	Phone               string                `json:"phone"`
	SecondaryPhone      string                `json:"secondaryPhone"`
	LatestContact       string                `json:"latestContact"`
	LineID              string                `json:"lineId"`
	Email               string                `json:"email"`
	Facebook            string                `json:"facebook"`
	Wechat              string                `json:"wechat"`
	Whatsapp            string                `json:"whatsapp"`
	CreatedAt           string                `json:"createdAt"`
	ListingOwner        *ListingOwnerPreview  `json:"listingOwner,omitempty"`
	PropertyDocumentURL string                `json:"propertyDocumentUrl"`
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
		PropertyStatus:  b.Property.Status,
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
