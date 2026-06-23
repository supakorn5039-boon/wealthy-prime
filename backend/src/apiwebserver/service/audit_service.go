package service

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type AuditService struct {
	db *gorm.DB

	viewOwnerSeen   sync.Map
	viewOwnerBucket string
	viewOwnerMu     sync.Mutex
}

func NewAuditService() *AuditService {
	return &AuditService{db: database.DB}
}

type AuditEntry struct {
	Action     model.AuditAction
	EntityType model.AuditEntityType
	EntityID   *uint
	Summary    string
	Metadata   any
}

type AuditFilter struct {
	ActorRole  model.UserRole
	Action     model.AuditAction
	EntityType model.AuditEntityType
	Search     string
	Limit      int
	Offset     int
}

func (s *AuditService) Log(c *gin.Context, entry AuditEntry) {
	actorID := middleware.GetUserID(c)
	actorRole := middleware.GetRole(c)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	var actorIDPtr *uint
	if actorID != 0 {
		actorIDPtr = &actorID
	}

	metaJSON := ""
	if entry.Metadata != nil {
		if b, err := json.Marshal(entry.Metadata); err == nil {
			metaJSON = string(b)
		} else {
			log.Printf("[audit] marshal metadata failed: %v", err)
		}
	}

	row := model.AuditLog{
		ActorUserID: actorIDPtr,
		ActorRole:   actorRole,
		Action:      entry.Action,
		EntityType:  entry.EntityType,
		EntityID:    entry.EntityID,
		Summary:     entry.Summary,
		Metadata:    metaJSON,
		IP:          ip,
		UserAgent:   ua,
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[audit] write panicked: %v", r)
			}
		}()
		if err := s.db.Create(&row).Error; err != nil {
			log.Printf("[audit] write failed action=%s entity=%s: %v", entry.Action, entry.EntityType, err)
		}
	}()
}

// LogViewOwner records an owner-info view, but at most once per actor+property
// per day to keep the audit table from exploding on routine browsing.
func (s *AuditService) LogViewOwner(c *gin.Context, propertyID uint, summary string) {
	actorID := middleware.GetUserID(c)
	if actorID == 0 {
		return
	}

	today := time.Now().UTC().Format("2006-01-02")
	s.viewOwnerMu.Lock()
	if s.viewOwnerBucket != today {
		s.viewOwnerSeen = sync.Map{}
		s.viewOwnerBucket = today
	}
	s.viewOwnerMu.Unlock()

	key := fmt.Sprintf("%d:%d", actorID, propertyID)
	if _, seen := s.viewOwnerSeen.LoadOrStore(key, struct{}{}); seen {
		return
	}

	s.Log(c, AuditEntry{
		Action:     model.AuditViewOwner,
		EntityType: model.EntityProperty,
		EntityID:   &propertyID,
		Summary:    summary,
	})
}

func (s *AuditService) List(f AuditFilter) ([]model.AuditLogDto, error) {
	q := s.db.Model(&model.AuditLog{})
	if f.ActorRole != "" {
		q = q.Where("actor_role = ?", f.ActorRole)
	}
	if f.Action != "" {
		q = q.Where("action = ?", f.Action)
	}
	if f.EntityType != "" {
		q = q.Where("entity_type = ?", f.EntityType)
	}
	if f.Search != "" {
		like := "%" + f.Search + "%"
		q = q.Where("actor_name ILIKE ? OR summary ILIKE ?", like, like)
	}

	limit := f.Limit
	if limit <= 0 || limit > 500 {
		limit = 100
	}

	var rows []model.AuditLog
	if err := q.Order("created_at DESC").Limit(limit).Offset(f.Offset).Find(&rows).Error; err != nil {
		return nil, err
	}

	if len(rows) > 0 {
		idSet := make(map[uint]struct{}, len(rows))
		for _, r := range rows {
			if r.ActorUserID != nil {
				idSet[*r.ActorUserID] = struct{}{}
			}
		}
		ids := make([]uint, 0, len(idSet))
		for id := range idSet {
			ids = append(ids, id)
		}
		if len(ids) > 0 {
			var users []model.User
			if err := s.db.Select("id, name").Where("id IN ?", ids).Find(&users).Error; err == nil {
				nameByID := make(map[uint]string, len(users))
				for _, u := range users {
					nameByID[u.ID] = u.Name
				}
				for i := range rows {
					if rows[i].ActorUserID != nil {
						rows[i].ActorName = nameByID[*rows[i].ActorUserID]
					}
				}
			}
		}
	}

	out := make([]model.AuditLogDto, len(rows))
	for i := range rows {
		out[i] = *rows[i].ToDto()
	}
	return out, nil
}
