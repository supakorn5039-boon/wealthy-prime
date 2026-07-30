package seeder

import (
	"os"
	"testing"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func adminEmails(t *testing.T, db *gorm.DB) []string {
	t.Helper()
	var out []model.User
	if err := db.Where("role = ?", model.RoleAdmin).Order("email").Find(&out).Error; err != nil {
		t.Fatalf("list admins: %v", err)
	}
	emails := make([]string, len(out))
	for i, u := range out {
		emails[i] = u.Email
	}
	return emails
}

func TestSeedAdmin_CreatesBothAdminsOnAnEmptyDatabase(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	got := adminEmails(t, db)
	if len(got) != len(seededAdmins) {
		t.Fatalf("expected %d admins, got %d (%v)", len(seededAdmins), len(got), got)
	}
	for _, want := range []string{"admin@example.com", "wealthyprime.admin@gmail.com"} {
		found := false
		for _, e := range got {
			if e == want {
				found = true
			}
		}
		if !found {
			t.Errorf("%s was not seeded; got %v", want, got)
		}
	}
}

func TestSeedAdmin_BothUseAdminPassword(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	var users []model.User
	if err := db.Where("role = ?", model.RoleAdmin).Find(&users).Error; err != nil {
		t.Fatalf("list admins: %v", err)
	}
	for _, u := range users {
		if !security.CheckPassword(u.PasswordHash, "seed-test-secret") {
			t.Errorf("%s was not seeded with ADMIN_PASSWORD", u.Email)
		}
		if !u.IsApproved {
			t.Errorf("%s must be approved or it cannot be used", u.Email)
		}
	}
}

func TestSeedAdmin_IsIdempotent(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)
	seedAdmin(db)
	seedAdmin(db)

	if got := adminEmails(t, db); len(got) != len(seededAdmins) {
		t.Fatalf("repeated seeding must not duplicate admins, got %d (%v)", len(got), got)
	}
}

func TestSeedAdmin_FillsOnlyTheMissingOne(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	existing := model.User{
		Name:         "Already Here",
		Email:        "wealthyprime.admin@gmail.com",
		PasswordHash: "untouched",
		Phone:        "0899999999",
		Role:         model.RoleAdmin,
		IsApproved:   true,
	}
	if err := db.Create(&existing).Error; err != nil {
		t.Fatalf("seed existing admin: %v", err)
	}

	t.Setenv("ADMIN_PASSWORD", "seed-test-secret")
	seedAdmin(db)

	if got := adminEmails(t, db); len(got) != 2 {
		t.Fatalf("expected 2 admins, got %d (%v)", len(got), got)
	}

	var after model.User
	if err := db.Where("email = ?", "wealthyprime.admin@gmail.com").First(&after).Error; err != nil {
		t.Fatalf("reload existing admin: %v", err)
	}
	if after.PasswordHash != "untouched" {
		t.Error("seeder overwrote the password of an admin that already existed")
	}
}

func TestSeedAdmin_FallsBackWhenAdminPasswordUnset(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	os.Unsetenv("ADMIN_PASSWORD")
	seedAdmin(db)

	var u model.User
	if err := db.Where("email = ?", "wealthyprime.admin@gmail.com").First(&u).Error; err != nil {
		t.Fatalf("load seeded admin: %v", err)
	}
	if !security.CheckPassword(u.PasswordHash, "admin123") {
		t.Error("documented fallback changed; update ROTATE-SECRETS.md and the handover notes")
	}
}
