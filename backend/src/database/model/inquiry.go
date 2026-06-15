package model

import (
	"time"

	"gorm.io/gorm"
)

type InquiryStatus string

const (
	InquiryNew       InquiryStatus = "new"
	InquiryContacted InquiryStatus = "contacted"
)

type Inquiry struct {
	gorm.Model
	UserID     uint     `gorm:"not null"`
	User       User     `gorm:"foreignKey:UserID"`
	PropertyID uint     `gorm:"not null"`
	Property   Property `gorm:"foreignKey:PropertyID"`
	AgentID    *uint    `gorm:"index"`
	Agent      *User `gorm:"foreignKey:AgentID"`
	Name       string `gorm:"not null"`
	Phone      string `gorm:"not null"`
	Message    string
	Status     InquiryStatus `gorm:"type:varchar(20);not null;default:'new'"`
}

type InquiryDto struct {
	ID            uint          `json:"id"`
	UserID        uint          `json:"userId"`
	UserName      string        `json:"userName"`
	UserEmail     string        `json:"userEmail"`
	PropertyID    uint          `json:"propertyId"`
	PropertyTitle string        `json:"propertyTitle"`
	AgentID       *uint         `json:"agentId"`
	AgentName     string        `json:"agentName"`
	Name          string        `json:"name"`
	Phone         string        `json:"phone"`
	Message       string        `json:"message"`
	Status        InquiryStatus `json:"status"`
	CreatedAt     string        `json:"createdAt"`
}

func (i *Inquiry) ToDto() *InquiryDto {
	dto := &InquiryDto{
		ID:            i.ID,
		UserID:        i.UserID,
		UserName:      i.User.Name,
		UserEmail:     i.User.Email,
		PropertyID:    i.PropertyID,
		PropertyTitle: i.Property.Title,
		AgentID:       i.AgentID,
		Name:          i.Name,
		Phone:         i.Phone,
		Message:       i.Message,
		Status:        i.Status,
		CreatedAt:     i.CreatedAt.Format(time.RFC3339),
	}
	if i.Agent != nil {
		dto.AgentName = i.Agent.Name
	}
	return dto
}
