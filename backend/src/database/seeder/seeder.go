package seeder

import (
	"log"

	"gorm.io/gorm"
)

func Run(db *gorm.DB) {
	log.Println("[seeder] running seeders...")
	seedAdmin(db)
	log.Println("[seeder] all seeders completed")
}
