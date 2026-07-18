package service

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
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

func NewPropertyServiceWithDB(db *gorm.DB) *PropertyService {
	return &PropertyService{db: db}
}

type PriceRange struct {
	Min *float64
	Max *float64
}

var (
	rentPriceListings = []string{string(model.ListingRent), string(model.ListingBoth)}
	salePriceListings = []string{string(model.ListingSell), string(model.ListingBoth)}
)

func priceRangeCond(column string, listings []string, r PriceRange) (string, []any) {
	cond := "listing IN ? AND " + column
	args := []any{listings}
	switch {
	case r.Min != nil && r.Max != nil:
		cond += " >= ? AND " + column + " <= ?"
		args = append(args, *r.Min, *r.Max)
	case r.Min != nil:
		cond += " >= ?"
		args = append(args, *r.Min)
	case r.Max != nil:
		cond += " <= ?"
		args = append(args, *r.Max)
	default:
		return "", nil
	}
	return "(" + cond + ")", args
}

type PropertyFilter struct {
	Location         string
	Search           string
	SearchStationIDs []int32
	Types            []string
	Kinds            []string
	Provinces        []string
	Districts        []string
	PriceRanges      []PriceRange
	BtsMrtIDs        []int32
	Pets             []string
	MinBedrooms      *int
	Bathrooms        *int
	SizeMin          *float64
	SizeMax          *float64
	FloorMin         *int
	FloorMax         *int

	AgentID     *uint
	Statuses    []string
	ProjectName string
}

type PropertyFields struct {
	ProjectName        string
	Location           string
	RentPrice          *float64
	SalePrice          *float64
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

	OwnerName        string
	OwnerPhone       string
	OwnerLineID      string
	OwnerEmail       string
	OwnerFacebook    string
	OwnerWechat      string
	OwnerWhatsapp    string
	OwnerDocumentURL string
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

func (s *PropertyService) ListProperties(filter PropertyFilter) ([]model.PropertyDto, error) {
	query := s.db.Model(&model.Property{}).
		Preload("Images").
		Preload("Agent")

	var hasSell, hasRent, hasBoth bool
	for _, ty := range filter.Types {
		switch ty {
		case "sell":
			hasSell = true
		case "rent":
			hasRent = true
		case "both":
			hasBoth = true
		}
	}
	if len(filter.Types) > 0 {
		listings := make([]string, 0, 3)
		if hasSell {
			listings = append(listings, string(model.ListingSell))
		}
		if hasRent {
			listings = append(listings, string(model.ListingRent))
		}
		if hasSell || hasRent || hasBoth {
			listings = append(listings, string(model.ListingBoth))
		}
		if len(listings) > 0 {
			query = query.Where("listing IN ?", listings)
		}
	}
	if filter.Location != "" {
		query = query.Where("location ILIKE ?", "%"+filter.Location+"%")
	}
	if filter.Search != "" || len(filter.SearchStationIDs) > 0 {
		var parts []string
		var args []any
		if filter.Search != "" {
			s := "%" + filter.Search + "%"
			parts = append(parts, "project_name ILIKE ?", "location ILIKE ?")
			args = append(args, s, s)
		}
		if len(filter.SearchStationIDs) > 0 {
			parts = append(parts, "bts_mrt && ?")
			args = append(args, pq.Int32Array(filter.SearchStationIDs))
		}
		query = query.Where("("+strings.Join(parts, " OR ")+")", args...)
	}
	if len(filter.PriceRanges) > 0 {
		anyType := len(filter.Types) == 0
		considerRent := anyType || hasRent || hasBoth
		considerSale := anyType || hasSell || hasBoth

		var conds []string
		var args []any
		for _, r := range filter.PriceRanges {
			var parts []string
			if considerRent {
				if cond, a := priceRangeCond("rent_price", rentPriceListings, r); cond != "" {
					parts = append(parts, cond)
					args = append(args, a...)
				}
			}
			if considerSale {
				if cond, a := priceRangeCond("sale_price", salePriceListings, r); cond != "" {
					parts = append(parts, cond)
					args = append(args, a...)
				}
			}
			if len(parts) > 0 {
				conds = append(conds, "("+strings.Join(parts, " OR ")+")")
			}
		}
		if len(conds) > 0 {
			query = query.Where("("+strings.Join(conds, " OR ")+")", args...)
		}
	}
	if len(filter.Kinds) > 0 {
		query = query.Where("kind IN ?", filter.Kinds)
	}
	if len(filter.Pets) > 0 {
		query = query.Where("pets IN ?", filter.Pets)
	}
	if filter.MinBedrooms != nil {
		query = query.Where("bedrooms >= ?", *filter.MinBedrooms)
	}
	if filter.Bathrooms != nil {
		query = query.Where("bathrooms = ?", *filter.Bathrooms)
	}
	if filter.SizeMin != nil {
		query = query.Where("size_sqm >= ?", *filter.SizeMin)
	}
	if filter.SizeMax != nil {
		query = query.Where("size_sqm <= ?", *filter.SizeMax)
	}
	if filter.FloorMin != nil {
		query = query.Where("floor >= ?", *filter.FloorMin)
	}
	if filter.FloorMax != nil {
		query = query.Where("floor <= ?", *filter.FloorMax)
	}
	if len(filter.Provinces) > 0 {
		query = query.Where("province IN ?", filter.Provinces)
	}
	if len(filter.Districts) > 0 {
		query = query.Where("district IN ?", filter.Districts)
	}
	if len(filter.BtsMrtIDs) > 0 {

		query = query.Where("bts_mrt && ?", pq.Int32Array(filter.BtsMrtIDs))
	}
	if filter.AgentID != nil {
		query = query.Where("agent_id = ?", *filter.AgentID)
	}
	if len(filter.Statuses) > 0 {
		query = query.Where("status IN ?", filter.Statuses)
	}
	if filter.ProjectName != "" {
		query = query.Where("project_name ILIKE ?", "%"+filter.ProjectName+"%")
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

func (s *PropertyService) GetListingOwner(propertyID uint) (*model.ListingOwnerPreview, error) {
	var prop model.Property
	err := s.db.First(&prop, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "fetch property")
	}
	return model.NewListingOwnerPreview(&prop), nil
}

func (s *PropertyService) GetPropertyReviews(propertyID uint) ([]model.ReviewDto, error) {
	var reviews []model.Review
	err := s.db.
		Preload("User").
		Preload("RepliedBy").
		Where("property_id = ?", propertyID).
		Order("created_at DESC").
		Find(&reviews).Error
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to fetch reviews")
	}
	dtos := make([]model.ReviewDto, len(reviews))
	for i, r := range reviews {
		dtos[i] = *r.ToDto()
	}
	return dtos, nil
}

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

func (s *PropertyService) SuggestProjectNames(q string, limit int) ([]string, error) {
	names := []string{}
	q = strings.TrimSpace(q)
	if q == "" {
		return names, nil
	}
	if limit <= 0 || limit > 20 {
		limit = 10
	}
	err := s.db.Model(&model.Property{}).
		Distinct("project_name").
		Where("project_name ILIKE ?", "%"+q+"%").
		Order("project_name").
		Limit(limit).
		Pluck("project_name", &names).Error
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to suggest project names")
	}
	return names, nil
}

type ImagesArchive struct {
	Filename string
	Data     []byte
}

func (s *PropertyService) BuildImagesArchive(propertyID uint) (*ImagesArchive, error) {
	var p model.Property
	err := s.db.Preload("Images").First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "failed to load property")
	}
	if len(p.Images) == 0 {
		return nil, apperror.NotFound("property images")
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	added := 0
	for i, img := range p.Images {
		data, err := readImageData(img.URL)
		if err != nil {
			continue
		}
		entry, err := zw.Create(fmt.Sprintf("%02d%s", i+1, imageExt(img.URL)))
		if err != nil {
			continue
		}
		if _, err := entry.Write(data); err != nil {
			continue
		}
		added++
	}
	if err := zw.Close(); err != nil {
		return nil, apperror.Wrap(err, 500, "failed to build images archive")
	}
	if added == 0 {
		return nil, apperror.NotFound("property images")
	}

	name := p.PropertyCode
	if name == "" {
		name = fmt.Sprintf("property-%d", p.ID)
	}
	return &ImagesArchive{Filename: name + "-images.zip", Data: buf.Bytes()}, nil
}

func readImageData(rawURL string) ([]byte, error) {
	if strings.HasPrefix(rawURL, "http://") || strings.HasPrefix(rawURL, "https://") {
		client := &http.Client{Timeout: 30 * time.Second}
		resp, err := client.Get(rawURL)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("unexpected status %d fetching image", resp.StatusCode)
		}
		return io.ReadAll(resp.Body)
	}
	filename := path.Base(rawURL)
	if filename == "" || filename == "." || filename == "/" {
		return nil, fmt.Errorf("invalid image path")
	}
	return os.ReadFile(filepath.Join(config.App.Server.UploadDir, filename))
}

func imageExt(rawURL string) string {
	if ext := strings.ToLower(path.Ext(rawURL)); ext != "" {
		return ext
	}
	return ".jpg"
}

func (s *PropertyService) CreateProperty(input CreatePropertyInput) (*model.PropertyDto, error) {

	var images []model.PropertyImage
	for _, fh := range input.Images {
		url, err := saveUpload(fh, config.App.Server.UploadDir)
		if err != nil {
			return nil, apperror.Wrap(err, 500, "failed to save image")
		}
		images = append(images, model.PropertyImage{URL: url})
	}

	p := model.Property{
		ProjectName:        input.ProjectName,
		Location:           input.Location,
		RentPrice:          input.RentPrice,
		SalePrice:          input.SalePrice,
		Type:               input.Type,
		SizeSqm:            input.SizeSqm,
		AgentID:            input.AgentID,
		OwnerInfo:          input.OwnerInfo,
		RentalPeriodMonths: input.RentalPeriodMonths,
		Lat:                input.Lat,
		Lng:                input.Lng,
		Status:             model.StatusAvailable,
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

		OwnerName:        input.OwnerName,
		OwnerPhone:       input.OwnerPhone,
		OwnerLineID:      input.OwnerLineID,
		OwnerEmail:       input.OwnerEmail,
		OwnerFacebook:    input.OwnerFacebook,
		OwnerWechat:      input.OwnerWechat,
		OwnerWhatsapp:    input.OwnerWhatsapp,
		OwnerDocumentURL: input.OwnerDocumentURL,
	}

	if err := s.db.Create(&p).Error; err != nil {
		return nil, apperror.Wrap(err, 500, "failed to create property")
	}

	return s.GetProperty(p.ID)
}

func (s *PropertyService) UpdateStatus(propertyID, agentID uint, input UpdateStatusInput) (*model.PropertyDto, error) {
	var p model.Property
	err := s.db.First(&p, propertyID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	}
	if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

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
		"project_name":       input.ProjectName,
		"location":           input.Location,
		"rent_price":         input.RentPrice,
		"sale_price":         input.SalePrice,
		"type":               derivedType,
		"size_sqm":           input.SizeSqm,
		"owner_info":         input.OwnerInfo,
		"kind":               input.Kind,
		"listing":            input.Listing,
		"province":           input.Province,
		"district":           input.District,
		"google_map_url":     input.GoogleMapURL,
		"bts_mrt":            input.BtsMrt,
		"bedrooms":           input.Bedrooms,
		"bathrooms":          input.Bathrooms,
		"floor":              input.Floor,
		"min_contract":       input.MinContract,
		"pets":               input.Pets,
		"furniture":          input.Furniture,
		"ad_caption":         input.AdCaption,
		"owner_name":         input.OwnerName,
		"owner_phone":        input.OwnerPhone,
		"owner_line_id":      input.OwnerLineID,
		"owner_email":        input.OwnerEmail,
		"owner_facebook":     input.OwnerFacebook,
		"owner_wechat":       input.OwnerWechat,
		"owner_whatsapp":     input.OwnerWhatsapp,
		"owner_document_url": input.OwnerDocumentURL,
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

func (s *PropertyService) GetAgentProperties(agentID uint, filter PropertyFilter) ([]model.PropertyDto, error) {
	filter.AgentID = &agentID
	return s.ListProperties(filter)
}

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
