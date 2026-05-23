package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/migration"
	"github.com/wealthy-prime/backend/src/database/seeder"
	"github.com/wealthy-prime/backend/src/pkg"
	"github.com/wealthy-prime/backend/src/security"
)

func main() {
	// Load configuration from config.ini, then override with environment variables
	configPath := "config.ini"
	if v := os.Getenv("CONFIG_PATH"); v != "" {
		configPath = v
	}
	config.Load(configPath)

	// Init security (JWT key)
	security.InitJWT()

	// Connect to database
	database.Init()

	// Handle CLI sub-commands
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "seed":
			migration.Run(database.DB)
			seeder.Run(database.DB)
			log.Println("seed completed")
			return
		case "migrate":
			migration.Run(database.DB)
			log.Println("migration completed")
			return
		case "migrate:status":
			log.Println("using GORM AutoMigrate — no migration status tracking")
			return
		default:
			log.Fatalf("unknown command: %s", os.Args[1])
		}
	}

	// Run migrations and seed on every startup
	migration.Run(database.DB)
	seeder.Run(database.DB)

	// Set Gin mode
	if config.App.Server.Production {
		gin.SetMode(gin.ReleaseMode)
	}

	// Setup router
	r := gin.New()
	r.Use(gin.Recovery())
	pkg.MountAPIWebServer(r)

	port := config.App.Server.Port
	addr := fmt.Sprintf(":%s", port)

	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in goroutine for graceful shutdown
	go func() {
		slog.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("server forced to shutdown: %v", err)
	}

	slog.Info("server exited")
}
