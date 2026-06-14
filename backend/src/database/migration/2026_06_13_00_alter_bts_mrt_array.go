package migration

import (
	"gorm.io/gorm"
)

// migrateBtsMrtToArray converts properties.bts_mrt from the legacy CSV
// varchar to a native Postgres INTEGER[] and adds a GIN index so future
// "filter properties near station X" queries can use array containment
// (`bts_mrt @> ARRAY[12]`) without a table scan.
//
// The USING clause parses any pre-existing rows: each comma-separated
// numeric token becomes an array element. Empty / NULL / non-numeric rows
// land as an empty array.
func migrateBtsMrtToArray(db *gorm.DB) error {
	// On a fresh database the properties table doesn't exist yet — AutoMigrate
	// will create the column directly as integer[]. Bail out so we don't try
	// to ALTER / CREATE INDEX against a non-existent table.
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
		// Postgres forbids subqueries in ALTER ... USING (SQLSTATE 0A000),
		// so first rewrite each varchar row into a valid integer-array literal
		// ('{}' for NULL/empty/non-numeric, '{5,12}' for CSV), then the ALTER
		// only needs a plain cast.
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
