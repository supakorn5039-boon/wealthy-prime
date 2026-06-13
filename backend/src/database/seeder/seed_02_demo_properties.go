package seeder

import (
	"log"

	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
)

// seedDemoProperties inserts demo listings idempotently, keyed by
// ProjectName + OwnerInfo (matches PropertyService.DuplicateCheck logic).
// Each demo has multiple images so the gallery carousel UI exercises.
func seedDemoProperties(db *gorm.DB, agentID uint) {
	if agentID == 0 {
		log.Println("[seeder] skipping demo properties — no demo agent")
		return
	}

	rent12 := 12
	floatPtr := func(f float64) *float64 { return &f }

	demos := []struct {
		title              string
		projectName        string
		location           string
		price              float64
		propType           model.PropertyType
		sizeSqm            float64
		ownerInfo          string
		rentalPeriodMonths *int
		lat                *float64
		lng                *float64
		status             model.PropertyStatus
		imageURLs          []string

		kind          model.PropertyKind
		listing       model.ListingType
		province      string
		district      string
		btsMrt        pq.Int32Array
		bedrooms      int
		bathrooms     int
		floor         int
		minContract   int
		pets          model.PetPolicy
		furniture     model.FurniturePolicy
		adCaption     string
		ownerName     string
		ownerPhone    string
		ownerLineID   string
		ownerEmail    string
		ownerFacebook string
	}{
		{
			title:       "Sky Loft 2BR Penthouse",
			projectName: "Wealthy Heights Sukhumvit",
			location:    "คลองเตย, กรุงเทพมหานคร",
			price:       12500000,
			propType:    model.TypeBuy,
			sizeSqm:     85,
			ownerInfo:   "Khun Somchai · 0820000001 · Line: somchai_h",
			lat:         floatPtr(13.7244),
			lng:         floatPtr(100.5559),
			status:      model.StatusAvailable,
			imageURLs: []string{
				"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
				"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
				"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
				"https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=1200&q=80",
			},
			kind:          model.KindCondo,
			listing:       model.ListingSell,
			province:      "กรุงเทพมหานคร",
			district:      "คลองเตย",
			btsMrt:        pq.Int32Array{12, 34}, // อโศก (BTS), สุขุมวิท (MRT)
			bedrooms:      2,
			bathrooms:     2,
			floor:         28,
			minContract:   12,
			pets:          model.PetNotAllowed,
			furniture:     model.FurnitureFull,
			adCaption:     "ห้องเพดานสูง วิวเมือง ใกล้ BTS",
			ownerName:     "คุณสมชาย",
			ownerPhone:    "0820000001",
			ownerLineID:   "somchai_h",
			ownerEmail:    "somchai@example.com",
			ownerFacebook: "facebook.com/somchai.h",
		},
		{
			title:              "Riverside 1BR Condo",
			projectName:        "Prime Riverside Residence",
			location:           "บางรัก, กรุงเทพมหานคร",
			price:              28000,
			propType:           model.TypeRent,
			sizeSqm:            42,
			ownerInfo:          "Khun Suda · 0820000002 · Line: suda_river",
			rentalPeriodMonths: &rent12,
			lat:                floatPtr(13.7308),
			lng:                floatPtr(100.5238),
			status:             model.StatusAvailable,
			imageURLs: []string{
				"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
				"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
				"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80",
			},
			kind:          model.KindCondo,
			listing:       model.ListingRent,
			province:      "กรุงเทพมหานคร",
			district:      "บางรัก",
			btsMrt:        pq.Int32Array{29}, // สะพานตากสิน (BTS)
			bedrooms:      1,
			bathrooms:     1,
			floor:         15,
			minContract:   12,
			pets:          model.PetAllowed,
			furniture:     model.FurniturePartial,
			adCaption:     "วิวแม่น้ำเจ้าพระยา เหมาะเช่าระยะยาว",
			ownerName:     "คุณสุดา",
			ownerPhone:    "0820000002",
			ownerLineID:   "suda_river",
			ownerEmail:    "suda@example.com",
			ownerFacebook: "facebook.com/suda.river",
		},
		{
			title:       "Asoke Garden 3BR Family Home",
			projectName: "Asoke Garden Villas",
			location:    "วัฒนา, กรุงเทพมหานคร",
			price:       8900000,
			propType:    model.TypeBuy,
			sizeSqm:     120,
			ownerInfo:   "Khun Aroon · 0820000003 · Email: aroon@example.com",
			lat:         floatPtr(13.7437),
			lng:         floatPtr(100.5601),
			status:      model.StatusAvailable,
			imageURLs: []string{
				"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
				"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
				"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
				"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
				"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80",
			},
			kind:          model.KindHouse,
			listing:       model.ListingSell,
			province:      "กรุงเทพมหานคร",
			district:      "วัฒนา",
			btsMrt:        pq.Int32Array{12, 35}, // อโศก (BTS), เพชรบุรี (MRT)
			bedrooms:      3,
			bathrooms:     3,
			floor:         2,
			minContract:   12,
			pets:          model.PetAllowed,
			furniture:     model.FurniturePartial,
			adCaption:     "บ้านเดี่ยวพร้อมสวน ใกล้ห้างและรถไฟฟ้า",
			ownerName:     "คุณอรุณ",
			ownerPhone:    "0820000003",
			ownerLineID:   "aroon_g",
			ownerEmail:    "aroon@example.com",
			ownerFacebook: "facebook.com/aroon.g",
		},
	}

	for _, d := range demos {
		var existing model.Property
		err := db.Where("project_name = ? AND owner_info = ?", d.projectName, d.ownerInfo).
			First(&existing).Error
		if err == nil {
			continue
		}

		p := model.Property{
			Title:              d.title,
			ProjectName:        d.projectName,
			Location:           d.location,
			Price:              d.price,
			Type:               d.propType,
			SizeSqm:            d.sizeSqm,
			AgentID:            &agentID,
			OwnerInfo:          d.ownerInfo,
			RentalPeriodMonths: d.rentalPeriodMonths,
			Lat:                d.lat,
			Lng:                d.lng,
			Status:             d.status,

			Kind:          d.kind,
			Listing:       d.listing,
			Province:      d.province,
			District:      d.district,
			BtsMrt:        d.btsMrt,
			Bedrooms:      d.bedrooms,
			Bathrooms:     d.bathrooms,
			Floor:         d.floor,
			MinContract:   d.minContract,
			Pets:          d.pets,
			Furniture:     d.furniture,
			AdCaption:     d.adCaption,
			OwnerName:     d.ownerName,
			OwnerPhone:    d.ownerPhone,
			OwnerLineID:   d.ownerLineID,
			OwnerEmail:    d.ownerEmail,
			OwnerFacebook: d.ownerFacebook,
		}
		if err := db.Create(&p).Error; err != nil {
			log.Printf("[seeder] failed to create demo property %q: %v", d.title, err)
			continue
		}

		for _, url := range d.imageURLs {
			if err := db.Create(&model.PropertyImage{PropertyID: p.ID, URL: url}).Error; err != nil {
				log.Printf("[seeder] failed to attach image to %q: %v", d.title, err)
			}
		}

		log.Printf("[seeder] demo property created: %s (%d images)", d.title, len(d.imageURLs))
	}
}
