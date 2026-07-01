package email

import (
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"syscall"
	"time"
)

func renderSafeHTTPClient() *http.Client {
	return &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			DisableKeepAlives:   true,
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}
}

var retryBackoffs = []time.Duration{500 * time.Millisecond, 1500 * time.Millisecond, 4 * time.Second}

func postWithRetry(client *http.Client, provider, recipient string, buildReq func() (*http.Request, error)) error {
	var lastErr error
	for attempt := 0; attempt < len(retryBackoffs)+1; attempt++ {
		req, err := buildReq()
		if err != nil {
			return fmt.Errorf("%s build request: %w", provider, err)
		}

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			if attempt < len(retryBackoffs) && isTransientNetErr(err) {
				time.Sleep(retryBackoffs[attempt])
				continue
			}
			return fmt.Errorf("%s post to %s after %d attempts: %w", provider, recipient, attempt+1, err)
		}

		if resp.StatusCode >= 300 {
			respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
			resp.Body.Close()
			return fmt.Errorf("%s %d to %s: %s", provider, resp.StatusCode, recipient, string(respBody))
		}
		_, _ = io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
		return nil
	}
	return fmt.Errorf("%s post to %s after retries: %w", provider, recipient, lastErr)
}

func isTransientNetErr(err error) bool {
	if errors.Is(err, syscall.ECONNRESET) || errors.Is(err, syscall.EPIPE) || errors.Is(err, io.EOF) {
		return true
	}
	var netErr net.Error
	return errors.As(err, &netErr) && netErr.Timeout()
}
