.PHONY: help build run clean test docker-build docker-run air

# Default target
help:
	@echo "Available commands:"
	@echo "  build       - Build the application"
	@echo "  run         - Run the application"
	@echo "  clean       - Clean build artifacts"
	@echo "  test        - Run tests"
	@echo "  air         - Run with Air hot reload"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run  - Run Docker container"

# Build the application
build:
	go build -o bin/main cmd/server/main.go

# Run the application
run:
	go run cmd/server/main.go

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf tmp/
	rm -f build-errors.log

# Run tests
test:
	go test -v ./...

# Run with Air hot reload
air:
	air

# Build Docker image
docker-build:
	docker build -t webcrawler-backend .

# Run Docker container
docker-run:
	docker run -p 8080:8080 --env-file ../.env webcrawler-backend

# Install dependencies
deps:
	go mod download
	go mod tidy

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run 