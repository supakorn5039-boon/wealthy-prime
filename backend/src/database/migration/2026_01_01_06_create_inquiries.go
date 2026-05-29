package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateInquiries(db *gorm.DB) error {
	return db.AutoMigrate(&model.Inquiry{})
}
