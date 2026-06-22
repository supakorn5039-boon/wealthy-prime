package migration

import (
	"gorm.io/gorm"
)

// dropPropertyTitle backfills empty project_name from the legacy title column
// then drops title. Title and ProjectName had overlapping meanings; consolidating
// on ProjectName removes the duplicate field per the 2026-06 feedback round.
//
// The backfill only touches rows where project_name is blank — rows that already
// have a distinct project name keep theirs.
func dropPropertyTitle(db *gorm.DB) error {
	var hasColumn bool
	if err := db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_name = 'properties' AND column_name = 'title'
		)
	`).Scan(&hasColumn).Error; err != nil {
		return err
	}
	if !hasColumn {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`
			UPDATE properties
			SET project_name = title
			WHERE COALESCE(project_name, '') = '' AND COALESCE(title, '') <> ''
		`).Error; err != nil {
			return err
		}
		return tx.Exec(`ALTER TABLE properties DROP COLUMN title`).Error
	})
}
