package migration

import (
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

func migrateAuditLogs(db *gorm.DB) error {
	if err := db.AutoMigrate(&model.AuditLog{}); err != nil {
		return err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	stmts := []string{
		`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at_desc ON audit_logs (created_at DESC)`,
		`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_role_created ON audit_logs (actor_role, created_at DESC)`,
		`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_created ON audit_logs (entity_type, entity_id, created_at DESC)`,
	}
	for _, s := range stmts {
		if _, err := sqlDB.Exec(s); err != nil {
			return err
		}
	}
	return nil
}
