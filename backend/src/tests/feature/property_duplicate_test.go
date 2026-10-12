package feature

import (
	"testing"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func TestDuplicateCheck(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "duplicate.agent@test.local")

	existing := helpers.NewProperty(agentID, "Rhythm Sukhumvit", model.ListingRent, model.StatusSold)
	existing.OwnerName = "สมชาย ใจดี"
	existing.Bedrooms = 1
	if err := db.Create(&existing).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	svc := service.NewPropertyServiceWithDB(db)

	rent := 25_000.0
	otherRent := 24_500.0
	sale := 1_000_000.0
	base := service.PropertyFields{
		ProjectName: "Rhythm Sukhumvit",
		OwnerName:   "สมชาย ใจดี",
		RentPrice:   &rent,
		Bedrooms:    1,
	}

	cases := []struct {
		name   string
		mutate func(f *service.PropertyFields)
		want   bool
	}{
		{"exact match", func(f *service.PropertyFields) {}, true},
		{"case and spacing ignored", func(f *service.PropertyFields) {
			f.ProjectName = "  rhythm   SUKHUMVIT "
			f.OwnerName = "สมชาย  ใจดี"
		}, true},
		{"different project", func(f *service.PropertyFields) { f.ProjectName = "Life Asoke" }, false},
		{"different owner", func(f *service.PropertyFields) { f.OwnerName = "สมหญิง" }, false},
		{"different rent price", func(f *service.PropertyFields) { f.RentPrice = &otherRent }, false},
		{"sale price added", func(f *service.PropertyFields) { f.SalePrice = &sale }, false},
		{"rent price missing", func(f *service.PropertyFields) { f.RentPrice = nil }, false},
		{"different bedrooms", func(f *service.PropertyFields) { f.Bedrooms = 2 }, false},
		{"studio vs one bedroom", func(f *service.PropertyFields) { f.Bedrooms = 0; f.IsStudio = true }, false},
		{"empty owner name skips check", func(f *service.PropertyFields) { f.OwnerName = "  " }, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			f := base
			tc.mutate(&f)
			got, err := svc.DuplicateCheck(f)
			if err != nil {
				t.Fatalf("DuplicateCheck: %v", err)
			}
			if got != tc.want {
				t.Fatalf("DuplicateCheck = %v, want %v", got, tc.want)
			}
		})
	}

	if err := db.Delete(&existing).Error; err != nil {
		t.Fatalf("soft delete: %v", err)
	}
	got, err := svc.DuplicateCheck(base)
	if err != nil {
		t.Fatalf("DuplicateCheck after delete: %v", err)
	}
	if got {
		t.Fatal("soft-deleted property should not count as duplicate")
	}
}
