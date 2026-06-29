package seeder

import (
	"log"

	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
)

const demoAgentEmail = "agent.demo@example.com"

// seedDemoAgent ensures a demo agent exists to own the demo properties.
// Returns the agent's ID for downstream seeders. Returns 0 on failure.
func seedDemoAgent(db *gorm.DB) uint {
	var existing model.User
	if err := db.Where("email = ?", demoAgentEmail).First(&existing).Error; err == nil {
		backfillDemoAgentSocials(db, &existing)
		return existing.ID
	}

	hash, err := security.HashPassword("agent123")
	if err != nil {
		log.Printf("[seeder] failed to hash demo agent password: %v", err)
		return 0
	}

	agent := model.User{
		Name:         "Demo Agent",
		FirstName:    "Demo",
		LastName:     "Agent",
		Email:        demoAgentEmail,
		PasswordHash: hash,
		Phone:        "0811111111",
		LineID:       "demo.agent",
		Whatsapp:     "+66811111111",
		Wechat:       "demo_agent_wp",
		Facebook:     "https://facebook.com/demo.agent.wpe",
		AgentCode:    "A100001",
		Role:         model.RoleAgent,
		IsApproved:   true,
	}
	if err := db.Create(&agent).Error; err != nil {
		log.Printf("[seeder] failed to create demo agent: %v", err)
		return 0
	}
	log.Printf("[seeder] demo agent created: %s (password: agent123)", demoAgentEmail)
	return agent.ID
}

// backfillDemoAgentSocials fills the four social-handle columns when the demo
// agent predates the appointment-email feature and would otherwise render
// empty contact rows in confirmation emails.
func backfillDemoAgentSocials(db *gorm.DB, u *model.User) {
	updates := map[string]any{}
	if u.LineID == "" {
		updates["line_id"] = "demo.agent"
	}
	if u.Whatsapp == "" {
		updates["whatsapp"] = "+66811111111"
	}
	if u.Wechat == "" {
		updates["wechat"] = "demo_agent_wp"
	}
	if u.Facebook == "" {
		updates["facebook"] = "https://facebook.com/demo.agent.wpe"
	}
	if len(updates) == 0 {
		return
	}
	if err := db.Model(u).Updates(updates).Error; err != nil {
		log.Printf("[seeder] failed to backfill demo agent socials: %v", err)
		return
	}
	log.Printf("[seeder] demo agent socials backfilled (%d fields)", len(updates))
}
