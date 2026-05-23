package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateBrowseHistory(db *gorm.DB) error {
	return db.AutoMigrate(&model.BrowseHistory{})
}
