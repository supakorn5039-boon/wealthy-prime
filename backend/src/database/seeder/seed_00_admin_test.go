package seeder

import (
	"os"
	"testing"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func admins(t *testing.T, db *gorm.DB) []model.User {
	t.Helper()
	var out []model.User
	if err := db.Where("role = ?", model.RoleAdmin).Order("id").Find(&out).Error; err != nil {
		t.Fatalf("list admins: %v", err)
	}
	return out
}

func TestSeedAdmin_CreatesTheSeededAdminOnAnEmptyDatabase(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	got := admins(t, db)
	if len(got) != 1 {
		t.Fatalf("expected exactly 1 admin, got %d", len(got))
	}
	if got[0].Email != seededAdminEmail {
		t.Errorf("seeded email: got %q, want %q", got[0].Email, seededAdminEmail)
	}
	if !got[0].IsApproved {
		t.Error("seeded admin must be approved or it cannot be used")
	}
	if !security.CheckPassword(got[0].PasswordHash, "seed-test-secret") {
		t.Error("ADMIN_PASSWORD was not used for the seeded admin")
	}
}

func TestSeedAdmin_IsIdempotent(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)
	seedAdmin(db)
	seedAdmin(db)

	if got := admins(t, db); len(got) != 1 {
		t.Fatalf("repeated seeding must not duplicate the admin, got %d", len(got))
	}
}

func TestSeedAdmin_SkipsWhenAnAdminExistsUnderAnyEmail(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	existing := model.User{
		Name:         "Renamed Admin",
		Email:        "someone.else@example.com",
		PasswordHash: "x",
		Phone:        "0800000000",
		Role:         model.RoleAdmin,
		IsApproved:   true,
	}
	if err := db.Create(&existing).Error; err != nil {
		t.Fatalf("seed existing admin: %v", err)
	}

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	got := admins(t, db)
	if len(got) != 1 {
		t.Fatalf("an admin under a different email must still block seeding, got %d admins", len(got))
	}
	if got[0].Email != "someone.else@example.com" {
		t.Errorf("existing admin was replaced: got %q", got[0].Email)
	}
}

func TestSeedAdmin_NonAdminsDoNotBlockSeeding(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	helpers.SeedAgent(t, db, "agent.only@test.local")
	helpers.SeedUser(t, db, "user.only@test.local")

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	if got := admins(t, db); len(got) != 1 {
		t.Fatalf("agents and users must not block admin seeding, got %d admins", len(got))
	}
}

func TestSeedAdmin_FallsBackWhenAdminPasswordUnset(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	os.Unsetenv("ADMIN_PASSWORD")
	seedAdmin(db)

	got := admins(t, db)
	if len(got) != 1 {
		t.Fatalf("expected 1 admin, got %d", len(got))
	}
	if !security.CheckPassword(got[0].PasswordHash, "admin123") {
		t.Error("documented fallback changed; update ROTATE-SECRETS.md and the handover notes")
	}
}
