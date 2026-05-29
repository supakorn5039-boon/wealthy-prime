package model

import (
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/config"
)

type PropertyStatus string
type PropertyType string

const (
	StatusAvailable      PropertyStatus = "available"
	StatusPendingApprove PropertyStatus = "pending_approve"
	StatusReserved       PropertyStatus = "reserved"
	StatusSold           PropertyStatus = "sold"

	TypeBuy  PropertyType = "buy"
	TypeRent PropertyType = "rent"
)

type Property struct {
	gorm.Model
	Title              string         `gorm:"not null"`
	ProjectName        string         `gorm:"not null"`
	Location           string         `gorm:"not null"`
	Price              float64        `gorm:"not null"`
	Type               PropertyType   `gorm:"type:varchar(10);not null"`
	SizeSqm            float64
	AgentID            *uint
	Agent              *User          `gorm:"foreignKey:AgentID"`
	OwnerInfo          string         `gorm:"not null"`
	RentalPeriodMonths *int
	SlipURL            string
	Lat                *float64
	Lng                *float64
	Status             PropertyStatus `gorm:"type:varchar(20);not null;default:'available'"`
	Images             []PropertyImage `gorm:"foreignKey:PropertyID"`
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
	Title              string             `json:"title"`
	ProjectName        string             `json:"projectName"`
	Location           string             `json:"location"`
	Price              float64            `json:"price"`
	Type               PropertyType       `json:"type"`
	SizeSqm            float64            `json:"sizeSqm"`
	AgentID            *uint              `json:"agentId"`
	AgentName          string             `json:"agentName"`
	OwnerInfo          string             `json:"ownerInfo"`
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
		Title:              p.Title,
		ProjectName:        p.ProjectName,
		Location:           p.Location,
		Price:              p.Price,
		Type:               p.Type,
		SizeSqm:            p.SizeSqm,
		AgentID:            p.AgentID,
		OwnerInfo:          p.OwnerInfo,
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
	}
	for _, img := range p.Images {
		url := absoluteURL(img.URL)
		dto.ImageURLs = append(dto.ImageURLs, url)
		dto.Images = append(dto.Images, PropertyImageDto{ID: img.ID, URL: url})
	}
	return dto
}

// absoluteURL prefixes a relative upload path with the configured public base URL.
// If the path is already absolute (http/https) or empty, it is returned unchanged.
// If no public base URL is configured, the path is returned unchanged (caller-side proxy resolves it).
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
