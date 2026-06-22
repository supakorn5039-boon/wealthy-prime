package migration

import (
	"log"

	"gorm.io/gorm"
)

// Run executes all GORM auto-migrations in order.
func Run(db *gorm.DB) {
	log.Println("[migration] running migrations...")

	if err := migrateUsers(db); err != nil {
		log.Fatalf("[migration] users: %v", err)
	}
	// Must run before migrateProperties: GORM's AutoMigrate would otherwise
	// emit a naive `USING "bts_mrt"::integer[]` cast that fails on legacy
	// varchar rows (empty string / CSV). See 2026_06_13_00_alter_bts_mrt_array.go.
	if err := migrateBtsMrtToArray(db); err != nil {
		log.Fatalf("[migration] bts_mrt → integer[]: %v", err)
	}
	if err := migrateProperties(db); err != nil {
		log.Fatalf("[migration] properties: %v", err)
	}
	// Must run after migrateProperties: AutoMigrate would re-add title as a
	// not-null column on existing databases. Drop it here once the project_name
	// backfill is safe.
	if err := dropPropertyTitle(db); err != nil {
		log.Fatalf("[migration] drop properties.title: %v", err)
	}
	if err := migrateBookings(db); err != nil {
		log.Fatalf("[migration] bookings: %v", err)
	}
	if err := migrateReviews(db); err != nil {
		log.Fatalf("[migration] reviews: %v", err)
	}
	if err := migrateWishlists(db); err != nil {
		log.Fatalf("[migration] wishlists: %v", err)
	}
	if err := migrateBrowseHistory(db); err != nil {
		log.Fatalf("[migration] browse_history: %v", err)
	}
	if err := migrateInquiries(db); err != nil {
		log.Fatalf("[migration] inquiries: %v", err)
	}

	log.Println("[migration] all migrations completed")
}
