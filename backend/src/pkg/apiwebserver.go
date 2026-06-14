package pkg

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/controller"
	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/config"
)

// MountAPIWebServer attaches all middleware, static routes, and API routes to the engine.
func MountAPIWebServer(r *gin.Engine) {
	// Global middleware
	r.Use(middleware.RequestLogger())
	r.Use(corsMiddleware())
	r.Use(middleware.SecurityHeaders())

	// Health check endpoint
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Render's port-scan probe and external load balancers hit `/` (GET/HEAD)
	// at startup; without a handler they get logged as 404 WARNs. Answer 200.
	rootHandler := func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "wealthy-prime-api"})
	}
	r.GET("/", rootHandler)
	r.HEAD("/", rootHandler)

	// Serve uploaded files from the configured (absolute) upload directory.
	r.Static("/uploads", config.App.Server.UploadDir)

	// API routes
	api := r.Group("/api")
	controller.NewAuthController().RegisterRoutes(api)
	controller.NewPropertyController().RegisterRoutes(api)
	controller.NewReviewController().RegisterRoutes(api)
	controller.NewUserController().RegisterRoutes(api)
	controller.NewAgentController().RegisterRoutes(api)
	controller.NewAdminController().RegisterRoutes(api)
}

func corsMiddleware() gin.HandlerFunc {
	origins := config.App.CORS.AllowedOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:5173", "http://localhost:3000"}
	}

	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Request-ID"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
		AllowOriginFunc: func(origin string) bool {
			for _, o := range origins {
				if strings.EqualFold(o, origin) {
					return true
				}
			}
			return false
		},
	})
}
