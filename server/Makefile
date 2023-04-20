.PHONY: all

all: build

build:
	go build -o dist/planner main.go

run:
	go run main.go

test:
	go test -v ./...

mocks:
	mockery --all

mocks_podman:
	podman run --rm -v "$(shell pwd)":/src -w /src docker.io/vektra/mockery --all