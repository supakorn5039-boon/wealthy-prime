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

	// Authenticated users can submit reviews
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
	PropertyID uint   `json:"property_id" binding:"required"`
	Rating     int    `json:"rating"      binding:"required,min=1,max=5"`
	Comment    string `json:"comment"`
}

func (ctrl *ReviewController) createReview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var input createReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	// Verify property exists
	var prop model.Property
	if err := database.DB.First(&prop, input.PropertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("property"))
		return
	}

	review := model.Review{
		PropertyID: input.PropertyID,
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
