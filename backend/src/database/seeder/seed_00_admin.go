package seeder

import (
	"log"
	"os"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

const seededAdminEmail = "wealthyprime.admin@gmail.com"

func seedAdmin(db *gorm.DB) {
	var anyAdmin int64
	if err := db.Model(&model.User{}).Where("role = ?", model.RoleAdmin).Count(&anyAdmin).Error; err != nil {
		log.Printf("[seeder] failed to count admins: %v", err)
		return
	}
	if anyAdmin > 0 {
		log.Printf("[seeder] %d admin user(s) already exist, skipping", anyAdmin)
		return
	}

	adminEmail := seededAdminEmail

	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		password = "admin123"
		log.Println("[seeder] WARNING: using default admin password 'admin123'. Set ADMIN_PASSWORD env var in production.")
	}

	hash, err := security.HashPassword(password)
	if err != nil {
		log.Printf("[seeder] failed to hash admin password: %v", err)
		return
	}

	admin := model.User{
		Name:         "Wealthy Prime Admin",
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
