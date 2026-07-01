package service

import (
	cryptoRand "crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/email"
	"github.com/wealthy-prime/backend/src/security"
)

const passwordResetTTL = 30 * time.Minute

type AuthService struct {
	db     *gorm.DB
	mailer email.Sender
}

func NewAuthService() *AuthService {
	return &AuthService{db: database.DB, mailer: email.New()}
}

func NewAuthServiceWithDeps(db *gorm.DB, mailer email.Sender) *AuthService {
	return &AuthService{db: db, mailer: mailer}
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
	Token string         `json:"token"`
	User  *model.UserDto `json:"user"`
}

func (s *AuthService) Register(input RegisterInput) (*model.UserDto, error) {

	if input.Role == "" {
		input.Role = model.RoleUser
	}
	if input.Role != model.RoleUser && input.Role != model.RoleAgent {
		input.Role = model.RoleUser
	}

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

		IsApproved: input.Role == model.RoleUser,
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

var cryptoRandRead = cryptoRand.Read

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

	if !user.IsApproved && user.Role != model.RoleAdmin {
		return nil, apperror.Forbidden("Your account is awaiting admin approval")
	}

	token, err := security.GenerateJWT(user.ID, user.Role, user.Email)
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to generate token")
	}

	return &LoginResponse{Token: token, User: user.ToDto()}, nil
}

func (s *AuthService) RequestPasswordReset(emailAddr string) error {
	emailAddr = strings.TrimSpace(emailAddr)
	if emailAddr == "" {
		return nil
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[password-reset] panic recovered: %v", r)
			}
		}()
		s.dispatchPasswordReset(emailAddr)
	}()
	return nil
}

func (s *AuthService) dispatchPasswordReset(emailAddr string) {
	var user model.User
	err := s.db.Where("email = ?", emailAddr).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return
	}
	if err != nil {
		log.Printf("[password-reset] db lookup failed: %v", err)
		return
	}

	rawToken, err := generateResetToken()
	if err != nil {
		log.Printf("[password-reset] token gen failed: %v", err)
		return
	}
	tokenHash := hashResetToken(rawToken)
	expiresAt := time.Now().Add(passwordResetTTL)

	if err := s.db.Model(&user).Updates(map[string]any{
		"password_reset_token_hash": tokenHash,
		"password_reset_expires_at": expiresAt,
	}).Error; err != nil {
		log.Printf("[password-reset] failed to store token: %v", err)
		return
	}

	resetURL := config.App.SMTP.AppURL + "/reset-password?token=" + rawToken
	msg, err := email.BuildPasswordResetEmail(user.Email, user.Name, resetURL)
	if err != nil {
		log.Printf("[password-reset] failed to build email for user %d: %v", user.ID, err)
		return
	}
	if err := s.mailer.Send(msg); err != nil {
		log.Printf("[password-reset] failed to send email to %s: %v", user.Email, err)
	}
}

func (s *AuthService) ResetPassword(rawToken, newPassword string) error {
	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return apperror.BadRequest("invalid or expired reset link")
	}
	if len(newPassword) < 6 {
		return apperror.BadRequest("password must be at least 6 characters")
	}

	tokenHash := hashResetToken(rawToken)
	var user model.User
	err := s.db.Where("password_reset_token_hash = ? AND password_reset_expires_at > ?", tokenHash, time.Now()).
		First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperror.BadRequest("invalid or expired reset link")
	}
	if err != nil {
		return apperror.Wrap(err, 500, "database error validating reset token")
	}

	hash, err := security.HashPassword(newPassword)
	if err != nil {
		return apperror.Wrap(err, 500, "failed to hash password")
	}

	if err := s.db.Model(&user).Updates(map[string]any{
		"password_hash":             hash,
		"password_reset_token_hash": "",
		"password_reset_expires_at": nil,
	}).Error; err != nil {
		return apperror.Wrap(err, 500, "failed to update password")
	}
	return nil
}

func generateResetToken() (string, error) {
	var buf [32]byte
	if _, err := cryptoRandRead(buf[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf[:]), nil
}

func hashResetToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
