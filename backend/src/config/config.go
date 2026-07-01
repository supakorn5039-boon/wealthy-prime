package config

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/ini.v1"
)

type ServerConfig struct {
	Port          string
	Production    bool
	JWTSecret     string
	ReviewSecret  string
	PublicBaseURL string
	UploadDir     string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	SSLMode  string
	DSN      string
}

type CORSConfig struct {
	AllowedOrigins []string
}

type SMTPConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	From            string
	FromName        string
	AppURL          string
	NotificationBcc string
}

func (s SMTPConfig) Enabled() bool { return s.Host != "" && s.Password != "" }

type R2Config struct {
	AccountID string
	Bucket    string
	AccessKey string
	SecretKey string
	PublicURL string
}

func (r R2Config) Enabled() bool {
	return r.AccountID != "" && r.Bucket != "" && r.AccessKey != "" && r.SecretKey != "" && r.PublicURL != ""
}

type MailjetConfig struct {
	APIKey    string
	APISecret string
}

func (m MailjetConfig) Enabled() bool { return m.APIKey != "" && m.APISecret != "" }

type ResendConfig struct {
	APIKey string
}

func (r ResendConfig) Enabled() bool { return r.APIKey != "" }

type AppConfig struct {
	Server   ServerConfig
	Database DatabaseConfig
	CORS     CORSConfig
	SMTP     SMTPConfig
	Mailjet  MailjetConfig
	Resend   ResendConfig
	R2       R2Config
}

var App AppConfig

func Load(path string) {
	resolved := resolveConfigPath(path)
	cfg, err := ini.LooseLoad(resolved)
	if err != nil {
		log.Printf("[config] could not load %s, using defaults and env vars: %v", resolved, err)
		cfg = ini.Empty()
	}

	serverSection := cfg.Section("server")
	App.Server.Port = getVal(serverSection, "port", "8080")
	App.Server.Production = serverSection.Key("production").MustBool(false)
	App.Server.JWTSecret = getVal(serverSection, "jwt_secret", "")
	App.Server.ReviewSecret = getVal(serverSection, "review_secret", "")
	App.Server.PublicBaseURL = strings.TrimRight(getVal(serverSection, "public_base_url", ""), "/")
	App.Server.UploadDir = resolveUploadDir(resolved, getVal(serverSection, "upload_dir", ""))

	if v := os.Getenv("JWT_SECRET"); v != "" {
		App.Server.JWTSecret = v
	}
	if v := os.Getenv("REVIEW_SECRET"); v != "" {
		App.Server.ReviewSecret = v
	}
	if v := os.Getenv("PORT"); v != "" {
		App.Server.Port = v
	}
	if v := os.Getenv("PUBLIC_BASE_URL"); v != "" {
		App.Server.PublicBaseURL = strings.TrimRight(v, "/")
	}
	if v := os.Getenv("UPLOAD_DIR"); v != "" {
		App.Server.UploadDir = resolveUploadDir(resolved, v)
	}
	log.Printf("[config] upload_dir = %s", App.Server.UploadDir)

	if App.Server.JWTSecret == "" {
		log.Fatal("[config] jwt_secret is required but not set")
	}
	if App.Server.ReviewSecret == "" {
		App.Server.ReviewSecret = App.Server.JWTSecret + "_review"
		log.Printf("[config] review_secret not set, derived from jwt_secret")
	}

	dbSection := cfg.Section("database")
	App.Database.Host = getVal(dbSection, "host", "localhost")
	App.Database.Port = getVal(dbSection, "port", "5432")
	App.Database.User = getVal(dbSection, "user", "postgres")
	App.Database.Password = getVal(dbSection, "password", "postgres")
	App.Database.Database = getVal(dbSection, "database", "wealthy_prime")
	App.Database.SSLMode = getVal(dbSection, "ssl_mode", "disable")

	if v := os.Getenv("DB_HOST"); v != "" {
		App.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		App.Database.Port = v
	}
	if v := os.Getenv("DB_USER"); v != "" {
		App.Database.User = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		App.Database.Password = v
	}
	if v := os.Getenv("DB_NAME"); v != "" {
		App.Database.Database = v
	}
	if v := os.Getenv("DB_SSL_MODE"); v != "" {
		App.Database.SSLMode = v
	}

	App.Database.DSN = buildDSN()
	if v := os.Getenv("DATABASE_URL"); v != "" {
		App.Database.DSN = v
	}

	corsSection := cfg.Section("cors")
	originsStr := getVal(corsSection, "allowed_origins", "http://localhost:5173,http://localhost:3000")
	if v := os.Getenv("CORS_ALLOWED_ORIGINS"); v != "" {
		originsStr = v
	}
	App.CORS.AllowedOrigins = splitAndTrim(originsStr)

	smtpSection := cfg.Section("smtp")
	App.SMTP.Host = getVal(smtpSection, "host", "")
	App.SMTP.Port = smtpSection.Key("port").MustInt(587)
	App.SMTP.User = getVal(smtpSection, "user", "")
	App.SMTP.Password = getVal(smtpSection, "password", "")
	App.SMTP.From = getVal(smtpSection, "from", "no-reply@wealthy-prime.local")
	App.SMTP.FromName = getVal(smtpSection, "from_name", "Wealthy Prime Estate")
	App.SMTP.AppURL = strings.TrimRight(getVal(smtpSection, "app_url", "http://localhost:5173"), "/")
	App.SMTP.NotificationBcc = strings.TrimSpace(getVal(smtpSection, "notification_bcc", ""))

	if v := os.Getenv("SMTP_HOST"); v != "" {
		App.SMTP.Host = v
	}
	if v := os.Getenv("SMTP_USER"); v != "" {
		App.SMTP.User = v
	}
	if v := os.Getenv("SMTP_PASSWORD"); v != "" {
		App.SMTP.Password = v
	}
	if v := os.Getenv("SMTP_FROM"); v != "" {
		App.SMTP.From = v
	}
	if v := os.Getenv("APP_URL"); v != "" {
		App.SMTP.AppURL = strings.TrimRight(v, "/")
	}
	if v := os.Getenv("SMTP_NOTIFICATION_BCC"); v != "" {
		App.SMTP.NotificationBcc = strings.TrimSpace(v)
	}

	App.Mailjet.APIKey = strings.TrimSpace(os.Getenv("MAILJET_API_KEY"))
	App.Mailjet.APISecret = strings.TrimSpace(os.Getenv("MAILJET_API_SECRET"))

	App.Resend.APIKey = strings.TrimSpace(os.Getenv("RESEND_API_KEY"))

	App.R2.AccountID = strings.TrimSpace(os.Getenv("R2_ACCOUNT_ID"))
	App.R2.Bucket = strings.TrimSpace(os.Getenv("R2_BUCKET"))
	App.R2.AccessKey = strings.TrimSpace(os.Getenv("R2_ACCESS_KEY"))
	App.R2.SecretKey = strings.TrimSpace(os.Getenv("R2_SECRET_KEY"))
	App.R2.PublicURL = strings.TrimRight(strings.TrimSpace(os.Getenv("R2_PUBLIC_URL")), "/")
}

func buildDSN() string {
	return "host=" + App.Database.Host +
		" user=" + App.Database.User +
		" password=" + App.Database.Password +
		" dbname=" + App.Database.Database +
		" port=" + App.Database.Port +
		" sslmode=" + App.Database.SSLMode +
		" TimeZone=UTC"
}

func resolveUploadDir(resolvedConfigPath, override string) string {
	anchorDir, err := filepath.Abs(filepath.Dir(resolvedConfigPath))
	if err != nil {
		anchorDir = filepath.Dir(resolvedConfigPath)
	}
	target := override
	if target == "" {
		target = "uploads"
	}
	if !filepath.IsAbs(target) {
		target = filepath.Join(anchorDir, target)
	}
	abs, err := filepath.Abs(target)
	if err != nil {
		return target
	}
	return abs
}

func resolveConfigPath(path string) string {
	if filepath.IsAbs(path) {
		return path
	}
	if _, err := os.Stat(path); err == nil {
		return path
	}
	dir, err := os.Getwd()
	if err != nil {
		return path
	}
	for range 3 {
		dir = filepath.Dir(dir)
		candidate := filepath.Join(dir, path)
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	return path
}

func getVal(section *ini.Section, key, defaultVal string) string {
	v := section.Key(key).String()
	if v == "" {
		return defaultVal
	}
	return v
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}
