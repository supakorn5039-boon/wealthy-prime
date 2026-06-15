package seeder

import (
	"log"

	"gorm.io/gorm"
)

// Run executes all seeders in order.
func Run(db *gorm.DB) {
	log.Println("[seeder] running seeders...")
	seedAdmin(db)
	seedDemoAgent(db)
	log.Println("[seeder] all seeders completed")
}
