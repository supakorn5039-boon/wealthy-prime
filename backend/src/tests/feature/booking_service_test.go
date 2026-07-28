package feature

import (
	"testing"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/timezone"
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

func seedBookingsAtCap(t *testing.T, db *gorm.DB, propertyID, ownerID, userID uint, firstSlot time.Time) {
	t.Helper()
	for i := range service.MaxBookingsPerAgentPerDay {
		b := model.Booking{
			UserID:          userID,
			PropertyID:      propertyID,
			AppointmentDate: firstSlot.Add(time.Duration(i) * time.Hour),
			Status:          model.BookingAssigned,
			AssignedAgentID: &ownerID,
			FirstName:       "Load", LastName: "Seed", Phone: "0810000011",
		}
		if err := db.Create(&b).Error; err != nil {
			t.Fatalf("seed booking %d: %v", i, err)
		}
	}
}

func capTestSlot() time.Time {
	day := time.Now().In(timezone.ICT).AddDate(0, 0, 3)
	return time.Date(day.Year(), day.Month(), day.Day(), 9, 0, 0, 0, timezone.ICT)
}

func TestBooking_AdminOwnedPropertyExemptFromDailyCap(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	adminID := helpers.SeedAdmin(t, db, "cap.admin@test.local")
	helpers.SeedAgent(t, db, "cap.spare@test.local")
	userID := helpers.SeedUser(t, db, "cap.user@test.local")

	prop := helpers.NewProperty(adminID, "AdminCap", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	slot := capTestSlot()
	seedBookingsAtCap(t, db, prop.ID, adminID, userID, slot)

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	dtos, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: slot.Add(service.MaxBookingsPerAgentPerDay * time.Hour),
		FirstName:       "Cap", LastName: "User", Phone: "0810000012",
	})
	if err != nil {
		t.Fatalf("CreateBookings: %v", err)
	}
	if dtos[0].AssignedAgentID == nil || *dtos[0].AssignedAgentID != adminID {
		t.Fatalf("admin-owned booking was reassigned away: got %v, want %d", dtos[0].AssignedAgentID, adminID)
	}
}

func TestBooking_AgentAtDailyCapIsReassigned(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	ownerID := helpers.SeedAgent(t, db, "cap.owner@test.local")
	spareID := helpers.SeedAgent(t, db, "cap.backup@test.local")
	userID := helpers.SeedUser(t, db, "cap.booker@test.local")

	prop := helpers.NewProperty(ownerID, "AgentCap", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	slot := capTestSlot()
	seedBookingsAtCap(t, db, prop.ID, ownerID, userID, slot)

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	dtos, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: slot.Add(service.MaxBookingsPerAgentPerDay * time.Hour),
		FirstName:       "Cap", LastName: "Booker", Phone: "0810000013",
	})
	if err != nil {
		t.Fatalf("CreateBookings: %v", err)
	}
	if dtos[0].AssignedAgentID == nil || *dtos[0].AssignedAgentID != spareID {
		t.Fatalf("agent at cap should hand off to the spare agent %d, got %v", spareID, dtos[0].AssignedAgentID)
	}
}

func TestBooking_AgentAtDailyCapCanHandOffToAdmin(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	ownerID := helpers.SeedAgent(t, db, "pool.owner@test.local")
	adminID := helpers.SeedAdmin(t, db, "pool.admin@test.local")
	userID := helpers.SeedUser(t, db, "pool.booker@test.local")

	prop := helpers.NewProperty(ownerID, "PoolAdmin", model.ListingSell, model.StatusAvailable)
	if err := db.Create(&prop).Error; err != nil {
		t.Fatalf("seed property: %v", err)
	}

	slot := capTestSlot()
	seedBookingsAtCap(t, db, prop.ID, ownerID, userID, slot)

	svc := service.NewBookingServiceWithDeps(db, &helpers.CaptureSender{})
	dtos, err := svc.CreateBookings(userID, service.CreateBookingsInput{
		PropertyIDs:     []uint{prop.ID},
		AppointmentDate: slot.Add(service.MaxBookingsPerAgentPerDay * time.Hour),
		FirstName:       "Pool", LastName: "Admin", Phone: "0810000014",
	})
	if err != nil {
		t.Fatalf("CreateBookings: %v", err)
	}
	if dtos[0].AssignedAgentID == nil || *dtos[0].AssignedAgentID != adminID {
		t.Fatalf("admin should be eligible to absorb overflow, got %v want %d", dtos[0].AssignedAgentID, adminID)
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
