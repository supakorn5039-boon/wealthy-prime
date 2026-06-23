package feature

import (
	"testing"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

// TestAgentDashboard_Counts locks in the six fields the dashboard depends on:
// total/available/reserved + the sell/rent/both listing-type breakdown the
// pie chart plots. Regressions here render the pie as empty slices, which
// is exactly the bug we just fixed (chart was wired to total vs reserved).
func TestAgentDashboard_Counts(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "dashboard.agent@test.local")

	// 2 sell, 1 rent, 3 both = 6 total; 4 available, 1 reserved, 1 sold.
	props := []model.Property{
		helpers.NewProperty(agentID, "S1", model.ListingSell, model.StatusAvailable),
		helpers.NewProperty(agentID, "S2", model.ListingSell, model.StatusSold),
		helpers.NewProperty(agentID, "R1", model.ListingRent, model.StatusReserved),
		helpers.NewProperty(agentID, "B1", model.ListingBoth, model.StatusAvailable),
		helpers.NewProperty(agentID, "B2", model.ListingBoth, model.StatusAvailable),
		helpers.NewProperty(agentID, "B3", model.ListingBoth, model.StatusAvailable),
	}
	if err := db.Create(&props).Error; err != nil {
		t.Fatalf("seed properties: %v", err)
	}

	got, err := service.NewAgentServiceWithDB(db).GetDashboard(agentID)
	if err != nil {
		t.Fatalf("GetDashboard: %v", err)
	}

	want := service.AgentDashboard{
		TotalProperties:     6,
		AvailableProperties: 4,
		ReservedProperties:  1,
		SellListings:        2,
		RentListings:        1,
		BothListings:        3,
	}
	if *got != want {
		t.Errorf("dashboard:\n got  %+v\n want %+v", *got, want)
	}
}

// TestAgentDashboard_IgnoresOtherAgents proves the counts scope correctly —
// a different agent's properties must not bleed into the result.
func TestAgentDashboard_IgnoresOtherAgents(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	mine := helpers.SeedAgent(t, db, "mine@test.local")
	other := helpers.SeedAgent(t, db, "other@test.local")

	props := []model.Property{
		helpers.NewProperty(mine, "Mine-1", model.ListingSell, model.StatusAvailable),
		helpers.NewProperty(other, "Other-1", model.ListingRent, model.StatusAvailable),
		helpers.NewProperty(other, "Other-2", model.ListingBoth, model.StatusReserved),
	}
	if err := db.Create(&props).Error; err != nil {
		t.Fatalf("seed properties: %v", err)
	}

	got, err := service.NewAgentServiceWithDB(db).GetDashboard(mine)
	if err != nil {
		t.Fatalf("GetDashboard: %v", err)
	}

	if got.TotalProperties != 1 || got.SellListings != 1 || got.RentListings != 0 || got.BothListings != 0 {
		t.Errorf("scoping leaked across agents: %+v", *got)
	}
}
