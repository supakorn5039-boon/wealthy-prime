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

// successResponse sends a 200 JSON response with data.
func successResponse(c *gin.Context, data any) {
	c.JSON(http.StatusOK, apiResponse{Success: true, Data: data})
}

// created sends a 201 JSON response with data.
func created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, apiResponse{Success: true, Data: data})
}

// errorResponse unwraps an AppError and returns the correct status code + message.
func errorResponse(c *gin.Context, err error) {
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.Status, apiResponse{Success: false, Error: appErr.Message})
		return
	}
	c.JSON(http.StatusInternalServerError, apiResponse{Success: false, Error: "internal server error"})
}

// badRequest sends a 400 response with a message string.
func badRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, apiResponse{Success: false, Error: msg})
}
