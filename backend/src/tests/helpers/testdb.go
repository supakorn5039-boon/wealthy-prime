package helpers

import (
	"os"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/wealthy-prime/backend/src/database/migration"
	"github.com/wealthy-prime/backend/src/database/model"
)

// TestDB opens a connection to the integration-test database and runs every
// migration on it. The caller-supplied cleanup function truncates every
// table after the test so the next one starts from a known-empty state.
//
// Skips (not fails) the test when TEST_DATABASE_URL is unset, so plain
// `go test ./...` keeps working on machines without a test postgres handy
// — only `go test -tags integration ./...` runs these.
func TestDB(t *testing.T) (*gorm.DB, func()) {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL not set — skipping integration test")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("connect test db: %v", err)
	}

	migration.Run(db)

	cleanup := func() {
		// Every table the migrations create. RESTART IDENTITY rewinds the
		// auto-increment counters so test assertions on IDs are stable.
		tables := []string{
			"audit_logs", "reviews", "wishlists", "view_histories",
			"inquiries", "bookings", "property_images", "properties", "users",
		}
		for _, tbl := range tables {
			db.Exec("TRUNCATE TABLE " + tbl + " RESTART IDENTITY CASCADE")
		}
	}
	cleanup()
	return db, cleanup
}

// SeedAgent inserts a single agent user and returns its ID. Convenience for
// tests that need an agent owner without going through bcrypt + auth flow.
func SeedAgent(t *testing.T, db *gorm.DB, email string) uint {
	t.Helper()
	u := model.User{
		Name:         "Test Agent",
		Email:        email,
		PasswordHash: "x", // unused — tests never hit the login path
		Phone:        "0000000000",
		Role:         model.RoleAgent,
		IsApproved:   true,
	}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed agent: %v", err)
	}
	return u.ID
}
