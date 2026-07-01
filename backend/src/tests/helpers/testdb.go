package helpers

import (
	"os"
	"sync"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/wealthy-prime/backend/src/database/migration"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/email"
)

type CaptureSender struct{ Sent []email.Message }

func (c *CaptureSender) Send(m email.Message) error { c.Sent = append(c.Sent, m); return nil }

var (
	migrateOnce sync.Once
	sharedDB    *gorm.DB
	migrateErr  error
)

func TestDB(t *testing.T) (*gorm.DB, func()) {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set — skipping integration test")
	}

	migrateOnce.Do(func() {
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent),
		})
		if err != nil {
			migrateErr = err
			return
		}
		migration.Run(db)
		sharedDB = db
	})
	if migrateErr != nil {
		t.Fatalf("connect test db: %v", migrateErr)
	}

	cleanup := func() { truncateAll(sharedDB) }
	cleanup()
	return sharedDB, cleanup
}

func truncateAll(db *gorm.DB) {
	tables := []string{
		"audit_logs", "reviews", "wishlists", "view_histories",
		"inquiries", "bookings", "property_images", "properties", "users",
	}
	for _, tbl := range tables {
		db.Exec("TRUNCATE TABLE " + tbl + " RESTART IDENTITY CASCADE")
	}
}

func SeedAgent(t *testing.T, db *gorm.DB, email string) uint {
	return seedUser(t, db, email, model.RoleAgent)
}

func SeedUser(t *testing.T, db *gorm.DB, email string) uint {
	return seedUser(t, db, email, model.RoleUser)
}

func seedUser(t *testing.T, db *gorm.DB, email string, role model.UserRole) uint {
	t.Helper()
	u := model.User{
		Name:         "Test " + string(role),
		Email:        email,
		PasswordHash: "x",
		Phone:        "0000000000",
		Role:         role,
		IsApproved:   true,
	}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed user (%s): %v", role, err)
	}
	return u.ID
}

func NewProperty(agentID uint, name string, listing model.ListingType, status model.PropertyStatus) model.Property {
	return model.Property{
		ProjectName: name,
		Location:    "Test Location",
		Price:       1_000_000,
		OwnerInfo:   "owner",
		AgentID:     &agentID,
		Listing:     listing,
		Status:      status,
	}
}
