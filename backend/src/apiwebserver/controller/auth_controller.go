package controller

import (
	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/middleware"
	"github.com/wealthy-prime/backend/src/apiwebserver/service"
)

type AuthController struct {
	svc      *service.AuthService
	adminSvc *service.AdminService
}

func NewAuthController() *AuthController {
	return &AuthController{
		svc:      service.NewAuthService(),
		adminSvc: service.NewAdminService(),
	}
}

func (ctrl *AuthController) RegisterRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	auth.POST("/register", ctrl.register)
	auth.POST("/login", ctrl.login)
	auth.POST("/forgot-password", ctrl.forgotPassword)
	auth.POST("/reset-password", ctrl.resetPassword)
	auth.GET("/profile", middleware.Protected(), ctrl.profile)
	auth.PUT("/profile", middleware.Protected(), ctrl.updateProfile)
}

func (ctrl *AuthController) profile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := ctrl.adminSvc.GetUser(userID)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, user)
}

func (ctrl *AuthController) updateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body profileUpdateBody
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := body.validate(); err != nil {
		badRequest(c, err.Error())
		return
	}

	updates := body.toUpdates()
	if len(updates) == 0 {
		badRequest(c, "no fields to update")
		return
	}

	dto, err := ctrl.adminSvc.UpdateUser(userID, updates)
	if err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, dto)
}

func (ctrl *AuthController) register(c *gin.Context) {
	var input service.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	user, err := ctrl.svc.Register(input)
	if err != nil {
		errorResponse(c, err)
		return
	}

	created(c, user)
}

func (ctrl *AuthController) login(c *gin.Context) {
	var input service.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		badRequest(c, err.Error())
		return
	}

	resp, err := ctrl.svc.Login(input)
	if err != nil {
		errorResponse(c, err)
		return
	}

	successResponse(c, resp)
}

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type resetPasswordRequest struct {
	Token       string `json:"token"       binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// forgotPassword always returns the same generic 200 response — regardless of
// whether the email is registered or whether the email send succeeded — so a
// caller can't enumerate registered accounts.
func (ctrl *AuthController) forgotPassword(c *gin.Context) {
	var body forgotPasswordRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}
	_ = ctrl.svc.RequestPasswordReset(body.Email)
	successResponse(c, gin.H{"message": "If that email is registered, a reset link has been sent."})
}

func (ctrl *AuthController) resetPassword(c *gin.Context) {
	var body resetPasswordRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		badRequest(c, err.Error())
		return
	}
	if err := ctrl.svc.ResetPassword(body.Token, body.NewPassword); err != nil {
		errorResponse(c, err)
		return
	}
	successResponse(c, gin.H{"message": "Password has been reset."})
}
