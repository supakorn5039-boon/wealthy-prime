package feature

import (
	"testing"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func TestAudit_List_FiltersByActorRole(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	rows := []model.AuditLog{
		{ActorName: "Admin One", ActorRole: model.RoleAdmin, Action: model.AuditCreate, EntityType: model.EntityProperty, Summary: "by admin"},
		{ActorName: "Agent One", ActorRole: model.RoleAgent, Action: model.AuditCreate, EntityType: model.EntityProperty, Summary: "by agent"},
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatalf("seed audit rows: %v", err)
	}

	svc := service.NewAuditServiceWithDB(db)

	gotAdmin, err := svc.List(service.AuditFilter{ActorRole: model.RoleAdmin})
	if err != nil {
		t.Fatalf("List admin: %v", err)
	}
	if len(gotAdmin) != 1 || gotAdmin[0].ActorRole != model.RoleAdmin {
		t.Errorf("admin filter wrong: %+v", gotAdmin)
	}

	gotAgent, err := svc.List(service.AuditFilter{ActorRole: model.RoleAgent})
	if err != nil {
		t.Fatalf("List agent: %v", err)
	}
	if len(gotAgent) != 1 || gotAgent[0].ActorRole != model.RoleAgent {
		t.Errorf("agent filter wrong: %+v", gotAgent)
	}
}

func TestAudit_List_SearchMatchesSummary(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	rows := []model.AuditLog{
		{ActorName: "Alice", ActorRole: model.RoleAdmin, Action: model.AuditUpdate, EntityType: model.EntityUser, Summary: "Approved booking 42"},
		{ActorName: "Bob", ActorRole: model.RoleAdmin, Action: model.AuditUpdate, EntityType: model.EntityUser, Summary: "Cancelled booking 99"},
		{ActorName: "Carol", ActorRole: model.RoleAdmin, Action: model.AuditUpdate, EntityType: model.EntityUser, Summary: "Approved booking 7"},
	}
	if err := db.Create(&rows).Error; err != nil {
		t.Fatalf("seed audit rows: %v", err)
	}

	got, err := service.NewAuditServiceWithDB(db).List(service.AuditFilter{Search: "Approved"})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("expected 2 approved rows, got %d: %+v", len(got), got)
	}
}

func TestAudit_List_DefaultLimitCaps(t *testing.T) {
	db, cleanup := helpers.TestDB(t)
	defer cleanup()

	for range 6 {
		row := model.AuditLog{
			ActorName: "X", ActorRole: model.RoleAdmin,
			Action: model.AuditCreate, EntityType: model.EntityProperty,
			Summary: "row",
		}
		if err := db.Create(&row).Error; err != nil {
			t.Fatalf("seed: %v", err)
		}
	}

	got, err := service.NewAuditServiceWithDB(db).List(service.AuditFilter{Limit: 3})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(got) != 3 {
		t.Errorf("expected Limit=3, got %d", len(got))
	}
}
