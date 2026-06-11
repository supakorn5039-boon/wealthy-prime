package controller

import (
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/database"
	"github.com/wealthy-prime/backend/src/database/model"
)

type UserController struct {
	bookingSvc *service.BookingService
	inquirySvc *service.InquiryService
}

func NewUserController() *UserController {
	return &UserController{
		bookingSvc: service.NewBookingService(),
		inquirySvc: service.NewInquiryService(),
	}
}

func (ctrl *UserController) RegisterRoutes(r *gin.RouterGroup) {
	user := r.Group("/user",
		middleware.Protected(),
		middleware.Rbac(model.RoleUser),
	)

	user.GET("/wishlist", ctrl.getWishlist)
	user.POST("/wishlist", ctrl.addWishlist)
	user.DELETE("/wishlist/:propertyId", ctrl.removeWishlist)

	user.GET("/history", ctrl.getHistory)
	user.POST("/history/:propertyId", ctrl.addHistory)

	user.POST("/bookings", ctrl.createBookings)
	user.GET("/bookings", ctrl.listBookings)
	user.GET("/bookings/:id", ctrl.getBooking)
	user.PUT("/bookings/:id", ctrl.updateBooking)
	user.GET("/contacts", ctrl.getContacts)

	user.POST("/inquiries", ctrl.createInquiry)
}

// Wishlist

func (ctrl *UserController) getWishlist(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var items []model.Wishlist
	if err := database.DB.Preload("Property.Images").Preload("Property.Agent").
		Where("user_id = ?", userID).Find(&items).Error; err != nil {
		errorResponse(c, apperror.Wrap(err, 500, "failed to fetch wishlist"))
		return
	}

	dtos := make([]model.PropertyDto, len(items))
	for i, w := range items {
		dtos[i] = *w.Property.ToDto()
	}
	successResponse(c, dtos)
}

func (ctrl *UserController) addWishlist(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		PropertyID uint `json:"property_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	// Check property exists
	var prop model.Property
	if err := database.DB.First(&prop, body.PropertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("property"))
		return
	}

	item := model.Wishlist{UserID: userID, PropertyID: body.PropertyID}
	if err := database.DB.Create(&item).Error; err != nil {
		// Unique constraint violation means already in wishlist
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			errorResponse(c, apperror.Conflict("property already in wishlist"))
			return
		}
		errorResponse(c, apperror.Wrap(err, 500, "failed to add to wishlist"))
		return
	}

	created(c, gin.H{"message": "added to wishlist"})
}

func (ctrl *UserController) removeWishlist(c *gin.Context) {
	userID := middleware.GetUserID(c)
	propertyID, err := parseUintParam(c, "propertyId")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	result := database.DB.Unscoped().Where("user_id = ? AND property_id = ?", userID, propertyID).Delete(&model.Wishlist{})
	if result.Error != nil {
		errorResponse(c, apperror.Wrap(result.Error, 500, "failed to remove from wishlist"))
		return
	}
	if result.RowsAffected == 0 {
		errorResponse(c, apperror.NotFound("wishlist item"))
		return
	}

	successResponse(c, gin.H{"message": "removed from wishlist"})
}

// Browse History

func (ctrl *UserController) getHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var items []model.BrowseHistory
	if err := database.DB.Preload("Property.Images").Preload("Property.Agent").
		Where("user_id = ?", userID).Order("created_at DESC").Find(&items).Error; err != nil {
		errorResponse(c, apperror.Wrap(err, 500, "failed to fetch history"))
		return
	}

	dtos := make([]model.PropertyDto, len(items))
	for i, h := range items {
		dtos[i] = *h.Property.ToDto()
	}
	successResponse(c, dtos)
}

func (ctrl *UserController) addHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	propertyID, err := parseUintParam(c, "propertyId")
	if err != nil {
		badRequest(c, "invalid property id")
		return
	}

	// Check property exists
	var prop model.Property
	if err := database.DB.First(&prop, propertyID).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		errorResponse(c, apperror.NotFound("property"))
		return
	}

	// Upsert: update or insert
	var existing model.BrowseHistory
	res := database.DB.Where("user_id = ? AND property_id = ?", userID, propertyID).First(&existing)
	if res.Error == nil {
		// Already exists — update timestamp
		database.DB.Model(&existing).Update("updated_at", gorm.Expr("NOW()"))
	} else {
		item := model.BrowseHistory{UserID: userID, PropertyID: propertyID}
		if err := database.DB.Create(&item).Error; err != nil {
			errorResponse(c, apperror.Wrap(err, 500, "failed to record history"))
			return
		}
	}

	successResponse(c, gin.H{"message": "history recorded"})
}

// Bookings

func (ctrl *UserController) createBookings(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var input service.CreateBookingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	dtos, err := ctrl.bookingSvc.CreateBookings(userID, input)
	if err != nil {
		errorResponse(c, err)
		return
	}

	created(c, dtos)
}

func (ctrl *UserController) listBookings(c *gin.Context) {
	userID := middleware.GetUserID(c)
	dtos, err := ctrl.bookingSvc.GetUserBookings(userID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dtos)
}

func (ctrl *UserController) getBooking(c *gin.Context) {
	userID := middleware.GetUserID(c)
	bookingID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid booking id")
		return
	}
	dto, err := ctrl.bookingSvc.GetUserBooking(userID, bookingID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *UserController) updateBooking(c *gin.Context) {
	userID := middleware.GetUserID(c)
	bookingID, err := parseUintParam(c, "id")
	if err != nil {
		badRequest(c, "invalid booking id")
		return
	}

	var body struct {
		Status model.BookingStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}

	// Users can only cancel their own bookings, not change to other statuses.
	if body.Status != model.BookingCancelled {
		errorResponse(c, apperror.Forbidden("users can only cancel their own bookings"))
		return
	}

	dto, err := ctrl.bookingSvc.UpdateUserBookingStatus(userID, bookingID, body.Status)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *UserController) getContacts(c *gin.Context) {
	userID := middleware.GetUserID(c)

	dtos, err := ctrl.bookingSvc.GetUserBookings(userID)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, dtos)
}

func (ctrl *UserController) createInquiry(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var input service.CreateInquiryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	dto, err := ctrl.inquirySvc.CreateInquiry(userID, input)
	if err != nil {
		errorResponse(c, err)
		return
	}
	created(c, dto)
}
