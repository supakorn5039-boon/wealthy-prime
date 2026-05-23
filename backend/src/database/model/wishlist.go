package model

import "gorm.io/gorm"

type Wishlist struct {
	gorm.Model
	UserID     uint     `gorm:"not null;uniqueIndex:idx_wishlist_user_property"`
	PropertyID uint     `gorm:"not null;uniqueIndex:idx_wishlist_user_property"`
	Property   Property `gorm:"foreignKey:PropertyID"`
}
