# Local MCP Server Setup Guide

## Overview
MCP (Model Context Protocol) allows Claude to connect to external data sources and tools through a standardized protocol. This guide will help you set up a local MCP server that you can connect to Claude.

## Prerequisites
- Node.js (v16 or higher) or Python 3.8+
- npm or pip (depending on your chosen implementation)
- Basic understanding of REST APIs

## Option 1: Quick Start with MCP Server Template (Node.js)

### Step 1: Install MCP SDK
```bash
npm install -g @modelcontextprotocol/sdk
```

### Step 2: Create a Basic MCP Server
Create a new directory for your MCP server:
```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk express
```

### Step 3: Create the Server File
Create `server.js`:
```javascript
const { MCPServer } = require('@modelcontextprotocol/sdk');
const express = require('express');

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize MCP Server
const mcpServer = new MCPServer({
  name: 'My Local MCP Server',
  version: '1.0.0',
  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  }
});

// Define a simple tool
mcpServer.addTool({
  name: 'get_current_time',
  description: 'Get the current time',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async () => {
    return {
      result: new Date().toISOString()
    };
  }
});

// Define a resource
mcpServer.addResource({
  name: 'local_data',
  description: 'Access local data',
  handler: async () => {
    return {
      content: 'This is data from your local MCP server'
    };
  }
});

// Set up Express routes
app.post('/mcp', async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running at http://localhost:${PORT}/mcp`);
});
```

### Step 4: Run the Server
```bash
node server.js
```

Your MCP server is now running at `http://localhost:3000/mcp`

## Option 2: Python Implementation

### Step 1: Install Dependencies
```bash
pip install fastapi uvicorn pydantic
```

### Step 2: Create Python MCP Server
Create `mcp_server.py`:
```python
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import datetime

app = FastAPI()

class MCPRequest(BaseModel):
    method: str
    params: Optional[Dict[str, Any]] = None

class MCPResponse(BaseModel):
    result: Any
    error: Optional[str] = None

# Server capabilities
CAPABILITIES = {
    "tools": [
        {
            "name": "get_current_time",
            "description": "Get the current time",
            "inputSchema": {
                "type": "object",
                "properties": {},
                "required": []
            }
        },
        {
            "name": "calculate",
            "description": "Perform basic calculations",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Mathematical expression to evaluate"
                    }
                },
                "required": ["expression"]
            }
        }
    ],
    "resources": [
        {
            "name": "local_data",
            "description": "Access local data store"
        }
    ]
}

@app.post("/mcp")
async def handle_mcp_request(request: MCPRequest):
    method = request.method
    params = request.params or {}
    
    if method == "initialize":
        return MCPResponse(result={
            "capabilities": CAPABILITIES,
            "serverInfo": {
                "name": "Local Python MCP Server",
                "version": "1.0.0"
            }
        })
    
    elif method == "tools/call":
        tool_name = params.get("name")
        tool_params = params.get("arguments", {})
        
        if tool_name == "get_current_time":
            return MCPResponse(result={
                "output": datetime.datetime.now().isoformat()
            })
        
        elif tool_name == "calculate":
            try:
                # Note: eval() is used here for simplicity but should be replaced
                # with a proper expression parser in production
                result = eval(tool_params.get("expression", "0"))
                return MCPResponse(result={"output": str(result)})
            except Exception as e:
                return MCPResponse(error=str(e))
    
    elif method == "resources/read":
        resource_name = params.get("name")
        if resource_name == "local_data":
            return MCPResponse(result={
                "content": "This is local data from your Python MCP server"
            })
    
    return MCPResponse(error=f"Unknown method: {method}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
```

### Step 3: Run Python Server
```bash
python mcp_server.py
```

## Connecting to Claude

Once your local MCP server is running:

1. **Name**: Enter a descriptive name for your connector (e.g., "Local Development MCP")

2. **Remote MCP server URL**: Enter your local server URL:
   - For local development: `http://localhost:3000/mcp`
   - For network access: `http://[your-ip]:3000/mcp`

3. **Advanced Settings** (if needed):
   - Authentication tokens
   - Custom headers
   - Timeout settings

## Testing Your Connection

After adding the connector:
1. Click "Add" to save the connector
2. Claude should now be able to access your local MCP server
3. You can test by asking Claude to use the tools or resources you've defined

## Common Issues and Solutions

### Connection Refused
- Ensure your server is running
- Check firewall settings
- Verify the URL is correct

### CORS Issues
Add CORS headers to your server:

**Node.js:**
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

**Python:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Local Network Access
If you need to access from another device:
- Use your machine's IP address instead of localhost
- Ensure the port is not blocked by firewall

## Next Steps

1. **Add More Tools**: Extend your server with custom tools for your specific needs
2. **Connect to Databases**: Add database connections to provide real data
3. **Implement Authentication**: Add security for production use
4. **Add Logging**: Implement proper logging for debugging
5. **Create Custom Resources**: Add file access, API integrations, etc.

## Example Use Cases

- **Development Tools**: Code execution, file manipulation, git operations
- **Data Analysis**: Connect to local databases, run analytics
- **System Integration**: Access local services, APIs, or hardware
- **Custom Workflows**: Automate tasks specific to your needs

## Security Considerations

⚠️ **Important**: When running a local MCP server:
- Never expose it to the public internet without proper authentication
- Validate all inputs to prevent code injection
- Limit tool capabilities based on your security requirements
- Use HTTPS in production environments
