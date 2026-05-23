package model

import (
	"time"

	"gorm.io/gorm"
)

type BookingStatus string

const (
	BookingPending   BookingStatus = "pending"
	BookingAssigned  BookingStatus = "assigned"
	BookingCompleted BookingStatus = "completed"
	BookingCancelled BookingStatus = "cancelled"
)

type Booking struct {
	gorm.Model
	UserID          uint          `gorm:"not null"`
	User            User          `gorm:"foreignKey:UserID"`
	PropertyID      uint          `gorm:"not null"`
	Property        Property      `gorm:"foreignKey:PropertyID"`
	AppointmentDate time.Time     `gorm:"not null"`
	Note            string
	Status          BookingStatus `gorm:"type:varchar(20);not null;default:'pending'"`
	AssignedAgentID *uint
	AssignedAgent   *User         `gorm:"foreignKey:AssignedAgentID"`
}

type BookingDto struct {
	ID              uint          `json:"id"`
	UserID          uint          `json:"userId"`
	UserName        string        `json:"userName"`
	UserEmail       string        `json:"userEmail"`
	UserPhone       string        `json:"userPhone"`
	PropertyID      uint          `json:"propertyId"`
	PropertyTitle   string        `json:"propertyTitle"`
	AppointmentDate string        `json:"appointmentDate"`
	Note            string        `json:"note"`
	Status          BookingStatus `json:"status"`
	AssignedAgentID *uint         `json:"assignedAgentId"`
	AgentName       string        `json:"agentName"`
	CreatedAt       string        `json:"createdAt"`
}

func (b *Booking) ToDto() *BookingDto {
	dto := &BookingDto{
		ID:              b.ID,
		UserID:          b.UserID,
		UserName:        b.User.Name,
		UserEmail:       b.User.Email,
		UserPhone:       b.User.Phone,
		PropertyID:      b.PropertyID,
		PropertyTitle:   b.Property.Title,
		AppointmentDate: b.AppointmentDate.Format(time.RFC3339),
		Note:            b.Note,
		Status:          b.Status,
		AssignedAgentID: b.AssignedAgentID,
		CreatedAt:       b.CreatedAt.Format(time.RFC3339),
	}
	if b.AssignedAgent != nil {
		dto.AgentName = b.AssignedAgent.Name
	}
	return dto
}
