package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateWishlists(db *gorm.DB) error {
	if err := db.AutoMigrate(&model.Wishlist{}); err != nil {
		return err
	}

	return db.Exec("DELETE FROM wishlists WHERE deleted_at IS NOT NULL").Error
}
