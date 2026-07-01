package feature

import (
	"errors"
	"testing"

	"github.com/wealthy-prime/backend/src/apiwebserver/service"
	"github.com/wealthy-prime/backend/src/apperror"
	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
	"github.com/wealthy-prime/backend/src/security"
	"github.com/wealthy-prime/backend/src/tests/helpers"
)

func newAuthSvc(t *testing.T) (*service.AuthService, *helpers.CaptureSender, func()) {
	db, cleanup := helpers.TestDB(t)
	config.App.Server.JWTSecret = "test-jwt-secret"
	sender := &helpers.CaptureSender{}
	return service.NewAuthServiceWithDeps(db, sender), sender, cleanup
}

func TestAuth_RegisterThenLogin(t *testing.T) {
	svc, _, cleanup := newAuthSvc(t)
	defer cleanup()

	dto, err := svc.Register(service.RegisterInput{
		FirstName: "Reg", LastName: "Test",
		Email: "reg@test.local", Password: "passw0rd", Phone: "0810000001",
	})
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if dto.Email != "reg@test.local" || dto.Role != model.RoleUser {
		t.Errorf("unexpected dto: %+v", dto)
	}

	got, err := svc.Login(service.LoginInput{Email: "reg@test.local", Password: "passw0rd"})
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if got.Token == "" {
		t.Error("Login returned empty token")
	}

	if _, err := security.ValidateToken(got.Token); err != nil {
		t.Errorf("returned token does not validate: %v", err)
	}
}

func TestAuth_LoginRejectsWrongPassword(t *testing.T) {
	svc, _, cleanup := newAuthSvc(t)
	defer cleanup()

	if _, err := svc.Register(service.RegisterInput{
		Email: "wp@test.local", Password: "correct1", Phone: "0810000002",
		FirstName: "X", LastName: "Y",
	}); err != nil {
		t.Fatalf("Register: %v", err)
	}

	_, err := svc.Login(service.LoginInput{Email: "wp@test.local", Password: "WRONG"})
	if err == nil {
		t.Fatal("expected Login to reject wrong password")
	}
	var apErr *apperror.AppError
	if !errors.As(err, &apErr) || apErr.Status != 401 {
		t.Errorf("expected 401 Unauthorized, got: %v", err)
	}
}

func TestAuth_RegisterRejectsDuplicateEmail(t *testing.T) {
	svc, _, cleanup := newAuthSvc(t)
	defer cleanup()

	in := service.RegisterInput{
		Email: "dup@test.local", Password: "passw0rd", Phone: "0810000003",
		FirstName: "A", LastName: "B",
	}
	if _, err := svc.Register(in); err != nil {
		t.Fatalf("first Register: %v", err)
	}
	if _, err := svc.Register(in); err == nil {
		t.Fatal("expected duplicate email to fail")
	}
}
