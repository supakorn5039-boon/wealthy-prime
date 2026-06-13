package email

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"syscall"
	"time"

	"github.com/wealthy-prime/backend/src/config"
)

// mailjetSender posts messages to Mailjet's HTTPS Send API v3.1. Used in
// environments where outbound SMTP is blocked (Render, etc). Mailjet allows
// single-sender verification — no custom domain required. Auth is HTTP Basic
// using API_KEY:API_SECRET.
type mailjetSender struct {
	apiKey    string
	apiSecret string
	fromName  string
	from      string
	client    *http.Client
}

func newMailjetSender(apiKey, apiSecret string, smtp config.SMTPConfig) *mailjetSender {
	// Render's outbound network terminates idle HTTP keep-alive connections,
	// which manifests as "connection reset by peer" on the next request that
	// tries to reuse the connection. Disabling keep-alives forces a fresh
	// TCP+TLS handshake per send — adds ~50 ms but eliminates the reset.
	transport := &http.Transport{
		DisableKeepAlives: true,
		TLSHandshakeTimeout: 10 * time.Second,
	}
	return &mailjetSender{
		apiKey:    apiKey,
		apiSecret: apiSecret,
		fromName:  smtp.FromName,
		from:      smtp.From,
		client:    &http.Client{Timeout: 15 * time.Second, Transport: transport},
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

	// Retry on transient network errors (connection reset, EOF). Render's
	// outbound networking frequently drops connections to Mailjet mid-response.
	// Don't retry on HTTP error responses — those mean Mailjet rejected and a
	// retry would duplicate the email.
	backoffs := []time.Duration{500 * time.Millisecond, 1500 * time.Millisecond, 4 * time.Second}
	var lastErr error
	for attempt := 0; attempt < len(backoffs)+1; attempt++ {
		req, err := http.NewRequest("POST", "https://api.mailjet.com/v3.1/send", bytes.NewReader(raw))
		if err != nil {
			return fmt.Errorf("mailjet build request: %w", err)
		}
		req.SetBasicAuth(s.apiKey, s.apiSecret)
		req.Header.Set("Content-Type", "application/json")

		resp, err := s.client.Do(req)
		if err != nil {
			lastErr = err
			if attempt < len(backoffs) && isTransientNetErr(err) {
				time.Sleep(backoffs[attempt])
				continue
			}
			return fmt.Errorf("mailjet post to %s after %d attempts: %w", msg.To, attempt+1, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 300 {
			respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
			return fmt.Errorf("mailjet %d to %s: %s", resp.StatusCode, msg.To, string(respBody))
		}
		return nil
	}
	return fmt.Errorf("mailjet post to %s after retries: %w", msg.To, lastErr)
}

func isTransientNetErr(err error) bool {
	if errors.Is(err, syscall.ECONNRESET) || errors.Is(err, syscall.EPIPE) || errors.Is(err, io.EOF) {
		return true
	}
	var netErr net.Error
	return errors.As(err, &netErr) && netErr.Timeout()
}
