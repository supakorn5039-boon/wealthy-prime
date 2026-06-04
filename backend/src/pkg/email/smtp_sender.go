package email

import (
	"fmt"

	"gopkg.in/gomail.v2"

	"github.com/wealthy-prime/backend/src/config"
)

type smtpSender struct {
	cfg config.SMTPConfig
}

func (s *smtpSender) Send(msg Message) error {
	m := gomail.NewMessage()
	m.SetAddressHeader("From", s.cfg.From, s.cfg.FromName)
	if msg.ToName != "" {
		m.SetAddressHeader("To", msg.To, msg.ToName)
	} else {
		m.SetHeader("To", msg.To)
	}
	if msg.Bcc != "" && msg.Bcc != msg.To {
		m.SetHeader("Bcc", msg.Bcc)
	}
	m.SetHeader("Subject", msg.Subject)
	if msg.TextBody != "" {
		m.SetBody("text/plain", msg.TextBody)
	}
	if msg.HTMLBody != "" {
		if msg.TextBody != "" {
			m.AddAlternative("text/html", msg.HTMLBody)
		} else {
			m.SetBody("text/html", msg.HTMLBody)
		}
	}

	d := gomail.NewDialer(s.cfg.Host, s.cfg.Port, s.cfg.User, s.cfg.Password)
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("smtp send to %s: %w", msg.To, err)
	}
	return nil
}
