.PHONY: dev migrate seed build test test-v test-unit test-feature test-integration cover

dev:
	go run ./src

migrate:
	go run ./src migrate

seed:
	go run ./src seed

build:
	CGO_ENABLED=0 go build -ldflags="-w -s" -o server ./src

test:
	go test ./...

test-v:
	go test -v ./...

# Unit tests only (skips tests/feature/ — package-local *_test.go files).
test-unit:
	go test $$(go list ./... | grep -v '/tests/')

# Feature tests only (HTTP-level, no DB).
test-feature:
	go test ./src/tests/feature/...

# DB-backed integration tests — opt-in via build tag.
# Requires TEST_DATABASE_URL pointing at an empty test postgres.
test-integration:
	go test -tags integration ./...

cover:
	go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out
