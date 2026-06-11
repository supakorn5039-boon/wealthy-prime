package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateWishlists(db *gorm.DB) error {
	if err := db.AutoMigrate(&model.Wishlist{}); err != nil {
		return err
	}
	// idx_wishlist_user_property does not filter deleted_at, so legacy
	// soft-deleted rows hold their (user, property) slot and block re-adds.
	// removeWishlist now hard-deletes via .Unscoped(); this purge clears
	// the legacy rows and is a no-op once drained.
	return db.Exec("DELETE FROM wishlists WHERE deleted_at IS NOT NULL").Error
}
