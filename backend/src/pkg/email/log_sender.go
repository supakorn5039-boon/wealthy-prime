package email

import (
	"log"
	"strings"
)

// logSender is the dev fallback when SMTP is not configured.
// It prints a readable summary of the email to stdout so devs can verify
// the trigger fired without setting up a real SMTP account.
type logSender struct{}

func (l *logSender) Send(msg Message) error {
	body := msg.TextBody
	if body == "" {
		body = msg.HTMLBody
	}
	bcc := ""
	if msg.Bcc != "" {
		bcc = "\nBcc:     " + msg.Bcc
	}
	log.Printf(
		"\n[email:log] === would send ===\n"+
			"To:      %s <%s>%s\n"+
			"Subject: %s\n"+
			"---\n%s\n=================\n",
		msg.ToName, msg.To, bcc, msg.Subject, strings.TrimSpace(body),
	)
	return nil
}
