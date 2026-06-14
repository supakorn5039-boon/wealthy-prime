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
		if err := db.Exec(`
			ALTER TABLE properties
			ALTER COLUMN bts_mrt TYPE integer[]
			USING (
				CASE
					WHEN bts_mrt IS NULL OR btrim(bts_mrt::text) = '' THEN ARRAY[]::integer[]
					ELSE (
						SELECT COALESCE(array_agg(t::integer), ARRAY[]::integer[])
						FROM unnest(string_to_array(bts_mrt::text, ',')) t
						WHERE btrim(t) ~ '^[0-9]+$'
					)
				END
			)
		`).Error; err != nil {
			return err
		}
	}

	return db.Exec(`
		CREATE INDEX IF NOT EXISTS idx_properties_bts_mrt
		ON properties USING GIN (bts_mrt)
	`).Error
}
