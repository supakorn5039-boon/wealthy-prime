package model

import (
	"time"

	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	PropertyID uint     `gorm:"not null"`
	Property   Property `gorm:"foreignKey:PropertyID"`
	UserID     uint     `gorm:"not null"`
	User       User     `gorm:"foreignKey:UserID"`
	Rating     int      `gorm:"check:rating >= 1 AND rating <= 5"`
	Comment    string
}

type ReviewDto struct {
	ID         uint   `json:"id"`
	PropertyID uint   `json:"propertyId"`
	UserID     uint   `json:"userId"`
	UserName   string `json:"userName"`
	Rating     int    `json:"rating"`
	Comment    string `json:"comment"`
	CreatedAt  string `json:"createdAt"`
}

func (r *Review) ToDto() *ReviewDto {
	return &ReviewDto{
		ID:         r.ID,
		PropertyID: r.PropertyID,
		UserID:     r.UserID,
		UserName:   r.User.Name,
		Rating:     r.Rating,
		Comment:    r.Comment,
		CreatedAt:  r.CreatedAt.Format(time.RFC3339),
	}
}
