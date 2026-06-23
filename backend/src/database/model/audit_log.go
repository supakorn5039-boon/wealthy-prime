package model

import (
	"time"

	"gorm.io/gorm"
)

type AuditAction string
type AuditEntityType string

const (
	AuditCreate        AuditAction = "create"
	AuditUpdate        AuditAction = "update"
	AuditDelete        AuditAction = "delete"
	AuditApprove       AuditAction = "approve"
	AuditReject        AuditAction = "reject"
	AuditAssign        AuditAction = "assign"
	AuditReassign      AuditAction = "reassign"
	AuditStatusChange  AuditAction = "status_change"
	AuditRoleChange    AuditAction = "role_change"
	AuditLogin         AuditAction = "login"
	AuditPasswordReset AuditAction = "password_reset"
	AuditNoteUpdate    AuditAction = "note_update"
	AuditWorkStatusSet AuditAction = "work_status_set"
	AuditViewOwner     AuditAction = "view_owner"

	EntityProperty AuditEntityType = "property"
	EntityBooking  AuditEntityType = "booking"
	EntityUser     AuditEntityType = "user"
	EntityAgent    AuditEntityType = "agent"
	EntityInquiry  AuditEntityType = "inquiry"
)

type AuditLog struct {
	gorm.Model

	ActorUserID *uint    `gorm:"index"`
	ActorName   string   `gorm:"type:varchar(255)"`
	ActorRole   UserRole `gorm:"type:varchar(20);index"`

	Action     AuditAction     `gorm:"type:varchar(40);not null;index"`
	EntityType AuditEntityType `gorm:"type:varchar(40);not null;index"`
	EntityID   *uint           `gorm:"index"`

	Summary  string `gorm:"type:text"`
	Metadata string `gorm:"type:jsonb"`

	IP        string `gorm:"type:varchar(64)"`
	UserAgent string `gorm:"type:varchar(512)"`
}

type AuditLogDto struct {
	ID          uint            `json:"id"`
	ActorUserID *uint           `json:"actorUserId"`
	ActorName   string          `json:"actorName"`
	ActorRole   UserRole        `json:"actorRole"`
	Action      AuditAction     `json:"action"`
	EntityType  AuditEntityType `json:"entityType"`
	EntityID    *uint           `json:"entityId"`
	Summary     string          `json:"summary"`
	Metadata    string          `json:"metadata"`
	IP          string          `json:"ip"`
	UserAgent   string          `json:"userAgent"`
	CreatedAt   string          `json:"createdAt"`
}

func (a *AuditLog) ToDto() *AuditLogDto {
	return &AuditLogDto{
		ID:          a.ID,
		ActorUserID: a.ActorUserID,
		ActorName:   a.ActorName,
		ActorRole:   a.ActorRole,
		Action:      a.Action,
		EntityType:  a.EntityType,
		EntityID:    a.EntityID,
		Summary:     a.Summary,
		Metadata:    a.Metadata,
		IP:          a.IP,
		UserAgent:   a.UserAgent,
		CreatedAt:   a.CreatedAt.Format(time.RFC3339),
	}
}
