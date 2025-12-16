.PHONY: help install build clean dev start stop restart logs test docker-up docker-down docker-build docker-clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

##@ General

help: ## Display this help message
	@echo "$(BLUE)Behavioral Analytics Monorepo - Available Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make $(GREEN)<target>$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(RESET)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

install: ## Install all dependencies for monorepo
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	npm install
	npm install -ws
	@echo "$(GREEN)Dependencies installed successfully!$(RESET)"

install-shared: ## Install shared package dependencies
	@echo "$(BLUE)Installing shared dependencies...$(RESET)"
	npm install -w shared
	@echo "$(GREEN)Shared dependencies installed!$(RESET)"

build: ## Build all packages
	@echo "$(BLUE)Building all packages...$(RESET)"
	npm run build
	@echo "$(GREEN)Build completed!$(RESET)"

build-shared: ## Build shared package
	@echo "$(BLUE)Building shared package...$(RESET)"
	npm run build:shared
	@echo "$(GREEN)Shared package built!$(RESET)"

build-server: ## Build server package
	@echo "$(BLUE)Building server...$(RESET)"
	npm run build:server
	@echo "$(GREEN)Server built!$(RESET)"

build-client: ## Build client package
	@echo "$(BLUE)Building client...$(RESET)"
	npm run build:client
	@echo "$(GREEN)Client built!$(RESET)"

build-dashboard: ## Build dashboard
	@echo "$(BLUE)Building dashboard...$(RESET)"
	npm run build:dashboard
	@echo "$(GREEN)Dashboard built!$(RESET)"

build-inference: ## Build inference engine
	@echo "$(BLUE)Building inference engine...$(RESET)"
	npm run build:inference
	@echo "$(GREEN)Inference engine built!$(RESET)"

dev: ## Start all services in development mode
	@echo "$(BLUE)Starting all services in development mode...$(RESET)"
	npm run dev

dev-server: ## Start server in development mode
	@echo "$(BLUE)Starting server...$(RESET)"
	npm run dev:server

dev-dashboard: ## Start dashboard in development mode
	@echo "$(BLUE)Starting dashboard...$(RESET)"
	npm run dev:dashboard

dev-inference: ## Start inference engine in development mode
	@echo "$(BLUE)Starting inference engine...$(RESET)"
	npm run dev:inference

##@ Production

start: ## Start all production services
	@echo "$(BLUE)Starting all services...$(RESET)"
	npm run start:all

start-server: ## Start server in production mode
	@echo "$(BLUE)Starting server...$(RESET)"
	npm run start:server

start-dashboard: ## Start dashboard server
	@echo "$(BLUE)Starting dashboard...$(RESET)"
	npm run start:dashboard

start-inference: ## Start inference engine in production mode
	@echo "$(BLUE)Starting inference engine...$(RESET)"
	npm run start:inference

##@ Docker

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(RESET)"
	docker-compose build
	@echo "$(GREEN)Docker images built!$(RESET)"

docker-up: ## Start all Docker containers
	@echo "$(BLUE)Starting Docker containers...$(RESET)"
	docker-compose up -d
	@echo "$(GREEN)Containers started!$(RESET)"
	@echo "$(YELLOW)Run 'make docker-logs' to view logs$(RESET)"

docker-up-build: ## Build and start Docker containers
	@echo "$(BLUE)Building and starting Docker containers...$(RESET)"
	docker-compose up -d --build
	@echo "$(GREEN)Containers built and started!$(RESET)"

docker-down: ## Stop and remove Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(RESET)"
	docker-compose down
	@echo "$(GREEN)Containers stopped!$(RESET)"

docker-restart: ## Restart Docker containers
	@echo "$(BLUE)Restarting Docker containers...$(RESET)"
	docker-compose restart
	@echo "$(GREEN)Containers restarted!$(RESET)"

docker-logs: ## View Docker container logs
	@echo "$(BLUE)Viewing Docker logs (Ctrl+C to exit)...$(RESET)"
	docker-compose logs -f

docker-logs-server: ## View server logs
	docker-compose logs -f server-api

docker-logs-inference: ## View inference engine logs
	docker-compose logs -f inference-engine

docker-logs-dashboard: ## View dashboard logs
	docker-compose logs -f dashboard

docker-logs-db: ## View database logs
	docker-compose logs -f postgres

docker-clean: ## Stop containers and remove volumes
	@echo "$(YELLOW)Warning: This will remove all volumes and data!$(RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)Containers and volumes removed!$(RESET)"; \
	else \
		echo "$(BLUE)Cancelled.$(RESET)"; \
	fi

docker-ps: ## Show running containers
	@docker-compose ps

docker-shell-server: ## Open shell in server container
	@docker-compose exec server-api sh

docker-shell-inference: ## Open shell in inference container
	@docker-compose exec inference-engine sh

docker-shell-dashboard: ## Open shell in dashboard container
	@docker-compose exec dashboard sh

docker-shell-db: ## Open shell in database container
	@docker-compose exec postgres psql -U postgres -d behavioral_analytics

##@ Database

db-connect: ## Connect to database
	@echo "$(BLUE)Connecting to database...$(RESET)"
	psql -h localhost -p 5432 -U postgres -d behavioral_analytics

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(RESET)"
	@echo "$(YELLOW)Migrations are auto-run on container start$(RESET)"

db-backup: ## Backup database
	@echo "$(BLUE)Creating database backup...$(RESET)"
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres behavioral_analytics > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/ directory$(RESET)"

db-restore: ## Restore database from backup (usage: make db-restore FILE=backup.sql)
	@echo "$(BLUE)Restoring database...$(RESET)"
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify FILE=backup.sql$(RESET)"; \
		exit 1; \
	fi
	cat $(FILE) | docker-compose exec -T postgres psql -U postgres behavioral_analytics
	@echo "$(GREEN)Database restored!$(RESET)"

##@ Testing & Quality

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(RESET)"
	npm test

test-server: ## Run server tests
	@echo "$(BLUE)Running server tests...$(RESET)"
	npm test -w server

test-client: ## Run client tests
	@echo "$(BLUE)Running client tests...$(RESET)"
	npm test -w client

test-dashboard: ## Run dashboard tests
	@echo "$(BLUE)Running dashboard tests...$(RESET)"
	npm test -w dashboard

type-check: ## Type check all packages
	@echo "$(BLUE)Type checking...$(RESET)"
	npm run type-check
	@echo "$(GREEN)Type check completed!$(RESET)"

##@ Cleanup

clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	npm run clean
	@echo "$(GREEN)Clean completed!$(RESET)"

clean-all: clean ## Deep clean including node_modules
	@echo "$(YELLOW)Removing all node_modules...$(RESET)"
	rm -rf node_modules
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	rm -rf package-lock.json
	@echo "$(GREEN)Deep clean completed!$(RESET)"

clean-docker: docker-clean ## Alias for docker-clean

##@ Utilities

status: ## Show service status
	@echo "$(BLUE)Service Status:$(RESET)"
	@echo ""
	@echo "$(GREEN)Docker Containers:$(RESET)"
	@docker-compose ps || echo "Docker not running"
	@echo ""
	@echo "$(GREEN)Node Processes:$(RESET)"
	@ps aux | grep "node\|tsx" | grep -v grep || echo "No Node processes"

ports: ## Show port usage
	@echo "$(BLUE)Port Usage:$(RESET)"
	@echo "$(GREEN)3000$(RESET) - API Server"
	@echo "$(GREEN)3001$(RESET) - Inference Engine"
	@echo "$(GREEN)3002$(RESET) - Dashboard"
	@echo "$(GREEN)5432$(RESET) - PostgreSQL"
	@echo "$(GREEN)6379$(RESET) - Redis (optional)"

env-check: ## Check environment variables
	@echo "$(BLUE)Checking environment variables...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found!$(RESET)"; \
		echo "$(YELLOW)Copy .env.example to .env and configure it$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN).env file exists$(RESET)"
	@grep -q "DB_PASSWORD=postgres_secure_password_123" .env && \
		echo "$(YELLOW)Warning: Using default database password$(RESET)" || true
	@grep -q "JWT_SECRET=your_jwt_secret" .env && \
		echo "$(YELLOW)Warning: Using default JWT secret$(RESET)" || true

setup: ## Initial project setup
	@echo "$(BLUE)Setting up project...$(RESET)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file...$(RESET)"; \
		cp .env.example .env; \
		echo "$(GREEN).env file created$(RESET)"; \
		echo "$(YELLOW)Please update .env with your configuration$(RESET)"; \
	fi
	@make install
	@make build
	@echo "$(GREEN)Setup completed!$(RESET)"

reset: clean-all setup ## Reset project to fresh state

##@ Information

version: ## Show version information
	@echo "$(BLUE)Version Information:$(RESET)"
	@echo "Node: $$(node --version)"
	@echo "NPM: $$(npm --version)"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker Compose: $$(docker-compose --version 2>/dev/null || echo 'Not installed')"

info: version ports ## Show project information
	@echo ""
	@echo "$(BLUE)Project: Behavioral Analytics Monorepo$(RESET)"
	@echo "$(BLUE)Workspaces:$(RESET) shared, server, client, dashboard, inference-engine"
