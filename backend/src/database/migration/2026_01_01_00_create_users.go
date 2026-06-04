package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateUsers(db *gorm.DB) error {
	if err := db.Exec(`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE`).Error; err != nil {
		return err
	}
	return db.AutoMigrate(&model.User{})
}
