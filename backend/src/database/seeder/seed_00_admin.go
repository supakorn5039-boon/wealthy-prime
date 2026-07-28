package seeder

import (
	"log"
	"os"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

const (
	defaultAdminEmail        = "admin@wealthyprimeestate.com"
	developmentAdminPassword = "admin123"
)

func seedAdmin(db *gorm.DB) {
	var adminCount int64
	if err := db.Model(&model.User{}).Where("role = ?", model.RoleAdmin).Count(&adminCount).Error; err != nil {
		log.Printf("[seeder] failed to count admin users: %v", err)
		return
	}
	if adminCount > 0 {
		log.Println("[seeder] admin user already exists, skipping")
		return
	}

	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = defaultAdminEmail
	}

	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		if config.App.Server.Production {
			log.Printf("[seeder] refusing to create admin %s without ADMIN_PASSWORD set", adminEmail)
			return
		}
		password = developmentAdminPassword
		log.Println("[seeder] WARNING: using development admin password. Set ADMIN_PASSWORD to override.")
	}

	hash, err := security.HashPassword(password)
	if err != nil {
		log.Printf("[seeder] failed to hash admin password: %v", err)
		return
	}

	admin := model.User{
		Name:         "System Admin",
		Email:        adminEmail,
		PasswordHash: hash,
		Phone:        "0811111111",
		Role:         model.RoleAdmin,
		IsApproved:   true,
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("[seeder] failed to create admin user: %v", err)
		return
	}

	log.Printf("[seeder] admin user created: %s", adminEmail)
}
