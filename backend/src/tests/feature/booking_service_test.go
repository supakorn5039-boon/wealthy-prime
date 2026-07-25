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

	if dtos[0].AssignedAgentID == nil || *dtos[0].AssignedAgentID != agentID {
		t.Errorf("expected assigned agent %d, got %v", agentID, dtos[0].AssignedAgentID)
	}
}

func TestBooking_CreateRejectsTooManyProperties(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	userID := helpers.SeedUser(t, db, "spam@test.local")

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})

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

func TestBooking_CreateRejectsTakenSlot(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "slot.agent@test.local")
	first := helpers.SeedUser(t, db, "slot.first@test.local")
	second := helpers.SeedUser(t, db, "slot.second@test.local")

	prop := helpers.NewProperty(agentID, "Slot", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	slot := time.Now().Add(48 * time.Hour)

	if _, err := svc.CreateBookings(first, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: slot,
		FirstName:       "A", LastName: "A", Phone: "0810000007",
	}); err != nil {
		t.Fatalf("first booking should succeed: %v", err)
	}

	if _, err := svc.CreateBookings(second, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: slot,
		FirstName:       "B", LastName: "B", Phone: "0810000008",
	}); err == nil {
		t.Fatal("expected guard to reject a second booking on the same property + slot")
	}
}

func TestBooking_GetBookedSlotsForProperty(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "slots.agent@test.local")
	userID := helpers.SeedUser(t, db, "slots.user@test.local")

	prop := helpers.NewProperty(agentID, "Slots", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	if _, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: time.Now().Add(72 * time.Hour),
		FirstName:       "S", LastName: "S", Phone: "0810000009",
	}); err != nil {
		t.Fatalf("seed booking: %v", err)
	}

	slots, err := svc.GetBookedSlotsForProperty(prop.ID)
	if err != nil {
		t.Fatalf("GetBookedSlotsForProperty: %v", err)
	}
	if len(slots) != 1 {
		t.Fatalf("expected 1 booked slot, got %d", len(slots))
	}
}

func TestAgent_UpdateWorkStatus_BlockedWhenPropertyReserved(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "ws.agent@test.local")
	userID := helpers.SeedUser(t, db, "ws.user@test.local")

	prop := helpers.NewProperty(agentID, "WS", model.ListingSell, model.StatusReserved)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	bookingSvc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	dtos, err := bookingSvc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: time.Now().Add(24 * time.Hour),
		FirstName:       "W", LastName: "S", Phone: "0810000010",
	})
	if err != nil {
		t.Fatalf("seed booking: %v", err)
	}
	bookingID := dtos[0].ID

	agentSvc := service.NewAgentServiceWithDB(db)
	if _, err := agentSvc.UpdateWorkStatus(agentID, bookingID, model.WorkBooked); err == nil {
		t.Fatal("expected work status 'booked' to be blocked on a reserved property")
	}
	if _, err := agentSvc.UpdateWorkStatus(agentID, bookingID, model.WorkClosedDeal); err == nil {
		t.Fatal("expected work status 'closed_deal' to be blocked on a reserved property")
	}
	if _, err := agentSvc.UpdateWorkStatus(agentID, bookingID, model.WorkVisited); err != nil {
		t.Fatalf("work status 'visited' should be allowed on a reserved property: %v", err)
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

	for i, uid := range []uint{me, other} {
		if _, err := svc.CreateBookings(uid, service.CreateBookingsInput{
			PropertyIDs:     []uint{prop.ID},
			AppointmentDate: time.Now().Add(time.Duration(24+i) * time.Hour),
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
