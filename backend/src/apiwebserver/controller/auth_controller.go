package controller

import (
	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
)

type AuthController struct {
	svc *service.AuthService
}

func NewAuthController() *AuthController {
	return &AuthController{svc: service.NewAuthService()}
}

func (ctrl *AuthController) RegisterRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	auth.POST("/register", ctrl.register)
	auth.POST("/login", ctrl.login)
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
