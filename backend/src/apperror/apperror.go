package apperror

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Status  int
	Message string
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Status, e.Message, e.Err)
	}
	return fmt.Sprintf("[%d] %s", e.Status, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func New(status int, message string) *AppError {
	return &AppError{Status: status, Message: message}
}

func Wrap(err error, status int, message string) *AppError {
	return &AppError{Status: status, Message: message, Err: err}
}

func NotFound(resource string) *AppError {
	return &AppError{Status: http.StatusNotFound, Message: resource + " not found"}
}

func BadRequest(message string) *AppError {
	return &AppError{Status: http.StatusBadRequest, Message: message}
}

func Unauthorized(message string) *AppError {
	if message == "" {
		message = "unauthorized"
	}
	return &AppError{Status: http.StatusUnauthorized, Message: message}
}

func Forbidden(message string) *AppError {
	if message == "" {
		message = "forbidden"
	}
	return &AppError{Status: http.StatusForbidden, Message: message}
}

func Conflict(message string) *AppError {
	return &AppError{Status: http.StatusConflict, Message: message}
}
