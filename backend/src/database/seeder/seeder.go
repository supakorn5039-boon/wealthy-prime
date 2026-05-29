package seeder

import (
	"log"

	"gorm.io/gorm"
)

// Run executes all seeders in order.
func Run(db *gorm.DB) {
	log.Println("[seeder] running seeders...")
	seedAdmin(db)
	agentID := seedDemoAgent(db)
	seedDemoProperties(db, agentID)
	log.Println("[seeder] all seeders completed")
}
