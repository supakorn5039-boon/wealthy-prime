package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimit returns a Gin middleware enforcing a per-key token-bucket limit.
// `keyFn` produces the bucket key (requests with the same key share a
// bucket). `ratePerSec` is the steady-state refill rate, `burst` is the
// bucket capacity. When the bucket is empty the request is rejected with
// HTTP 429.
//
// In-memory and per-process — buckets reset on restart and are not shared
// across instances. Swap for a shared store before scaling horizontally.
func RateLimit(keyFn func(*gin.Context) string, ratePerSec float64, burst int) gin.HandlerFunc {
	l := newLimiter(ratePerSec, float64(burst))
	return func(c *gin.Context) {
		key := keyFn(c)
		if key == "" {
			c.Next()
			return
		}
		if !l.allow(key) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}

// UserKey buckets requests by authenticated user ID. Falls back to client IP
// when no user is in context, so unauthenticated traffic isn't a free pass.
func UserKey(c *gin.Context) string {
	if id := GetUserID(c); id != 0 {
		return "u:" + strconv.FormatUint(uint64(id), 10)
	}
	return "ip:" + c.ClientIP()
}

type bucket struct {
	tokens   float64
	lastSeen time.Time
}

type limiter struct {
	rate    float64
	burst   float64
	mu      sync.Mutex
	buckets map[string]*bucket
}

func newLimiter(rate, burst float64) *limiter {
	l := &limiter{
		rate:    rate,
		burst:   burst,
		buckets: make(map[string]*bucket),
	}
	go l.gc()
	return l
}

func (l *limiter) allow(key string) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()
	b, ok := l.buckets[key]
	if !ok {
		l.buckets[key] = &bucket{tokens: l.burst - 1, lastSeen: now}
		return true
	}
	elapsed := now.Sub(b.lastSeen).Seconds()
	b.tokens = min(l.burst, b.tokens+elapsed*l.rate)
	b.lastSeen = now
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (l *limiter) gc() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for now := range ticker.C {
		l.mu.Lock()
		for k, b := range l.buckets {
			if now.Sub(b.lastSeen) > 10*time.Minute {
				delete(l.buckets, k)
			}
		}
		l.mu.Unlock()
	}
}
