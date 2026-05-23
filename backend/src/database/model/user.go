package model

import (
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
	Name         string   `gorm:"not null"`
	Email        string   `gorm:"uniqueIndex;not null"`
	PasswordHash string   `gorm:"not null"`
	Phone        string   `gorm:"not null"`
	Role         UserRole `gorm:"type:varchar(20);not null;default:'user'"`
}

type UserDto struct {
	ID        uint     `json:"id"`
	Name      string   `json:"name"`
	Email     string   `json:"email"`
	Phone     string   `json:"phone"`
	Role      UserRole `json:"role"`
	CreatedAt string   `json:"createdAt"`
}

func (u *User) ToDto() *UserDto {
	return &UserDto{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		Phone:     u.Phone,
		Role:      u.Role,
		CreatedAt: u.CreatedAt.Format(time.RFC3339),
	}
}
