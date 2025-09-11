# BunSqStat Makefile
# Build and publish Docker images

# Variables
IMAGE_NAME ?= bunsqstat
DOCKER_USERNAME ?= francyfox
VERSION ?= latest
PLATFORM ?= linux/amd64,linux/arm64

# Default target
.PHONY: help
help:
	@echo "BunSqStat Docker Build Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev-compose    - Start development with docker-compose"
	@echo "  make prod-compose   - Start production with docker-compose"
	@echo ""
	@echo "All-in-One Image:"
	@echo "  make build          - Build all-in-one Docker image"
	@echo "  make run            - Run all-in-one container locally"
	@echo "  make test           - Test all-in-one image"
	@echo ""
	@echo "Docker Hub Publishing:"
	@echo "  make login          - Login to Docker Hub"
	@echo "  make push           - Build and push to Docker Hub"
	@echo "  make push-multi     - Build and push multi-platform"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove local images and containers"
	@echo "  make clean-all      - Remove everything including volumes"

# Development
.PHONY: dev-compose
dev-compose:
	docker-compose up --build -d
	@echo "Development started at http://localhost:80"

.PHONY: prod-compose
prod-compose:
	docker-compose -f docker-compose.prod.yml up --build -d
	@echo "Production started at http://localhost:80"

# All-in-One Image
.PHONY: build
build:
	@echo "Building all-in-one Docker image..."
	docker build -f Dockerfile -t $(IMAGE_NAME):$(VERSION) .
	docker build -f Dockerfile -t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) .
	@echo "Built $(IMAGE_NAME):$(VERSION)"

.PHONY: run
run: build
	@echo "Running all-in-one container..."
	-docker stop bunsqstat-test 2>/dev/null || true
	-docker rm bunsqstat-test 2>/dev/null || true
	docker run -d \
		--name bunsqstat-test \
		-p 8080:80 \
		-p 8081:3000 \
		-e REDIS_PASSWORD=test123 \
		$(IMAGE_NAME):$(VERSION)
	@echo "Container started:"
	@echo "  Web UI: http://localhost:8080"
	@echo "  API: http://localhost:8081"
	@echo ""
	@echo "To stop: docker stop bunsqstat-test"
	@echo "To view logs: docker logs -f bunsqstat-test"

.PHONY: test
test: build
	@echo "Testing all-in-one image..."
	-docker stop bunsqstat-test 2>/dev/null || true
	-docker rm bunsqstat-test 2>/dev/null || true
	docker run -d --name bunsqstat-test -p 8080:80 $(IMAGE_NAME):$(VERSION)
	@echo "Waiting for container to start..."
	sleep 15
	@echo "Testing health endpoint..."
	curl -f http://localhost:8080/api/health || (docker logs bunsqstat-test && false)
	@echo "✅ Health check passed!"
	curl -s http://localhost:8080/ | grep -q -i "doctype html" || (echo "❌ Frontend not responding" && false)
	@echo "✅ Frontend responding!"
	docker stop bunsqstat-test
	docker rm bunsqstat-test
	@echo "✅ All tests passed!"

# Docker Hub Publishing
.PHONY: login
login:
	@echo "Logging in to Docker Hub..."
	@read -p "Docker Hub username: " username; \
	docker login -u $$username

.PHONY: push
push: build
	@echo "Pushing to Docker Hub..."
	docker push $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION)
	@if [ "$(VERSION)" != "latest" ]; then \
		docker tag $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) $(DOCKER_USERNAME)/$(IMAGE_NAME):latest; \
		docker push $(DOCKER_USERNAME)/$(IMAGE_NAME):latest; \
	fi
	@echo "✅ Pushed $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION)"

.PHONY: push-multi
push-multi:
	@echo "Building and pushing multi-platform image..."
	docker buildx create --use --name multiplatform || true
	docker buildx build \
		--platform $(PLATFORM) \
		-f Dockerfile \
		-t $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) \
		--push .
	@if [ "$(VERSION)" != "latest" ]; then \
		docker buildx build \
			--platform $(PLATFORM) \
			-f Dockerfile \
			-t $(DOCKER_USERNAME)/$(IMAGE_NAME):latest \
			--push .; \
	fi
	@echo "✅ Pushed multi-platform $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION)"

# Cleanup
.PHONY: clean
clean:
	@echo "Cleaning up local images and containers..."
	-docker stop bunsqstat-test 2>/dev/null || true
	-docker rm bunsqstat-test 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):$(VERSION) 2>/dev/null || true
	-docker rmi $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION) 2>/dev/null || true
	@echo "✅ Cleanup complete"

.PHONY: clean-all
clean-all: clean
	@echo "Cleaning up everything including volumes..."
	-docker-compose down -v 2>/dev/null || true
	-docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
	-docker volume prune -f
	-docker builder prune -f
	@echo "✅ Complete cleanup done"

# Release workflow
.PHONY: release
release: test push
	@echo "✅ Release complete!"
	@echo "Image: $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION)"
	@echo "Try: docker run -d -p 80:80 -v /var/log/squid:/app/logs:ro $(DOCKER_USERNAME)/$(IMAGE_NAME):$(VERSION)"

# Version targets
.PHONY: patch minor major
patch:
	$(MAKE) release VERSION=$$(date +%Y%m%d)-patch

minor:
	$(MAKE) release VERSION=$$(date +%Y%m%d)-minor

major:
	$(MAKE) release VERSION=$$(date +%Y%m%d)-major
