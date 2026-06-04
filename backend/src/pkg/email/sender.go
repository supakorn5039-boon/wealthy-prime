package email

import (
	"log"

	"github.com/wealthy-prime/backend/src/config"
)

// Sender abstracts how an outbound email is delivered.
// The booking flow calls Send asynchronously in a goroutine, so implementations
// must be safe to invoke concurrently and must never block on retries.
type Sender interface {
	Send(msg Message) error
}

type Message struct {
	To       string
	ToName   string
	Bcc      string // optional — blind-carbon-copy a monitoring/test recipient
	Subject  string
	HTMLBody string
	TextBody string
}

// New picks an implementation based on config:
//   - SMTP host configured  → smtpSender (real delivery)
//   - Otherwise             → logSender (prints to stdout, dev fallback)
func New() Sender {
	if config.App.SMTP.Enabled() {
		log.Printf("[email] using SMTP sender (host=%s)", config.App.SMTP.Host)
		return &smtpSender{cfg: config.App.SMTP}
	}
	log.Println("[email] SMTP not configured — using log-only sender (no real emails sent)")
	return &logSender{}
}
