.PHONY: dev migrate seed build test test-v cover

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

cover:
	go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out
