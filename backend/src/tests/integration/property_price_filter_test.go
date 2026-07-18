package integration

import (
	"testing"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func f(v float64) *float64 { return &v }

func seedPriced(t *testing.T, db *gorm.DB, agentID uint, name string, listing model.ListingType, rent, sale *float64) {
	t.Helper()
	p := model.Property{
		ProjectName: name,
		Location:    "Test Location",
		OwnerInfo:   "owner",
		AgentID:     &agentID,
		Listing:     listing,
		Status:      model.StatusAvailable,
		RentPrice:   rent,
		SalePrice:   sale,
	}
	if err := db.Create(&p).Error; err != nil {
		t.Fatalf("seed property %s: %v", name, err)
	}
}

func names(dtos []model.PropertyDto) map[string]bool {
	out := map[string]bool{}
	for _, d := range dtos {
		out[d.ProjectName] = true
	}
	return out
}

func TestPriceFilter_BindsRangeToSelectedListingType(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "price-filter-agent@example.com")

	seedPriced(t, db, agentID, "BothCheapRent", model.ListingBoth, f(25_000), f(8_000_000))
	seedPriced(t, db, agentID, "RentInRange", model.ListingRent, f(7_000_000), nil)
	seedPriced(t, db, agentID, "SellInRange", model.ListingSell, nil, f(6_000_000))

	svc := service.NewPropertyServiceWithDB(db)
	fiveToTen := []service.PriceRange{{Min: f(5_000_000), Max: f(10_000_000)}}

	t.Run("rent search never matches on sale price", func(t *testing.T) {
		got, err := svc.ListProperties(service.PropertyFilter{
			Types:       []string{"rent"},
			PriceRanges: fiveToTen,
		})
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		if names(got)["BothCheapRent"] {
			t.Error("rent search in 5M-10M matched a both-listing on its 8M sale_price; rent_price is 25,000 and out of range")
		}
		if !names(got)["RentInRange"] {
			t.Error("rent search in 5M-10M did not match a rent listing with rent_price 7M")
		}
		if names(got)["SellInRange"] {
			t.Error("rent search matched a sell-only listing")
		}
	})

	t.Run("sell search matches on sale price", func(t *testing.T) {
		got, err := svc.ListProperties(service.PropertyFilter{
			Types:       []string{"sell"},
			PriceRanges: fiveToTen,
		})
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		if !names(got)["BothCheapRent"] {
			t.Error("sell search in 5M-10M did not match a both-listing with sale_price 8M")
		}
		if !names(got)["SellInRange"] {
			t.Error("sell search in 5M-10M did not match a sell listing with sale_price 6M")
		}
		if names(got)["RentInRange"] {
			t.Error("sell search matched a rent-only listing on its rent_price")
		}
	})

	t.Run("untyped search considers either price", func(t *testing.T) {
		got, err := svc.ListProperties(service.PropertyFilter{PriceRanges: fiveToTen})
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		for _, want := range []string{"BothCheapRent", "RentInRange", "SellInRange"} {
			if !names(got)[want] {
				t.Errorf("untyped search in 5M-10M did not match %s", want)
			}
		}
	})

	t.Run("range below every price matches nothing", func(t *testing.T) {
		got, err := svc.ListProperties(service.PropertyFilter{
			PriceRanges: []service.PriceRange{{Min: f(1), Max: f(1_000)}},
		})
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		if len(got) != 0 {
			t.Errorf("expected no matches, got %d", len(got))
		}
	})
}
