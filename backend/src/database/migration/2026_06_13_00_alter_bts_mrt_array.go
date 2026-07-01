package migration

import (
	"gorm.io/gorm"
)

func migrateBtsMrtToArray(db *gorm.DB) error {

	var dataType string
	if err := db.Raw(`
		SELECT data_type
		FROM information_schema.columns
		WHERE table_name = 'properties' AND column_name = 'bts_mrt'
	`).Scan(&dataType).Error; err != nil {
		return err
	}
	if dataType == "" {
		return nil
	}

	if dataType != "ARRAY" {

		if err := db.Exec(`
			UPDATE properties
			SET bts_mrt = COALESCE(
				'{' || (
					SELECT string_agg(btrim(t), ',')
					FROM unnest(string_to_array(COALESCE(bts_mrt::text, ''), ',')) t
					WHERE btrim(t) ~ '^[0-9]+$'
				) || '}',
				'{}'
			)
		`).Error; err != nil {
			return err
		}

		if err := db.Exec(`
			ALTER TABLE properties
			ALTER COLUMN bts_mrt TYPE integer[]
			USING bts_mrt::integer[]
		`).Error; err != nil {
			return err
		}
	}

	return db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_properties_bts_mrt
		ON properties USING GIN (bts_mrt)
	`).Error
}
