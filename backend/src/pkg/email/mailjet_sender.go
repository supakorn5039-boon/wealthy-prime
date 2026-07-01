package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/wealthy-prime/backend/src/config"
)

type mailjetSender struct {
	apiKey    string
	apiSecret string
	fromName  string
	from      string
	client    *http.Client
}

func newMailjetSender(apiKey, apiSecret string, smtp config.SMTPConfig) *mailjetSender {
	return &mailjetSender{
		apiKey:    apiKey,
		apiSecret: apiSecret,
		fromName:  smtp.FromName,
		from:      smtp.From,
		client:    renderSafeHTTPClient(),
	}
}

type mailjetAddress struct {
	Email string `json:"Email"`
	Name  string `json:"Name,omitempty"`
}

type mailjetMessage struct {
	From     mailjetAddress   `json:"From"`
	To       []mailjetAddress `json:"To"`
	Bcc      []mailjetAddress `json:"Bcc,omitempty"`
	Subject  string           `json:"Subject"`
	HTMLPart string           `json:"HTMLPart,omitempty"`
	TextPart string           `json:"TextPart,omitempty"`
}

type mailjetRequest struct {
	Messages []mailjetMessage `json:"Messages"`
}

func (s *mailjetSender) Send(msg Message) error {
	m := mailjetMessage{
		From:     mailjetAddress{Email: s.from, Name: s.fromName},
		To:       []mailjetAddress{{Email: msg.To, Name: msg.ToName}},
		Subject:  msg.Subject,
		HTMLPart: msg.HTMLBody,
		TextPart: msg.TextBody,
	}
	if msg.Bcc != "" && msg.Bcc != msg.To {
		m.Bcc = []mailjetAddress{{Email: msg.Bcc}}
	}

	raw, err := json.Marshal(mailjetRequest{Messages: []mailjetMessage{m}})
	if err != nil {
		return fmt.Errorf("mailjet marshal: %w", err)
	}

	return postWithRetry(s.client, "mailjet", msg.To, func() (*http.Request, error) {
		req, err := http.NewRequest("POST", "https://api.mailjet.com/v3.1/send", bytes.NewReader(raw))
		if err != nil {
			return nil, err
		}
		req.SetBasicAuth(s.apiKey, s.apiSecret)
		req.Header.Set("Content-Type", "application/json")
		return req, nil
	})
}
