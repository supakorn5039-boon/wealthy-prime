package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateAuditLogs(db *gorm.DB) error {
	if err := db.AutoMigrate(&model.AuditLog{}); err != nil {
		return err
	}
	// Composite indexes for the dominant query shape:
	// `ORDER BY created_at DESC` + filter on role / entity. GORM tags can't
	// express DESC ordering, so use raw DDL. IF NOT EXISTS keeps it idempotent.
	stmts := []string{
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs (created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_role_created ON audit_logs (actor_role, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created ON audit_logs (entity_type, entity_id, created_at DESC)`,
	}
	for _, s := range stmts {
		if err := db.Exec(s).Error; err != nil {
			return err
		}
	}
	return nil
}
