package controller

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/wealthy-prime/backend/src/apperror"
)

type apiResponse struct {
	Success bool   `json:"success"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func successResponse(c *gin.Context, data any) {
	c.JSON(http.StatusOK, apiResponse{Success: true, Data: data})
}

func created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, apiResponse{Success: true, Data: data})
}

func errorResponse(c *gin.Context, err error) {
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.Status, apiResponse{Success: false, Error: appErr.Message})
		return
	}
	c.JSON(http.StatusInternalServerError, apiResponse{Success: false, Error: "internal server error"})
}

func badRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, apiResponse{Success: false, Error: msg})
}
