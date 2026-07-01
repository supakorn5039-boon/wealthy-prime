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

func MountAPIWebServer(r *gin.Engine) {

	r.Use(middleware.RequestLogger())
	r.Use(corsMiddleware())
	r.Use(middleware.SecurityHeaders())

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	rootHandler := func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "wealthy-prime-api"})
	}
	r.GET("/", rootHandler)
	r.HEAD("/", rootHandler)

	r.Static("/uploads", config.App.Server.UploadDir)

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
