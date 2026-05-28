.PHONY: dev migrate seed build

dev:
	go run ./src

migrate:
	go run ./src migrate

seed:
	go run ./src seed

build:
	CGO_ENABLED=0 go build -ldflags="-w -s" -o server ./src
