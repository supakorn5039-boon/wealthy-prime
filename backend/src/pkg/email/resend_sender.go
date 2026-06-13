package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/wealthy-prime/backend/src/config"
)

// resendSender posts messages to Resend's HTTPS Send API. Resend's API runs on
// Cloudflare, which has reliable connectivity from Render where Mailjet's
// GCP-hosted endpoint frequently resets connections. Requires a verified
// sending domain in the Resend dashboard (DKIM/SPF records in DNS).
type resendSender struct {
	authHeader string // precomputed "Bearer <apiKey>" — avoid per-send concat
	fromHeader string // precomputed "<Name> <email>" — RFC 5322 From line
	client     *http.Client
}

func newResendSender(apiKey string, smtp config.SMTPConfig) *resendSender {
	fromHeader := smtp.From
	if smtp.FromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", smtp.FromName, smtp.From)
	}
	return &resendSender{
		authHeader: "Bearer " + apiKey,
		fromHeader: fromHeader,
		client:     renderSafeHTTPClient(),
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
		From:    s.fromHeader,
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

	return postWithRetry(s.client, "resend", msg.To, func() (*http.Request, error) {
		req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(raw))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", s.authHeader)
		req.Header.Set("Content-Type", "application/json")
		return req, nil
	})
}
