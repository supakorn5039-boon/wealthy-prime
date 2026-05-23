package config

import (
	"log"
	"os"
	"strings"

	"gopkg.in/ini.v1"
)

type ServerConfig struct {
	Port          string
	Production    bool
	JWTSecret     string
	ReviewSecret  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	DSN      string
}

type CORSConfig struct {
	AllowedOrigins []string
}

type AppConfig struct {
	Server   ServerConfig
	Database DatabaseConfig
	CORS     CORSConfig
}

var App AppConfig

func Load(path string) {
	cfg, err := ini.LooseLoad(path)
	if err != nil {
		log.Printf("[config] could not load %s, using defaults and env vars: %v", path, err)
		cfg = ini.Empty()
	}

	serverSection := cfg.Section("server")
	App.Server.Port = getVal(serverSection, "port", "8080")
	App.Server.Production = serverSection.Key("production").MustBool(false)
	App.Server.JWTSecret = getVal(serverSection, "jwt_secret", "")
	App.Server.ReviewSecret = getVal(serverSection, "review_secret", "")

	// Override with environment variables
	if v := os.Getenv("JWT_SECRET"); v != "" {
		App.Server.JWTSecret = v
	}
	if v := os.Getenv("REVIEW_SECRET"); v != "" {
		App.Server.ReviewSecret = v
	}
	if v := os.Getenv("PORT"); v != "" {
		App.Server.Port = v
	}

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

	// Override database config with env vars
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

	// Build DSN
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
}

func buildDSN() string {
	return "host=" + App.Database.Host +
		" user=" + App.Database.User +
		" password=" + App.Database.Password +
		" dbname=" + App.Database.Database +
		" port=" + App.Database.Port +
		" sslmode=disable TimeZone=UTC"
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
