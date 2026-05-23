package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateBookings(db *gorm.DB) error {
	return db.AutoMigrate(&model.Booking{})
}
