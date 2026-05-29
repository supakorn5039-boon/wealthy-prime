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
	if err := migrateProperties(db); err != nil {
		log.Fatalf("[migration] properties: %v", err)
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
