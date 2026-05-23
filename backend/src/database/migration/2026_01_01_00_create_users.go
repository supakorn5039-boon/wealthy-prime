package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateUsers(db *gorm.DB) error {
	return db.AutoMigrate(&model.User{})
}
