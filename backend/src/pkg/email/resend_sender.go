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

// resendSender posts messages to Resend's HTTPS API. Used in environments
// where outbound SMTP is blocked (Render, Fly, etc.). Resend's HTTPS
// endpoint is reachable from anywhere that allows :443.
type resendSender struct {
	apiKey   string
	from     string // "Name <email@domain>" — fully-formatted From header
	client   *http.Client
}

func newResendSender(apiKey string, smtp config.SMTPConfig) *resendSender {
	return &resendSender{
		apiKey: apiKey,
		from:   formatFrom(smtp.FromName, smtp.From),
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Bcc     []string `json:"bcc,omitempty"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html,omitempty"`
	Text    string   `json:"text,omitempty"`
}

func (s *resendSender) Send(msg Message) error {
	body := resendRequest{
		From:    s.from,
		To:      []string{msg.To},
		Subject: msg.Subject,
		HTML:    msg.HTMLBody,
		Text:    msg.TextBody,
	}
	if msg.Bcc != "" && msg.Bcc != msg.To {
		body.Bcc = []string{msg.Bcc}
	}

	raw, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("resend marshal: %w", err)
	}
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("resend build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("resend post to %s: %w", msg.To, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("resend %d to %s: %s", resp.StatusCode, msg.To, string(respBody))
	}
	return nil
}

// formatFrom renders a "Name <email>" header, or just the email if the
// name is blank. Resend accepts both.
func formatFrom(name, email string) string {
	if name == "" {
		return email
	}
	return fmt.Sprintf("%s <%s>", name, email)
}
