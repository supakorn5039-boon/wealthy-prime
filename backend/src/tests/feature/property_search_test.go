package feature

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/controller"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func TestImagesArchiveRequiresAgentOrAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api")
	controller.NewPropertyController().RegisterRoutes(api)

	req := httptest.NewRequest(http.MethodGet, "/api/properties/1/images-archive", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("unauthenticated images archive: got %d, want 403 (body=%s)", w.Code, w.Body.String())
	}
}

func TestSuggestProjectNames(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "suggest.agent@test.local")

	props := []model.Property{
		helpers.NewProperty(agentID, "The Tree Ladprao 15", model.ListingRent, model.StatusAvailable),
		helpers.NewProperty(agentID, "The Tree Ladprao 15", model.ListingSell, model.StatusAvailable),
		helpers.NewProperty(agentID, "Life Ladprao", model.ListingRent, model.StatusAvailable),
		helpers.NewProperty(agentID, "Noble Around Sukhumvit", model.ListingRent, model.StatusAvailable),
	}
	props[1].OwnerInfo = "another owner"
	if err := db.Create(&props).Error; err != nil {
		t.Fatalf("seed properties: %v", err)
	}

	svc := service.NewPropertyServiceWithDB(db)

	names, err := svc.SuggestProjectNames("ladprao", 10)
	if err != nil {
		t.Fatalf("SuggestProjectNames: %v", err)
	}
	if len(names) != 2 {
		t.Fatalf("suggest ladprao: got %v, want 2 distinct names", names)
	}

	empty, err := svc.SuggestProjectNames("   ", 10)
	if err != nil {
		t.Fatalf("SuggestProjectNames blank: %v", err)
	}
	if len(empty) != 0 {
		t.Fatalf("suggest blank query: got %v, want empty", empty)
	}
}

func TestListPropertiesPetsFilter(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	agentID := helpers.SeedAgent(t, db, "pets.agent@test.local")

	allowed := helpers.NewProperty(agentID, "Pets OK Condo", model.ListingRent, model.StatusAvailable)
	allowed.Pets = model.PetAllowed
	notAllowed := helpers.NewProperty(agentID, "No Pets Condo", model.ListingRent, model.StatusAvailable)
	notAllowed.Pets = model.PetNotAllowed
	unspecified := helpers.NewProperty(agentID, "Unspecified Condo", model.ListingRent, model.StatusAvailable)

	props := []model.Property{allowed, notAllowed, unspecified}
	if err := db.Create(&props).Error; err != nil {
		t.Fatalf("seed properties: %v", err)
	}

	svc := service.NewPropertyServiceWithDB(db)

	dtos, err := svc.ListProperties(service.PropertyFilter{Pets: []string{string(model.PetAllowed)}})
	if err != nil {
		t.Fatalf("ListProperties pets filter: %v", err)
	}
	if len(dtos) != 1 || dtos[0].ProjectName != "Pets OK Condo" {
		t.Fatalf("pets=allowed filter: got %+v, want only Pets OK Condo", dtos)
	}

	dtos, err = svc.ListProperties(service.PropertyFilter{})
	if err != nil {
		t.Fatalf("ListProperties no filter: %v", err)
	}
	if len(dtos) != 3 {
		t.Fatalf("no pets filter: got %d properties, want 3", len(dtos))
	}
}
