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

// CaptureSender is a test-only email.Sender that records every message
// instead of dispatching it. Tests that exercise auth / booking flows
// pass &CaptureSender{} so they don't touch real SMTP.
type CaptureSender struct{ Sent []email.Message }

func (c *CaptureSender) Send(m email.Message) error { c.Sent = append(c.Sent, m); return nil }

// migrateOnce caches the migrated *gorm.DB so the (expensive) migration
// run only happens once per test process — even when dozens of tests
// call TestDB. Subsequent calls just truncate and hand back the same
// connection.
var (
	migrateOnce sync.Once
	sharedDB    *gorm.DB
	migrateErr  error
)

// TestDB returns a connection to the integration-test database. The caller-
// supplied cleanup function truncates every table after the test so the
// next one starts from a known-empty state. Skips (not fails) the test
// when TEST_DATABASE_URL is unset, so plain `go test ./...` keeps working
// on machines without a test postgres handy.
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

// truncateAll wipes every table the migrations create. RESTART IDENTITY
// rewinds the auto-increment counters so test assertions on IDs stay
// stable across runs.
func truncateAll(db *gorm.DB) {
	tables := []string{
		"audit_logs", "reviews", "wishlists", "view_histories",
		"inquiries", "bookings", "property_images", "properties", "users",
	}
	for _, tbl := range tables {
		db.Exec("TRUNCATE TABLE " + tbl + " RESTART IDENTITY CASCADE")
	}
}

// SeedAgent inserts a single agent user and returns its ID. Convenience for
// tests that need an agent owner without going through bcrypt + auth flow.
func SeedAgent(t *testing.T, db *gorm.DB, email string) uint {
	return seedUser(t, db, email, model.RoleAgent)
}

// SeedUser inserts a regular (non-agent) approved user and returns its ID.
func SeedUser(t *testing.T, db *gorm.DB, email string) uint {
	return seedUser(t, db, email, model.RoleUser)
}

func seedUser(t *testing.T, db *gorm.DB, email string, role model.UserRole) uint {
	t.Helper()
	u := model.User{
		Name:         "Test " + string(role),
		Email:        email,
		PasswordHash: "x", // unused — tests never hit the login path
		Phone:        "0000000000",
		Role:         role,
		IsApproved:   true,
	}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed user (%s): %v", role, err)
	}
	return u.ID
}

// NewProperty builds an in-memory Property fixture with sensible defaults so
// tests only spell out the attributes they care about (listing, status, …).
// Callers pass it to db.Create themselves so they can stitch multiple
// fixtures into one round-trip.
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
