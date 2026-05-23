package service

import (
	"errors"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService() *AuthService {
	return &AuthService{db: database.DB}
}

type RegisterInput struct {
	Name     string         `json:"name"     binding:"required"`
	Email    string         `json:"email"    binding:"required,email"`
	Password string         `json:"password" binding:"required,min=6"`
	Phone    string         `json:"phone"    binding:"required"`
	Role     model.UserRole `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	User  *model.UserDto `json:"user"`
}

// Register creates a new user account.
func (s *AuthService) Register(input RegisterInput) (*model.UserDto, error) {
	// Validate role — only user and agent allowed on self-register
	if input.Role == "" {
		input.Role = model.RoleUser
	}
	if input.Role != model.RoleUser && input.Role != model.RoleAgent {
		input.Role = model.RoleUser
	}

	// Check email uniqueness
	var existing model.User
	err := s.db.Where("email = ?", input.Email).First(&existing).Error
	if err == nil {
		return nil, apperror.Conflict("email already registered")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.Wrap(err, 500, "database error checking email")
	}

	hash, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to hash password")
	}

	user := model.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: hash,
		Phone:        input.Phone,
		Role:         input.Role,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to create user")
	}

	return user.ToDto(), nil
}

// Login verifies credentials and returns a JWT + user DTO.
func (s *AuthService) Login(input LoginInput) (*LoginResponse, error) {
	var user model.User
	err := s.db.Where("email = ?", input.Email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.Unauthorized("invalid email or password")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error during login")
	}

	if !security.CheckPassword(user.PasswordHash, input.Password) {
		return nil, apperror.Unauthorized("invalid email or password")
	}

	token, err := security.GenerateJWT(user.ID, user.Role, user.Email)
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to generate token")
	}

	return &LoginResponse{Token: token, User: user.ToDto()}, nil
}
