package model

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAgent UserRole = "agent"
	RoleAdmin UserRole = "admin"
)

type User struct {
	gorm.Model
	Name           string   `gorm:"not null"`
	FirstName      string
	LastName       string
	Email          string   `gorm:"uniqueIndex;not null"`
	PasswordHash   string   `gorm:"not null"`
	Phone          string   `gorm:"not null"`
	SecondaryPhone string
	LineID         string
	Facebook       string
	Wechat         string
	Whatsapp       string
	AgentCode      string   `gorm:"index"`
	Role           UserRole `gorm:"type:varchar(20);not null;default:'user'"`
}

type UserDto struct {
	ID             uint     `json:"id"`
	Name           string   `json:"name"`
	FirstName      string   `json:"firstName"`
	LastName       string   `json:"lastName"`
	Email          string   `json:"email"`
	Phone          string   `json:"phone"`
	SecondaryPhone string   `json:"secondaryPhone"`
	LineID         string   `json:"lineId"`
	Facebook       string   `json:"facebook"`
	Wechat         string   `json:"wechat"`
	Whatsapp       string   `json:"whatsapp"`
	AgentCode      string   `json:"agentCode"`
	Role           UserRole `json:"role"`
	CreatedAt      string   `json:"createdAt"`
}

func (u *User) ToDto() *UserDto {
	return &UserDto{
		ID:             u.ID,
		Name:           u.Name,
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		Email:          u.Email,
		Phone:          u.Phone,
		SecondaryPhone: u.SecondaryPhone,
		LineID:         u.LineID,
		Facebook:       u.Facebook,
		Wechat:         u.Wechat,
		Whatsapp:       u.Whatsapp,
		AgentCode:      u.AgentCode,
		Role:           u.Role,
		CreatedAt:      u.CreatedAt.Format(time.RFC3339),
	}
}

// ComposeName builds Name from FirstName + LastName when both provided.
// Existing single-field Name remains untouched if first/last empty.
func ComposeName(first, last, fallback string) string {
	first = strings.TrimSpace(first)
	last = strings.TrimSpace(last)
	if first == "" && last == "" {
		return fallback
	}
	parts := []string{}
	if first != "" {
		parts = append(parts, first)
	}
	if last != "" {
		parts = append(parts, last)
	}
	return strings.Join(parts, " ")
}
