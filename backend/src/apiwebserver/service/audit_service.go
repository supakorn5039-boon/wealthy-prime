package service

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

const auditQueueSize = 1024

type AuditService struct {
	db    *gorm.DB
	queue chan model.AuditLog
}

var (
	auditOnce     sync.Once
	auditInstance *AuditService
)

func NewAuditService() *AuditService {
	auditOnce.Do(func() {
		auditInstance = &AuditService{
			db:    database.DB,
			queue: make(chan model.AuditLog, auditQueueSize),
		}
		go auditInstance.run()
	})
	return auditInstance
}

func NewAuditServiceWithDB(db *gorm.DB) *AuditService {
	return &AuditService{db: db, queue: make(chan model.AuditLog, auditQueueSize)}
}

func (s *AuditService) run() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[audit] worker panicked, restarting: %v", r)
			go s.run()
		}
	}()
	for row := range s.queue {
		if err := s.db.Create(&row).Error; err != nil {
			log.Printf("[audit] write failed action=%s entity=%s: %v", row.Action, row.EntityType, err)
		}
	}
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

	var actorIDPtr *uint
	if actorID != 0 {
		actorIDPtr = &actorID
	}

	metaJSON := "{}"
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
		IP:          c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
	}

	select {
	case s.queue <- row:
	default:
		log.Printf("[audit] queue full (>%d pending), dropping action=%s entity=%s", auditQueueSize, row.Action, row.EntityType)
	}
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
