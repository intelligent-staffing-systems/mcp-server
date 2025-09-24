.PHONY: help install test dev https tunnel config logs clean status git-init commit push deploy

# Default target
help: ## Show this help message
	@echo "MCP Server - Available Commands"
	@echo "================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install Node.js dependencies
	npm install

test: ## Test the stdio MCP server
	@echo "Testing MCP server..."
	@echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node stdio-mcp-server.js | head -1 | jq '.'

dev: ## Start HTTP development server
	@echo "Starting HTTP MCP server on http://localhost:3000/mcp"
	node simple-mcp-server.js

https: certs ## Start HTTPS server
	@echo "Starting HTTPS MCP server on https://localhost:3443/mcp"
	node https-mcp-server.js

certs: ## Generate self-signed SSL certificates
	@if [ ! -f certs/key.pem ]; then \
		echo "Generating SSL certificates..."; \
		mkdir -p certs; \
		openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"; \
	else \
		echo "SSL certificates already exist"; \
	fi

tunnel: ## Create HTTPS tunnel with localtunnel
	@command -v lt >/dev/null 2>&1 || npm install -g localtunnel
	@echo "Starting HTTP server and creating tunnel..."
	@(node simple-mcp-server.js &) && sleep 2 && lt --port 3000

config: ## Update Claude Desktop configuration
	@echo "Updating Claude Desktop configuration..."
	@CONFIG_FILE="$$HOME/Library/Application Support/Claude/claude_desktop_config.json"; \
	if [ -f "$$CONFIG_FILE" ]; then \
		cp "$$CONFIG_FILE" "$$CONFIG_FILE.bak"; \
		echo "Backup created at $$CONFIG_FILE.bak"; \
	fi; \
	echo '{"mcpServers":{"local-mcp-server":{"command":"node","args":["'$$(pwd)'/stdio-mcp-server.js"],"cwd":"'$$(pwd)'","env":{}}}}' | jq '.' > "$$CONFIG_FILE"; \
	echo "Configuration updated. Restart Claude Desktop to apply changes."

logs: ## Show MCP server logs
	@LOG_FILE="$$HOME/Library/Logs/Claude/mcp-server-local-mcp-server.log"; \
	if [ -f "$$LOG_FILE" ]; then \
		tail -n 50 "$$LOG_FILE"; \
	else \
		echo "No logs found. Start Claude Desktop to generate logs."; \
	fi

clean: ## Clean generated files and certificates
	rm -rf certs/
	rm -f *.log
	find . -name "*.pid" -delete
	@echo "Cleaned generated files"

status: ## Check server and configuration status
	@echo "=== MCP Server Status ==="
	@echo -n "Git repository: "; git rev-parse --is-inside-work-tree 2>/dev/null && echo "Yes" || echo "No"
	@echo -n "Node.js version: "; node --version
	@echo -n "npm version: "; npm --version
	@echo -n "SSL certificates: "; [ -f certs/key.pem ] && echo "Generated" || echo "Not generated"
	@echo ""
	@echo "=== Claude Desktop Configuration ==="
	@CONFIG_FILE="$$HOME/Library/Application Support/Claude/claude_desktop_config.json"; \
	if [ -f "$$CONFIG_FILE" ]; then \
		echo "Configuration file exists:"; \
		cat "$$CONFIG_FILE" | jq '.'; \
	else \
		echo "Configuration file not found"; \
	fi

# Git operations
git-init: ## Initialize git repository
	@if [ ! -d .git ]; then \
		git init; \
		git branch -M main; \
		echo "Git repository initialized"; \
	else \
		echo "Git repository already exists"; \
	fi

commit: ## Commit all changes
	git add -A
	git status
	git commit -m "Add MCP server implementation for Claude Desktop" -m "- Stdio-based MCP server for Claude Desktop integration" -m "- HTTP/HTTPS servers for testing" -m "- Built-in note management tools" -m "- Comprehensive documentation and Makefile" -m "" -m "🤖 Generated with Claude Code" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

push: ## Push to GitHub
	git push -u origin main

deploy: commit push ## Commit and push all changes
	@echo "Deployment complete!"