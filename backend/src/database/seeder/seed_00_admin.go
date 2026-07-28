package seeder

import (
	"log"
	"os"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

func seedAdmin(db *gorm.DB) {
	adminEmail := "admin@wealthyprimeestate.com"

	var existing model.User
	result := db.Where("email = ?", adminEmail).First(&existing)
	if result.Error == nil {
		log.Println("[seeder] admin user already exists, skipping")
		return
	}

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
