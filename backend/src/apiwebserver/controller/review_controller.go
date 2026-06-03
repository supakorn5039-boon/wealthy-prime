package controller

import (
	"errors"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type ReviewController struct{}

func NewReviewController() *ReviewController {
	return &ReviewController{}
}

func (ctrl *ReviewController) RegisterRoutes(r *gin.RouterGroup) {
	// Public: resolve a review-link token into property info (no auth needed)
	r.GET("/reviews/token/:token", ctrl.resolveToken)

	// Submission requires login. The token still authorizes which property is
	// being reviewed — never trust a client-supplied property_id.
	reviews := r.Group("/reviews", middleware.Protected())
	reviews.POST("", ctrl.createReview)
}

func (ctrl *ReviewController) resolveToken(c *gin.Context) {
	token := c.Param("token")
	propertyID, _, err := service.ParseReviewToken(token)
	if err != nil {
		errorResponse(c, err)
		return
	}

	var prop model.Property
	if err := database.DB.First(&prop, propertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("property"))
		return
	}

	successResponse(c, gin.H{
		"propertyId":    prop.ID,
		"propertyTitle": prop.Title,
	})
}

type createReviewInput struct {
	Token   string `json:"token"   binding:"required"`
	Rating  int    `json:"rating"  binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

func (ctrl *ReviewController) createReview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var input createReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	// Token is the source of truth for which property is being reviewed —
	// never trust a client-supplied property_id, which would let anyone with
	// a single valid token post reviews on other properties.
	propertyID, _, err := service.ParseReviewToken(input.Token)
	if err != nil {
		errorResponse(c, err)
		return
	}

	var prop model.Property
	if err := database.DB.First(&prop, propertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("property"))
		return
	}

	review := model.Review{
		PropertyID: propertyID,
		UserID:     userID,
		Rating:     input.Rating,
		Comment:    input.Comment,
	}

	if err := database.DB.Create(&review).Error; err != nil {
		errorResponse(c, apperror.Wrap(err, 500, "failed to create review"))
		return
	}

	// Reload with user preloaded for DTO
	database.DB.Preload("User").First(&review, review.ID)

	created(c, review.ToDto())
}
