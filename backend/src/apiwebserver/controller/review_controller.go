package controller

import (
	"errors"
	"time"

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

	// Token-gated submission. Token authorizes which property is being reviewed.
	reviews := r.Group("/reviews", middleware.Protected())
	reviews.POST("", ctrl.createReview)
	// Agents/admins reply to a user review. Property-agent or admin only —
	// enforced inside the handler since "agent" alone is too broad.
	reviews.PATCH("/:id/reply", middleware.Rbac(model.RoleAgent), ctrl.replyReview)

	// Direct submission from a property page. Any logged-in user can post one
	// review per property; the path :id binds the review to that property.
	r.POST("/properties/:id/reviews", middleware.Protected(), ctrl.createDirectReview)
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
		"propertyTitle": prop.ProjectName,
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

	dto, err := saveReview(propertyID, userID, input.Rating, input.Comment)
	if err != nil {
		errorResponse(c, err)
		return
	}
	created(c, dto)
}

type createDirectReviewInput struct {
	Rating  int    `json:"rating"  binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

func (ctrl *ReviewController) createDirectReview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	propertyID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	var input createDirectReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := saveReview(propertyID, userID, input.Rating, input.Comment)
	if err != nil {
		errorResponse(c, err)
		return
	}
	created(c, dto)
}

// saveReview is the shared insert path for both the token and direct flows.
// One review per (property,user) — repeat submissions overwrite the previous
// one so a user can refine their rating without spamming the list.
func saveReview(propertyID, userID uint, rating int, comment string) (*model.ReviewDto, error) {
	var prop model.Property
	if err := database.DB.First(&prop, propertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperror.NotFound("property")
	} else if err != nil {
		return nil, apperror.Wrap(err, 500, "database error")
	}

	var review model.Review
	err := database.DB.
		Where("property_id = ? AND user_id = ?", propertyID, userID).
		First(&review).Error
	switch {
	case err == nil:
		review.Rating = rating
		review.Comment = comment
		if err := database.DB.Save(&review).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to update review")
		}
	case errors.Is(err, gorm.ErrRecordNotFound):
		review = model.Review{
			PropertyID: propertyID,
			UserID:     userID,
			Rating:     rating,
			Comment:    comment,
		}
		if err := database.DB.Create(&review).Error; err != nil {
			return nil, apperror.Wrap(err, 500, "failed to create review")
		}
	default:
		return nil, apperror.Wrap(err, 500, "database error")
	}

	database.DB.Preload("User").Preload("RepliedBy").First(&review, review.ID)
	return review.ToDto(), nil
}

type replyReviewInput struct {
	Reply string `json:"reply" binding:"required"`
}

func (ctrl *ReviewController) replyReview(c *gin.Context) {
	callerID := middleware.GetUserID(c)
	callerRole := middleware.GetRole(c)

	reviewID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid review id")
		return
	}

	var input replyReviewInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	var review model.Review
	if err := database.DB.Preload("Property").First(&review, reviewID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("review"))
		return
	} else if err != nil {
		errorResponse(c, apperror.Wrap(err, 500, "database error"))
		return
	}

	// Agent can only reply on properties they own. Admin can reply anywhere.
	if callerRole != model.RoleAdmin {
		if review.Property.AgentID == nil || *review.Property.AgentID != callerID {
			errorResponse(c, apperror.Forbidden("you can only reply on your own properties"))
			return
		}
	}

	now := time.Now()
	review.Reply = input.Reply
	review.RepliedByID = &callerID
	review.RepliedAt = &now
	if err := database.DB.Save(&review).Error; err != nil {
		errorResponse(c, apperror.Wrap(err, 500, "failed to save reply"))
		return
	}

	database.DB.Preload("User").Preload("RepliedBy").First(&review, review.ID)
	successResponse(c, review.ToDto())
}
