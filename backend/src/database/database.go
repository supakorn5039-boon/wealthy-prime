package database

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/wealthy-prime/backend/src/config"
)

// DB is the global GORM database connection.
var DB *gorm.DB

// Init connects to PostgreSQL and assigns the global DB.
func Init() {
	logLevel := logger.Warn
	if !config.App.Server.Production {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(config.App.Database.DSN), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("[database] failed to connect: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[database] failed to get sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	DB = db
	log.Println("[database] connected")
}
