package model

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	PropertyID  uint     `gorm:"not null;index"`
	Property    Property `gorm:"foreignKey:PropertyID"`
	UserID      uint     `gorm:"not null"`
	User        User     `gorm:"foreignKey:UserID"`
	Rating      int      `gorm:"check:rating >= 1 AND rating <= 5"`
	Comment     string
	Reply       string
	RepliedByID *uint
	RepliedBy   *User `gorm:"foreignKey:RepliedByID"`
	RepliedAt   *time.Time
}

type ReviewDto struct {
	ID            uint     `json:"id"`
	PropertyID    uint     `json:"propertyId"`
	UserID        uint     `json:"userId"`
	UserName      string   `json:"userName"`
	Rating        int      `json:"rating"`
	Comment       string   `json:"comment"`
	CreatedAt     string   `json:"createdAt"`
	Reply         string   `json:"reply,omitempty"`
	RepliedByName string   `json:"repliedByName,omitempty"`
	RepliedByRole UserRole `json:"repliedByRole,omitempty"`
	RepliedAt     string   `json:"repliedAt,omitempty"`
}

func (r *Review) ToDto() *ReviewDto {
	dto := &ReviewDto{
		ID:         r.ID,
		PropertyID: r.PropertyID,
		UserID:     r.UserID,
		UserName:   r.User.Name,
		Rating:     r.Rating,
		Comment:    r.Comment,
		CreatedAt:  r.CreatedAt.Format(time.RFC3339),
		Reply:      r.Reply,
	}
	if r.RepliedBy != nil {
		dto.RepliedByName = r.RepliedBy.Name
		dto.RepliedByRole = r.RepliedBy.Role
	}
	if r.RepliedAt != nil {
		dto.RepliedAt = r.RepliedAt.Format(time.RFC3339)
	}
	return dto
}
