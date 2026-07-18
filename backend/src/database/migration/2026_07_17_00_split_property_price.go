package migration

import (
	"gorm.io/gorm"
)

func splitPropertyPrice(db *gorm.DB) error {
	var isNullable string
	if err := db.Raw(`
		SELECT is_nullable FROM information_schema.columns
		WHERE table_name = 'properties' AND column_name = 'price'
	`).Scan(&isNullable).Error; err != nil {
		return err
	}
	if isNullable != "NO" {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(`
			UPDATE properties
			SET rent_price = CASE
					WHEN listing = 'rent' THEN price
					WHEN listing = 'sell' THEN NULL
					WHEN type = 'rent' THEN price
				END,
				sale_price = CASE
					WHEN listing = 'sell' THEN price
					WHEN listing = 'rent' THEN NULL
					WHEN type = 'buy' THEN price
				END
			WHERE rent_price IS NULL AND sale_price IS NULL
		`).Error; err != nil {
			return err
		}
		return tx.Exec(`ALTER TABLE properties ALTER COLUMN price DROP NOT NULL`).Error
	})
}
