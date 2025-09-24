# MCP Server for Claude Desktop

A Model Context Protocol (MCP) server implementation that enables Claude Desktop to interact with local tools and storage.

## Features

- **Stdio-based communication** for Claude Desktop integration
- **HTTP/HTTPS servers** for testing and development
- **Built-in tools**: 
  - `add_note` - Store notes locally
  - `get_notes` - Retrieve all stored notes
  - `clear_notes` - Clear all notes
- **Easy extension** - Add custom tools by modifying the server

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm
- Claude Desktop application

### Installation

1. Clone the repository:
```bash
git clone https://github.com/intelligent-staffing-systems/mcp-server.git
cd mcp-server
```

2. Install dependencies:
```bash
make install
# or manually: npm install
```

3. Configure Claude Desktop:
```bash
make config
# This updates ~/Library/Application Support/Claude/claude_desktop_config.json
```

4. Restart Claude Desktop to load the MCP server

## Usage

### With Claude Desktop

Once configured, the MCP server automatically starts when Claude Desktop launches. You can interact with it by asking Claude to:
- "Add a note saying 'Hello World'"
- "Show me all my notes"
- "Clear all notes"

### Development & Testing

#### Test the stdio server:
```bash
make test
```

#### Run HTTP development server:
```bash
make dev
# Server runs at http://localhost:3000/mcp
```

#### Run HTTPS server:
```bash
make https
# Generates self-signed certificates and runs at https://localhost:3443/mcp
```

#### Create HTTPS tunnel (for remote access):
```bash
make tunnel
# Creates a public HTTPS URL using localtunnel
```

## Project Structure

```
mcp-server/
├── stdio-mcp-server.js    # Main MCP server for Claude Desktop
├── simple-mcp-server.js   # HTTP server for testing
├── https-mcp-server.js    # HTTPS server with SSL
├── package.json           # Node.js dependencies
├── Makefile              # Automation commands
├── CLAUDE.md             # Instructions for Claude AI
├── README.md             # This file
└── certs/                # SSL certificates (generated)
```

## Configuration

The MCP server is configured in Claude Desktop's config file:
```json
{
  "mcpServers": {
    "local-mcp-server": {
      "command": "node",
      "args": ["/path/to/stdio-mcp-server.js"],
      "cwd": "/path/to/mcp-server"
    }
  }
}
```

## Adding Custom Tools

Edit `stdio-mcp-server.js` to add new tools:

1. Add tool definition in the `tools/list` case:
```javascript
{
  name: 'my_tool',
  description: 'Description of my tool',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    }
  }
}
```

2. Implement handler in the `tools/call` case:
```javascript
if (toolName === 'my_tool') {
  // Your tool logic here
  sendResponse(id, {
    content: [{
      type: 'text',
      text: 'Tool response'
    }]
  });
}
```

## Troubleshooting

### Server shows as disconnected
- Check logs: `make logs`
- Verify protocol version matches Claude's requirements
- Ensure all required methods are implemented

### Permission issues
- Make script executable: `chmod +x stdio-mcp-server.js`
- Check file paths in configuration

### SSL certificate errors
- Accept self-signed certificate in browser
- Or use `make tunnel` for valid HTTPS

## Development

### Available Make Commands

```bash
make help       # Show all available commands
make install    # Install dependencies
make test       # Test the MCP server
make dev        # Start HTTP development server
make https      # Start HTTPS server
make tunnel     # Create public HTTPS tunnel
make config     # Update Claude Desktop configuration
make logs       # Show MCP server logs
make clean      # Clean generated files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub or check the [MCP documentation](https://modelcontextprotocol.io/docs).

## Acknowledgments

Built using the [Model Context Protocol](https://modelcontextprotocol.io/) specification by Anthropic.