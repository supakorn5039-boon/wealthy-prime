package service

import (
	cryptoRand "crypto/rand"
	"errors"
	"fmt"

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
	Name           string         `json:"name"`
	FirstName      string         `json:"firstName"`
	LastName       string         `json:"lastName"`
	Email          string         `json:"email"    binding:"required,email"`
	Password       string         `json:"password" binding:"required,min=6"`
	Phone          string         `json:"phone"    binding:"required"`
	SecondaryPhone string         `json:"secondaryPhone"`
	LineID         string         `json:"lineId"`
	Facebook       string         `json:"facebook"`
	Wechat         string         `json:"wechat"`
	Whatsapp       string         `json:"whatsapp"`
	Role           model.UserRole `json:"role"`
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

	displayName := model.ComposeName(input.FirstName, input.LastName, input.Name)
	if displayName == "" {
		return nil, apperror.BadRequest("name is required")
	}

	user := model.User{
		Name:           displayName,
		FirstName:      input.FirstName,
		LastName:       input.LastName,
		Email:          input.Email,
		PasswordHash:   hash,
		Phone:          input.Phone,
		SecondaryPhone: input.SecondaryPhone,
		LineID:         input.LineID,
		Facebook:       input.Facebook,
		Wechat:         input.Wechat,
		Whatsapp:       input.Whatsapp,
		Role:           input.Role,
	}

	if user.Role == model.RoleAgent {
		code, err := generateAgentCode(s.db)
		if err != nil {
			return nil, apperror.Wrap(err, 500, "failed to generate agent code")
		}
		user.AgentCode = code
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to create user")
	}

	return user.ToDto(), nil
}

func generateAgentCode(db *gorm.DB) (string, error) {
	for range 10 {
		var buf [4]byte
		if _, err := cryptoRandRead(buf[:]); err != nil {
			return "", err
		}
		n := uint32(buf[0])<<24 | uint32(buf[1])<<16 | uint32(buf[2])<<8 | uint32(buf[3])
		code := fmt.Sprintf("A%06d", n%1_000_000)
		var count int64
		if err := db.Model(&model.User{}).Where("agent_code = ?", code).Count(&count).Error; err != nil {
			return "", err
		}
		if count == 0 {
			return code, nil
		}
	}
	return "", errors.New("could not generate unique agent code")
}

// indirected to allow easy testing if needed
var cryptoRandRead = cryptoRand.Read

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
