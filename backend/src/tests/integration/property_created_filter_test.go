package integration

import (
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/timezone"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func seedCreatedAt(t *testing.T, db *gorm.DB, agentID uint, name string, createdAt time.Time) {
	t.Helper()
	sale := 1_000_000.0
	p := model.Property{
		Model:       gorm.Model{CreatedAt: createdAt},
		ProjectName: name,
		Location:    "Test Location",
		OwnerInfo:   "owner",
		AgentID:     &agentID,
		Listing:     model.ListingSell,
		Status:      model.StatusAvailable,
		SalePrice:   &sale,
	}
	if err := db.Create(&p).Error; err != nil {
		t.Fatalf("seed property %s: %v", name, err)
	}
}

func ictDay(y int, m time.Month, d, hour int) time.Time {
	return time.Date(y, m, d, hour, 0, 0, 0, timezone.ICT)
}

func TestCreatedFilter_BoundsAreInclusiveOfWholeDays(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "created.agent@test.local")

	seedCreatedAt(t, db, agentID, "BeforeRange", ictDay(2026, 7, 9, 23))
	seedCreatedAt(t, db, agentID, "FirstDayEarly", ictDay(2026, 7, 10, 0))
	seedCreatedAt(t, db, agentID, "Middle", ictDay(2026, 7, 12, 13))
	seedCreatedAt(t, db, agentID, "LastDayLate", ictDay(2026, 7, 14, 23))
	seedCreatedAt(t, db, agentID, "AfterRange", ictDay(2026, 7, 15, 0))

	svc := service.NewPropertyServiceWithDB(db)

	from := ictDay(2026, 7, 10, 0)
	to := ictDay(2026, 7, 15, 0)

	dtos, err := svc.ListProperties(service.PropertyFilter{
		CreatedFrom: &from,
		CreatedTo:   &to,
	})
	if err != nil {
		t.Fatalf("ListProperties: %v", err)
	}

	got := names(dtos)
	for _, want := range []string{"FirstDayEarly", "Middle", "LastDayLate"} {
		if !got[want] {
			t.Errorf("%s should be inside 10–14 Jul, missing", want)
		}
	}
	for _, unwanted := range []string{"BeforeRange", "AfterRange"} {
		if got[unwanted] {
			t.Errorf("%s is outside 10–14 Jul but was returned", unwanted)
		}
	}
}

func TestCreatedFilter_EachBoundIsOptional(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "created.optional@test.local")

	seedCreatedAt(t, db, agentID, "Old", ictDay(2026, 5, 1, 10))
	seedCreatedAt(t, db, agentID, "New", ictDay(2026, 8, 1, 10))

	svc := service.NewPropertyServiceWithDB(db)

	cutoff := ictDay(2026, 7, 1, 0)

	fromOnly, err := svc.ListProperties(service.PropertyFilter{CreatedFrom: &cutoff})
	if err != nil {
		t.Fatalf("from-only: %v", err)
	}
	if g := names(fromOnly); !g["New"] || g["Old"] {
		t.Errorf("from-only should return New and not Old, got %v", g)
	}

	toOnly, err := svc.ListProperties(service.PropertyFilter{CreatedTo: &cutoff})
	if err != nil {
		t.Fatalf("to-only: %v", err)
	}
	if g := names(toOnly); !g["Old"] || g["New"] {
		t.Errorf("to-only should return Old and not New, got %v", g)
	}

	none, err := svc.ListProperties(service.PropertyFilter{})
	if err != nil {
		t.Fatalf("no bounds: %v", err)
	}
	if len(none) != 2 {
		t.Errorf("no date bounds should return both, got %d", len(none))
	}
}
