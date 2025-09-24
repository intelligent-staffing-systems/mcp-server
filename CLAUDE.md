# Claude Development Instructions

This document provides instructions for Claude to work with this MCP server project.

## Available Make Commands

When working on this project, use the Makefile for common tasks:

- `make install` - Install dependencies
- `make test` - Test the MCP server
- `make dev` - Start the development server (HTTP)
- `make https` - Start the HTTPS server
- `make tunnel` - Create a localtunnel for HTTPS access
- `make config` - Update Claude Desktop configuration
- `make logs` - Show MCP server logs
- `make clean` - Clean up generated files and certificates
- `make help` - Show all available commands

## Development Workflow

1. **Making Changes**: Edit `stdio-mcp-server.js` for stdio-based MCP or `simple-mcp-server.js` for HTTP-based testing
2. **Testing**: Run `make test` to verify the server responds correctly
3. **Deployment**: Run `make config` to update Claude Desktop configuration
4. **Debugging**: Run `make logs` to check server logs

## Adding New Tools

To add new tools to the MCP server:

1. Add tool definition in `tools/list` method
2. Implement tool handler in `tools/call` method
3. Test with `make test`
4. Restart Claude Desktop to load changes

## Project Structure

```
mcp-server/
├── stdio-mcp-server.js    # Main MCP server (stdio communication)
├── simple-mcp-server.js   # HTTP-based MCP server (for testing)
├── https-mcp-server.js    # HTTPS-based MCP server
├── package.json           # Node.js dependencies
├── Makefile              # Automation commands
├── CLAUDE.md             # This file
├── README.md             # User documentation
└── certs/                # SSL certificates (generated)
```

## Common Issues

- If Claude Desktop shows "disconnected", check logs with `make logs`
- Protocol version mismatches require updating the `protocolVersion` field
- Always handle `notifications/initialized`, `prompts/list`, and `resources/list` methods

## Testing Commands

Test the stdio server directly:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node stdio-mcp-server.js
```