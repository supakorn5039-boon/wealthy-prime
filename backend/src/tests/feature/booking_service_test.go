package feature

import (
	"testing"
	"time"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func TestBooking_CreateBookings(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "booking.agent@test.local")
	userID := helpers.SeedUser(t, db, "booking.user@test.local")

	prop := helpers.NewProperty(agentID, "P1", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	dtos, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: time.Now().Add(48 * time.Hour),
		Note:            "test booking",
		FirstName:       "Book", LastName: "User",
		Phone: "0810000004",
	})
	if err != nil {
		t.Fatalf("CreateBookings: %v", err)
	}
	if len(dtos) != 1 {
		t.Fatalf("expected 1 booking, got %d", len(dtos))
	}
	if dtos[0].PropertyID != prop.ID {
		t.Errorf("propertyID: got %d, want %d", dtos[0].PropertyID, prop.ID)
	}
	// The property has an agent assigned, so booking auto-assigns to it.
	if dtos[0].AssignedAgentID == nil || *dtos[0].AssignedAgentID != agentID {
		t.Errorf("expected assigned agent %d, got %v", agentID, dtos[0].AssignedAgentID)
	}
}

func TestBooking_CreateRejectsTooManyProperties(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	userID := helpers.SeedUser(t, db, "spam@test.local")

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	// Cap is maxPropertiesPerRequest = 5; pass 6 to trigger the guard.
	_, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{1, 2, 3, 4, 5, 6},
		AppointmentDate: time.Now().Add(24 * time.Hour),
		FirstName:       "S", LastName: "P",
		Phone: "0810000005",
	})
	if err == nil {
		t.Fatal("expected guard to reject >5 properties in one request")
	}
}

func TestBooking_GetUserBookings_ScopesToCaller(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "scope.agent@test.local")
	me := helpers.SeedUser(t, db, "me@test.local")
	other := helpers.SeedUser(t, db, "other@test.local")

	prop := helpers.NewProperty(agentID, "Scope", model.ListingRent, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})

	// Each user creates one booking against the same property.
	for _, uid := range []uint{me, other} {
		if _, err := svc.CreateBookings(uid, service.CreateBookingsInput{
			PropertyIDs:     []uint{prop.ID},
			AppointmentDate: time.Now().Add(24 * time.Hour),
			FirstName:       "X", LastName: "Y", Phone: "0810000006",
		}); err != nil {
			t.Fatalf("seed booking for %d: %v", uid, err)
		}
	}

	mine, err := svc.GetUserBookings(me)
	if err != nil {
		t.Fatalf("GetUserBookings: %v", err)
	}
	if len(mine) != 1 {
		t.Fatalf("expected scoping to one booking, got %d", len(mine))
	}
	if mine[0].UserID != me {
		t.Errorf("returned booking from another user: %+v", mine[0])
	}
}
