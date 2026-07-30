package seeder

import (
	"errors"
	"log"
	"os"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

type seededAdmin struct {
	Name  string
	Email string
	Phone string
}

var seededAdmins = []seededAdmin{
	{Name: "System Admin", Email: "admin@example.com", Phone: "0811111111"},
	{Name: "Wealthy Prime Admin", Email: "wealthyprime.admin@gmail.com", Phone: "0812222222"},
}

func seedAdmin(db *gorm.DB) {
	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		password = "admin123"
		log.Println("[seeder] WARNING: using default admin password 'admin123'. Set ADMIN_PASSWORD env var in production.")
	}

	for _, a := range seededAdmins {
		var existing model.User
		err := db.Where("email = ?", a.Email).First(&existing).Error
		if err == nil {
			log.Printf("[seeder] admin %s already exists, skipping", a.Email)
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[seeder] failed to look up admin %s: %v", a.Email, err)
			continue
		}

		hash, hashErr := security.HashPassword(password)
		if hashErr != nil {
			log.Printf("[seeder] failed to hash password for %s: %v", a.Email, hashErr)
			continue
		}

		admin := model.User{
			Name:         a.Name,
			Email:        a.Email,
			PasswordHash: hash,
			Phone:        a.Phone,
			Role:         model.RoleAdmin,
			IsApproved:   true,
		}
		if err := db.Create(&admin).Error; err != nil {
			log.Printf("[seeder] failed to create admin %s: %v", a.Email, err)
			continue
		}
		log.Printf("[seeder] admin user created: %s", a.Email)
	}
}
