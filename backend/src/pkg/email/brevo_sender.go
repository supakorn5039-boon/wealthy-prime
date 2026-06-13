package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/wealthy-prime/backend/src/config"
)

// brevoSender posts messages to Brevo's HTTPS API. Brevo allows single-sender
// verification (no custom domain required), which makes it the right choice
// for PaaS hosts that block SMTP egress (e.g. Render). Verify the From
// address once in the Brevo dashboard, then send freely.
type brevoSender struct {
	apiKey   string
	fromName string
	from     string
	client   *http.Client
}

func newBrevoSender(apiKey string, smtp config.SMTPConfig) *brevoSender {
	return &brevoSender{
		apiKey:   apiKey,
		fromName: smtp.FromName,
		from:     smtp.From,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

type brevoAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type brevoRequest struct {
	Sender      brevoAddress   `json:"sender"`
	To          []brevoAddress `json:"to"`
	Bcc         []brevoAddress `json:"bcc,omitempty"`
	Subject     string         `json:"subject"`
	HTMLContent string         `json:"htmlContent,omitempty"`
	TextContent string         `json:"textContent,omitempty"`
}

func (s *brevoSender) Send(msg Message) error {
	body := brevoRequest{
		Sender:      brevoAddress{Email: s.from, Name: s.fromName},
		To:          []brevoAddress{{Email: msg.To, Name: msg.ToName}},
		Subject:     msg.Subject,
		HTMLContent: msg.HTMLBody,
		TextContent: msg.TextBody,
	}
	if msg.Bcc != "" && msg.Bcc != msg.To {
		body.Bcc = []brevoAddress{{Email: msg.Bcc}}
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("brevo marshal: %w", err)
	}
	req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("brevo build request: %w", err)
	}
	req.Header.Set("api-key", s.apiKey)
	req.Header.Set("accept", "application/json")
	req.Header.Set("content-type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("brevo post to %s: %w", msg.To, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("brevo %d to %s: %s", resp.StatusCode, msg.To, string(respBody))
	}
	return nil
}
