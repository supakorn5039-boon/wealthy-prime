package model

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/config"
)

type PropertyStatus string
type PropertyType string
type PropertyKind string
type ListingType string
type PetPolicy string
type FurniturePolicy string

const (
	StatusAvailable   PropertyStatus = "available"
	StatusReserved    PropertyStatus = "reserved"
	StatusSold        PropertyStatus = "sold"
	StatusUnavailable PropertyStatus = "unavailable"
	StatusOwnerUpdate PropertyStatus = "owner_update"

	TypeBuy  PropertyType = "buy"
	TypeRent PropertyType = "rent"

	KindCondo      PropertyKind = "condo"
	KindHouse      PropertyKind = "house"
	KindTownhouse  PropertyKind = "townhouse"
	KindLand       PropertyKind = "land"
	KindCommercial PropertyKind = "commercial"

	ListingRent ListingType = "rent"
	ListingSell ListingType = "sell"
	ListingBoth ListingType = "both"

	PetAllowed    PetPolicy = "allowed"
	PetNotAllowed PetPolicy = "not_allowed"

	FurnitureFull    FurniturePolicy = "full"
	FurniturePartial FurniturePolicy = "partial"
	FurnitureNone    FurniturePolicy = "none"
)

type Property struct {
	gorm.Model
	ProjectName        string       `gorm:"not null"`
	Location           string       `gorm:"not null"`
	Price              float64      `gorm:"not null"`
	Type               PropertyType `gorm:"type:varchar(10);not null"`
	SizeSqm            float64
	AgentID            *uint  `gorm:"index"`
	Agent              *User  `gorm:"foreignKey:AgentID"`
	OwnerInfo          string `gorm:"not null"`
	RentalPeriodMonths *int
	SlipURL            string
	Lat                *float64
	Lng                *float64
	Status             PropertyStatus  `gorm:"type:varchar(20);not null;default:'available'"`
	Images             []PropertyImage `gorm:"foreignKey:PropertyID"`

	PropertyCode string       `gorm:"uniqueIndex;type:varchar(10)"`
	Kind         PropertyKind `gorm:"type:varchar(20)"`
	Listing      ListingType  `gorm:"type:varchar(10)"`
	Province     string       `gorm:"index:idx_properties_province_district,priority:1"`
	District     string       `gorm:"index;index:idx_properties_province_district,priority:2"`
	GoogleMapURL string

	BtsMrt      pq.Int32Array `gorm:"type:integer[]"`
	Bedrooms    int
	Bathrooms   int
	Floor       int
	MinContract int
	Pets        PetPolicy       `gorm:"type:varchar(20)"`
	Furniture   FurniturePolicy `gorm:"type:varchar(20)"`
	AdCaption   string          `gorm:"type:text"`

	OwnerName     string
	OwnerPhone    string
	OwnerLineID   string
	OwnerEmail    string
	OwnerFacebook string
	OwnerWechat   string
	OwnerWhatsapp string
}

func (p *Property) BeforeCreate(tx *gorm.DB) error {

	if p.Type == "" && p.Listing != "" {
		switch p.Listing {
		case ListingSell:
			p.Type = TypeBuy
		case ListingRent, ListingBoth:
			p.Type = TypeRent
		}
	}
	if p.PropertyCode != "" {
		return nil
	}
	for range 10 {
		code, err := generatePropertyCode()
		if err != nil {
			return err
		}
		var count int64
		if err := tx.Model(&Property{}).Where("property_code = ?", code).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			p.PropertyCode = code
			return nil
		}
	}
	return fmt.Errorf("could not generate unique property code after retries")
}

func generatePropertyCode() (string, error) {
	var buf [4]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", err
	}

	n := binary.BigEndian.Uint32(buf[:]) % 9_000_000
	return fmt.Sprintf("%07d", 1_000_000+n), nil
}

type PropertyImage struct {
	gorm.Model
	PropertyID uint   `gorm:"not null"`
	URL        string `gorm:"not null"`
}

type PropertyImageDto struct {
	ID  uint   `json:"id"`
	URL string `json:"url"`
}

type PropertyDto struct {
	ID                 uint               `json:"id"`
	PropertyCode       string             `json:"propertyCode"`
	ProjectName        string             `json:"projectName"`
	Location           string             `json:"location"`
	Price              float64            `json:"price"`
	Type               PropertyType       `json:"type"`
	Kind               PropertyKind       `json:"kind"`
	Listing            ListingType        `json:"listing"`
	Province           string             `json:"province"`
	District           string             `json:"district"`
	GoogleMapURL       string             `json:"googleMapUrl"`
	BtsMrt             []int32            `json:"btsMrt"`
	Bedrooms           int                `json:"bedrooms"`
	Bathrooms          int                `json:"bathrooms"`
	Floor              int                `json:"floor"`
	MinContract        int                `json:"minContract"`
	Pets               PetPolicy          `json:"pets"`
	Furniture          FurniturePolicy    `json:"furniture"`
	AdCaption          string             `json:"adCaption"`
	SizeSqm            float64            `json:"sizeSqm"`
	AgentID            *uint              `json:"agentId"`
	AgentName          string             `json:"agentName"`
	AgentCode          string             `json:"agentCode"`
	OwnerInfo          string             `json:"ownerInfo"`
	OwnerName          string             `json:"ownerName"`
	OwnerPhone         string             `json:"ownerPhone"`
	OwnerLineID        string             `json:"ownerLineId"`
	OwnerEmail         string             `json:"ownerEmail"`
	OwnerFacebook      string             `json:"ownerFacebook"`
	OwnerWechat        string             `json:"ownerWechat"`
	OwnerWhatsapp      string             `json:"ownerWhatsapp"`
	RentalPeriodMonths *int               `json:"rentalPeriodMonths"`
	SlipURL            string             `json:"slipUrl"`
	Lat                *float64           `json:"lat"`
	Lng                *float64           `json:"lng"`
	Status             PropertyStatus     `json:"status"`
	ImageURLs          []string           `json:"imageUrls"`
	Images             []PropertyImageDto `json:"images"`
	CreatedAt          string             `json:"createdAt"`
	UpdatedAt          string             `json:"updatedAt"`
}

func (p *Property) ToDto() *PropertyDto {
	dto := &PropertyDto{
		ID:                 p.ID,
		PropertyCode:       p.PropertyCode,
		ProjectName:        p.ProjectName,
		Location:           p.Location,
		Price:              p.Price,
		Type:               p.Type,
		Kind:               p.Kind,
		Listing:            p.Listing,
		Province:           p.Province,
		District:           p.District,
		GoogleMapURL:       p.GoogleMapURL,
		BtsMrt:             []int32(p.BtsMrt),
		Bedrooms:           p.Bedrooms,
		Bathrooms:          p.Bathrooms,
		Floor:              p.Floor,
		MinContract:        p.MinContract,
		Pets:               p.Pets,
		Furniture:          p.Furniture,
		AdCaption:          p.AdCaption,
		SizeSqm:            p.SizeSqm,
		AgentID:            p.AgentID,
		OwnerInfo:          p.OwnerInfo,
		OwnerName:          p.OwnerName,
		OwnerPhone:         p.OwnerPhone,
		OwnerLineID:        p.OwnerLineID,
		OwnerEmail:         p.OwnerEmail,
		OwnerFacebook:      p.OwnerFacebook,
		OwnerWechat:        p.OwnerWechat,
		OwnerWhatsapp:      p.OwnerWhatsapp,
		RentalPeriodMonths: p.RentalPeriodMonths,
		SlipURL:            absoluteURL(p.SlipURL),
		Lat:                p.Lat,
		Lng:                p.Lng,
		Status:             p.Status,
		ImageURLs:          []string{},
		Images:             []PropertyImageDto{},
		CreatedAt:          p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:          p.UpdatedAt.Format(time.RFC3339),
	}
	if p.Agent != nil {
		dto.AgentName = p.Agent.Name
		dto.AgentCode = p.Agent.AgentCode
	}
	for _, img := range p.Images {
		url := absoluteURL(img.URL)
		dto.ImageURLs = append(dto.ImageURLs, url)
		dto.Images = append(dto.Images, PropertyImageDto{ID: img.ID, URL: url})
	}
	return dto
}

type ListingOwnerPreview struct {
	Info     string `json:"info"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	LineID   string `json:"lineId"`
	Facebook string `json:"facebook"`
	Wechat   string `json:"wechat"`
	Whatsapp string `json:"whatsapp"`
}

func NewListingOwnerPreview(p *Property) *ListingOwnerPreview {
	if p == nil {
		return nil
	}
	return &ListingOwnerPreview{
		Info:     p.OwnerInfo,
		Name:     p.OwnerName,
		Phone:    p.OwnerPhone,
		Email:    p.OwnerEmail,
		LineID:   p.OwnerLineID,
		Facebook: p.OwnerFacebook,
		Wechat:   p.OwnerWechat,
		Whatsapp: p.OwnerWhatsapp,
	}
}

func (d *PropertyDto) StripOwnerInfo() {
	d.OwnerInfo = ""
	d.OwnerName = ""
	d.OwnerPhone = ""
	d.OwnerLineID = ""
	d.OwnerEmail = ""
	d.OwnerFacebook = ""
	d.OwnerWechat = ""
	d.OwnerWhatsapp = ""
	d.SlipURL = ""
}

func absoluteURL(p string) string {
	if p == "" {
		return p
	}
	if strings.HasPrefix(p, "http://") || strings.HasPrefix(p, "https://") {
		return p
	}
	base := config.App.Server.PublicBaseURL
	if base == "" {
		return p
	}
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	return base + p
}
