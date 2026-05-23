package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

// AppError is a structured application error carrying an HTTP status code.
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

// New creates a plain AppError with the given status and message.
func New(status int, message string) *AppError {
	return &AppError{Status: status, Message: message}
}

// Wrap wraps an underlying error with an HTTP status and message.
func Wrap(err error, status int, message string) *AppError {
	return &AppError{Status: status, Message: message, Err: err}
}

// NotFound returns a 404 AppError.
func NotFound(resource string) *AppError {
	return &AppError{Status: http.StatusNotFound, Message: resource + " not found"}
}

// BadRequest returns a 400 AppError.
func BadRequest(message string) *AppError {
	return &AppError{Status: http.StatusBadRequest, Message: message}
}

// Unauthorized returns a 401 AppError.
func Unauthorized(message string) *AppError {
	if message == "" {
		message = "unauthorized"
	}
	return &AppError{Status: http.StatusUnauthorized, Message: message}
}

// Forbidden returns a 403 AppError.
func Forbidden(message string) *AppError {
	if message == "" {
		message = "forbidden"
	}
	return &AppError{Status: http.StatusForbidden, Message: message}
}

// Conflict returns a 409 AppError.
func Conflict(message string) *AppError {
	return &AppError{Status: http.StatusConflict, Message: message}
}

// Internal returns a 500 AppError.
func Internal(message string) *AppError {
	return &AppError{Status: http.StatusInternalServerError, Message: message}
}

// Is satisfies errors.Is for AppError type matching.
func Is(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}
