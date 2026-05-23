package model

import "gorm.io/gorm"

type BrowseHistory struct {
	gorm.Model
	UserID     uint     `gorm:"not null;uniqueIndex:idx_history_user_property"`
	PropertyID uint     `gorm:"not null;uniqueIndex:idx_history_user_property"`
	Property   Property `gorm:"foreignKey:PropertyID"`
}
