package email

import (
	"log"

	"github.com/wealthy-prime/backend/src/config"
)

type Sender interface {
	Send(msg Message) error
}

type Message struct {
	To       string
	ToName   string
	Bcc      string
	Subject  string
	HTMLBody string
	TextBody string
}

func New() Sender {
	if config.App.Resend.Enabled() {
		log.Println("[email] using Resend sender (HTTPS)")
		return newResendSender(config.App.Resend.APIKey, config.App.SMTP)
	}
	if config.App.Mailjet.Enabled() {
		log.Println("[email] using Mailjet sender (HTTPS)")
		return newMailjetSender(config.App.Mailjet.APIKey, config.App.Mailjet.APISecret, config.App.SMTP)
	}
	if config.App.SMTP.Enabled() {
		log.Printf("[email] using SMTP sender (host=%s)", config.App.SMTP.Host)
		return &smtpSender{cfg: config.App.SMTP}
	}
	log.Println("[email] no sender configured — using log-only sender (no real emails sent)")
	return &logSender{}
}
