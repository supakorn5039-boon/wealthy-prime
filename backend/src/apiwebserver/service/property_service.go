package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/pkg/storage"
)

type PropertyService struct {
	db *gorm.DB
}

func NewPropertyService() *PropertyService {
	return &PropertyService{db: database.DB}
}

type PropertyFilter struct {
	Type       string
	Location   string
	Search     string
	MinPrice   string
	MaxPrice   string
	Kind       string  // condo / house / townhouse
	Province   string
	District   string
	BtsMrtIDs  []int32 // station IDs; matched via array overlap (GIN-indexed)
}

type PropertyFields struct {
	Title              string
	ProjectName        string
	Location           string
	Price              float64
	Type               model.PropertyType
	SizeSqm            float64
	OwnerInfo          string
	RentalPeriodMonths *int
	Lat                *float64
	Lng                *float64

	Kind         model.PropertyKind
	Listing      model.ListingType
	Province     string
	District     string
	GoogleMapURL string
	BtsMrt       pq.Int32Array
	Bedrooms     int
	Bathrooms    int
	Floor        int
	MinContract  int
	Pets         model.PetPolicy
	Furniture    model.FurniturePolicy
	AdCaption    string

	OwnerName     string
	OwnerPhone    string
	OwnerLineID   string
	OwnerEmail    string
	OwnerFacebook string
	OwnerWechat   string
	OwnerWhatsapp string
}

type CreatePropertyInput struct {
	PropertyFields
	AgentID *uint
	Images  []*multipart.FileHeader
}

type UpdateStatusInput struct {
	Status             model.PropertyStatus
	SlipFile           *multipart.FileHeader
	RentalPeriodMonths *int
}

type UpdatePropertyInput struct {
	PropertyFields
	NewImages      []*multipart.FileHeader
	DeleteImageIDs []uint
}

// ListProperties returns properties visible to the public (status != pending_approve).
func (s *PropertyService) ListProperties(filter PropertyFilter) ([]model.PropertyDto, error) {
	query := s.db.Model(&model.Property{}).
		Preload("Images").
		Preload("Agent").
		Where("status != ?", model.StatusPendingApprove)

	// The public Hero filter sends ?type=buy or ?type=rent. We translate this
	// to a listing-based query so that properties listed as "both" (rent and
	// sell) appear under both tabs.
	switch filter.Type {
	case "buy":
		query = query.Where("listing IN ?", []string{string(model.ListingSell), string(model.ListingBoth)})
	case "rent":
		query = query.Where("listing IN ?", []string{string(model.ListingRent), string(model.ListingBoth)})
	}
	if filter.Location != "" {
		query = query.Where("location ILIKE ?", "%"+filter.Location+"%")
	}
	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ? OR project_name ILIKE ? OR location ILIKE ?", s, s, s)
	}
	if filter.MinPrice != "" {
		if min, err := strconv.ParseFloat(filter.MinPrice, 64); err == nil {
			query = query.Where("price >= ?", min)
		}
	}
	if filter.MaxPrice != "" {
		if max, err := strconv.ParseFloat(filter.MaxPrice, 64); err == nil {
			query = query.Where("price <= ?", max)
		}
	}
	if filter.Kind != "" {
		query = query.Where("kind = ?", filter.Kind)
	}
	if filter.Province != "" {
		query = query.Where("province = ?", filter.Province)
	}
	if filter.District != "" {
		query = query.Where("district = ?", filter.District)
	}
	if len(filter.BtsMrtIDs) > 0 {
		// Array overlap: properties whose bts_mrt shares any station ID with
		// the filter. GIN index on bts_mrt makes this O(log n).
		query = query.Where("bts_mrt && ?", pq.Int32Array(filter.BtsMrtIDs))
	}

	var properties []model.Property
	if err := query.Find(&properties).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to list properties")
	}

	dtos := make([]model.PropertyDto, len(properties))
	for i, p := range properties {
		dtos[i] = *p.ToDto()
	}
	return dtos, nil
}

// GetProperty returns a single property with images and agent preloaded.
func (s *PropertyService) GetProperty(id uint) (*model.PropertyDto, error) {
	var p model.Property
	err := s.db.Preload("Images").Preload("Agent").First(&p, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error fetching property")
	}
	return p.ToDto(), nil
}

// GetPropertyReviews returns all reviews for a property.
func (s *PropertyService) GetPropertyReviews(propertyID uint) ([]model.ReviewDto, error) {
	var reviews []model.Review
	if err := s.db.Preload("User").Where("property_id = ?", propertyID).Find(&reviews).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch reviews")
	}
	dtos := make([]model.ReviewDto, len(reviews))
	for i, r := range reviews {
		dtos[i] = *r.ToDto()
	}
	return dtos, nil
}

// DuplicateCheck checks if a property with the same project name + owner info exists.
func (s *PropertyService) DuplicateCheck(projectName, ownerInfo string) (bool, error) {
	var count int64
	err := s.db.Model(&model.Property{}).
		Where("project_name = ? AND owner_info = ?", projectName, ownerInfo).
		Count(&count).Error
	if err != nil {
		return false, apperror.Wrap(err, 500, "database error checking duplicate")
	}
	return count > 0, nil
}

// CreateProperty saves a new property and its images to uploads/.
func (s *PropertyService) CreateProperty(input CreatePropertyInput) (*model.PropertyDto, error) {
	// Save images first
	var images []model.PropertyImage
	for _, fh := range input.Images {
		url, err := saveUpload(fh, config.App.Server.UploadDir)
		if err != nil {
			return nil, apperror.Wrap(err, 500, "failed to save image")
		}
		images = append(images, model.PropertyImage{URL: url})
	}

	p := model.Property{
		Title:              input.Title,
		ProjectName:        input.ProjectName,
		Location:           input.Location,
		Price:              input.Price,
		Type:               input.Type,
		SizeSqm:            input.SizeSqm,
		AgentID:            input.AgentID,
		OwnerInfo:          input.OwnerInfo,
		RentalPeriodMonths: input.RentalPeriodMonths,
		Lat:                input.Lat,
		Lng:                input.Lng,
		Status:             model.StatusPendingApprove,
		Images:             images,

		Kind:         input.Kind,
		Listing:      input.Listing,
		Province:     input.Province,
		District:     input.District,
		GoogleMapURL: input.GoogleMapURL,
		BtsMrt:       input.BtsMrt,
		Bedrooms:     input.Bedrooms,
		Bathrooms:    input.Bathrooms,
		Floor:        input.Floor,
		MinContract:  input.MinContract,
		Pets:         input.Pets,
		Furniture:    input.Furniture,
		AdCaption:    input.AdCaption,

		OwnerName:     input.OwnerName,
		OwnerPhone:    input.OwnerPhone,
		OwnerLineID:   input.OwnerLineID,
		OwnerEmail:    input.OwnerEmail,
		OwnerFacebook: input.OwnerFacebook,
		OwnerWechat:   input.OwnerWechat,
		OwnerWhatsapp: input.OwnerWhatsapp,
	}

	if err := s.db.Create(&p).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to create property")
	}

	// Re-fetch with relations
	return s.GetProperty(p.ID)
}

// UpdateStatus allows an agent to update only their own property's status and attach a slip.
func (s *PropertyService) UpdateStatus(propertyID, agentID uint, input UpdateStatusInput) (*model.PropertyDto, error) {
	var p model.Property
	err := s.db.First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	// Agent can only update their own property
	if p.AgentID == nil || *p.AgentID != agentID {
		return nil, apperror.Forbidden("you do not own this property")
	}

	updates := map[string]interface{}{"status": input.Status}

	if input.SlipFile != nil {
		slipURL, err := saveUpload(input.SlipFile, config.App.Server.UploadDir)
		if err != nil {
			return nil, apperror.Wrap(err, 500, "failed to save slip file")
		}
		updates["slip_url"] = slipURL
	}

	if input.RentalPeriodMonths != nil {
		updates["rental_period_months"] = *input.RentalPeriodMonths
	}

	if err := s.db.Model(&p).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update property status")
	}

	return s.GetProperty(propertyID)
}

// UpdateProperty edits a property's core fields. Owning agent or admin only.
// New images are appended. If the property was published (available/reserved),
// status flips back to pending_approve so admin re-reviews the edit.
func (s *PropertyService) UpdateProperty(propertyID, callerID uint, role model.UserRole, input UpdatePropertyInput) (*model.PropertyDto, error) {
	var p model.Property
	err := s.db.First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	if role != model.RoleAdmin {
		if p.AgentID == nil || *p.AgentID != callerID {
			return nil, apperror.Forbidden("you do not own this property")
		}
	}

	// Type is derived from Listing — frontend no longer sends it on edit.
	derivedType := input.Type
	if derivedType == "" {
		switch input.Listing {
		case model.ListingSell:
			derivedType = model.TypeBuy
		case model.ListingRent, model.ListingBoth:
			derivedType = model.TypeRent
		}
	}

	updates := map[string]interface{}{
		"title":          input.Title,
		"project_name":   input.ProjectName,
		"location":       input.Location,
		"price":          input.Price,
		"type":           derivedType,
		"size_sqm":       input.SizeSqm,
		"owner_info":     input.OwnerInfo,
		"kind":           input.Kind,
		"listing":        input.Listing,
		"province":       input.Province,
		"district":       input.District,
		"google_map_url": input.GoogleMapURL,
		"bts_mrt":        input.BtsMrt,
		"bedrooms":       input.Bedrooms,
		"bathrooms":      input.Bathrooms,
		"floor":          input.Floor,
		"min_contract":   input.MinContract,
		"pets":           input.Pets,
		"furniture":      input.Furniture,
		"ad_caption":     input.AdCaption,
		"owner_name":     input.OwnerName,
		"owner_phone":    input.OwnerPhone,
		"owner_line_id":  input.OwnerLineID,
		"owner_email":    input.OwnerEmail,
		"owner_facebook": input.OwnerFacebook,
		"owner_wechat":   input.OwnerWechat,
		"owner_whatsapp": input.OwnerWhatsapp,
	}
	if input.RentalPeriodMonths != nil {
		updates["rental_period_months"] = *input.RentalPeriodMonths
	}
	if input.Lat != nil {
		updates["lat"] = *input.Lat
	}
	if input.Lng != nil {
		updates["lng"] = *input.Lng
	}

	if p.Status == model.StatusAvailable || p.Status == model.StatusReserved {
		updates["status"] = model.StatusPendingApprove
	}

	if err := s.db.Model(&p).Updates(updates).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to update property")
	}

	if len(input.DeleteImageIDs) > 0 {
		if err := s.db.
			Where("property_id = ? AND id IN ?", p.ID, input.DeleteImageIDs).
			Delete(&model.PropertyImage{}).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to delete images")
		}
	}

	for _, fh := range input.NewImages {
		url, err := saveUpload(fh, config.App.Server.UploadDir)
		if err != nil {
			return nil, apperror.Wrap(err, 500, "failed to save image")
		}
		if err := s.db.Create(&model.PropertyImage{PropertyID: p.ID, URL: url}).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to attach image")
		}
	}

	return s.GetProperty(propertyID)
}

// DeleteProperty soft-deletes a property. Owning agent or admin only.
func (s *PropertyService) DeleteProperty(propertyID, callerID uint, role model.UserRole) error {
	var p model.Property
	err := s.db.First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperror.NotFound("property")
	}
	if err != nil {
		return apperror.Wrap(err, 500, "database error")
	}

	if role != model.RoleAdmin {
		if p.AgentID == nil || *p.AgentID != callerID {
			return apperror.Forbidden("you do not own this property")
		}
	}

	if err := s.db.Delete(&p).Error; err != nil {
		return apperror.Wrap(err, 500, "failed to delete property")
	}
	return nil
}

// GetAgentProperties returns all properties for a given agent.
func (s *PropertyService) GetAgentProperties(agentID uint) ([]model.PropertyDto, error) {
	var properties []model.Property
	if err := s.db.Preload("Images").Preload("Agent").
		Where("agent_id = ?", agentID).Find(&properties).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch agent properties")
	}
	dtos := make([]model.PropertyDto, len(properties))
	for i, p := range properties {
		dtos[i] = *p.ToDto()
	}
	return dtos, nil
}

// GetPendingProperties returns all pending_approve properties (admin).
func (s *PropertyService) GetPendingProperties() ([]model.PropertyDto, error) {
	var properties []model.Property
	if err := s.db.Preload("Images").Preload("Agent").
		Where("status = ?", model.StatusPendingApprove).Find(&properties).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch pending properties")
	}
	dtos := make([]model.PropertyDto, len(properties))
	for i, p := range properties {
		dtos[i] = *p.ToDto()
	}
	return dtos, nil
}

// ApproveProperty marks a pending property as available (approve) or deletes it (reject).
func (s *PropertyService) ApproveProperty(propertyID uint, action string) (*model.PropertyDto, error) {
	var p model.Property
	err := s.db.First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	switch action {
	case "approve":
		if err := s.db.Model(&p).Update("status", model.StatusAvailable).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to update property status")
		}
		return s.GetProperty(propertyID)
	case "reject":
		if err := s.db.Delete(&p).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to delete rejected property")
		}
		return nil, nil
	default:
		return nil, apperror.BadRequest("action must be 'approve' or 'reject'")
	}
}

// saveUpload stores a multipart file and returns its URL. When R2 is
// configured, the file goes to Cloudflare R2 and the URL is the public
// r2.dev URL (survives container restarts). Otherwise it falls back to
// local disk — fine for local dev, broken on Render free tier because
// /uploads is wiped on every redeploy.
func saveUpload(fh *multipart.FileHeader, dir string) (string, error) {
	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if ext == "" {
		ext = ".bin"
	}
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".pdf": true}
	if !allowed[ext] {
		ext = ".bin"
	}

	b := make([]byte, 8)
	rand.Read(b)
	filename := fmt.Sprintf("%d_%x%s", time.Now().UnixNano(), b, ext)

	src, err := fh.Open()
	if err != nil {
		return "", fmt.Errorf("open upload: %w", err)
	}
	defer src.Close()

	if config.App.R2.Enabled() {
		url, err := storage.UploadToR2(context.Background(), filename, src, fh.Size, fh.Header.Get("Content-Type"))
		if err != nil {
			return "", err
		}
		return url, nil
	}

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("mkdir %s: %w", dir, err)
	}
	dst := filepath.Join(dir, filename)
	dstFile, err := os.Create(dst)
	if err != nil {
		return "", fmt.Errorf("create file %s: %w", dst, err)
	}
	defer dstFile.Close()

	buf := make([]byte, 32*1024)
	for {
		n, readErr := src.Read(buf)
		if n > 0 {
			if _, writeErr := dstFile.Write(buf[:n]); writeErr != nil {
				return "", fmt.Errorf("write file: %w", writeErr)
			}
		}
		if readErr != nil {
			break
		}
	}

	return "/uploads/" + filename, nil
}
