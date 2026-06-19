package database

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/wealthy-prime/backend/src/config"
)

// DB is the global GORM database connection.
var DB *gorm.DB

// Init connects to PostgreSQL and assigns the global DB.
func Init() {
	// Default: Warn (silent for normal queries, shows slow queries + errors).
	// Set GORM_LOG=info to see every SQL query during local debugging.
	logLevel := logger.Warn
	if os.Getenv("GORM_LOG") == "info" {
		logLevel = logger.Info
	}

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	db, err := gorm.Open(postgres.Open(config.App.Database.DSN), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Fatalf("[database] failed to connect: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[database] failed to get sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetMaxIdleConns(20)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	DB = db
	log.Println("[database] connected")
}
