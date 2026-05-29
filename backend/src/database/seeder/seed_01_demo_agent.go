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
		return existing.ID
	}

	hash, err := security.HashPassword("agent123")
	if err != nil {
		log.Printf("[seeder] failed to hash demo agent password: %v", err)
		return 0
	}

	agent := model.User{
		Name:         "Demo Agent",
		Email:        demoAgentEmail,
		PasswordHash: hash,
		Phone:        "0811111111",
		Role:         model.RoleAgent,
	}
	if err := db.Create(&agent).Error; err != nil {
		log.Printf("[seeder] failed to create demo agent: %v", err)
		return 0
	}
	log.Printf("[seeder] demo agent created: %s (password: agent123)", demoAgentEmail)
	return agent.ID
}
