const express = require('express');
const app = express();
app.use(express.json());

// Add CORS headers for browser access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Simple in-memory data store
let dataStore = {
  notes: [],
  tasks: []
};

// MCP endpoint
app.post('/mcp', async (req, res) => {
  const { method, params = {} } = req.body;
  
  console.log(`Received MCP request: ${method}`, params);
  
  try {
    // Handle different MCP methods
    switch (method) {
      case 'initialize':
        res.json({
          result: {
            capabilities: {
              tools: [
                {
                  name: 'add_note',
                  description: 'Add a note to local storage',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      content: { type: 'string', description: 'Note content' }
                    },
                    required: ['content']
                  }
                },
                {
                  name: 'get_notes',
                  description: 'Get all stored notes',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                  }
                },
                {
                  name: 'system_info',
                  description: 'Get system information',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                  }
                }
              ],
              resources: [
                {
                  name: 'local_data',
                  description: 'Access local data store'
                }
              ]
            },
            serverInfo: {
              name: 'Local MCP Dev Server',
              version: '1.0.0'
            }
          }
        });
        break;
      
      case 'tools/call':
        const toolName = params.name;
        const toolArgs = params.arguments || {};
        
        if (toolName === 'add_note') {
          const note = {
            id: Date.now(),
            content: toolArgs.content,
            timestamp: new Date().toISOString()
          };
          dataStore.notes.push(note);
          res.json({
            result: {
              output: `Note added successfully with ID: ${note.id}`
            }
          });
        } else if (toolName === 'get_notes') {
          res.json({
            result: {
              output: JSON.stringify(dataStore.notes, null, 2)
            }
          });
        } else if (toolName === 'system_info') {
          res.json({
            result: {
              output: JSON.stringify({
                platform: process.platform,
                nodeVersion: process.version,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          });
        } else {
          res.status(400).json({
            error: `Unknown tool: ${toolName}`
          });
        }
        break;
      
      case 'resources/read':
        const resourceName = params.name;
        if (resourceName === 'local_data') {
          res.json({
            result: {
              content: JSON.stringify(dataStore, null, 2)
            }
          });
        } else {
          res.status(400).json({
            error: `Unknown resource: ${resourceName}`
          });
        }
        break;
      
      default:
        res.status(400).json({
          error: `Unknown method: ${method}`
        });
    }
  } catch (error) {
    console.error('Error handling MCP request:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 MCP Server is running!
   
   URL: http://localhost:${PORT}/mcp
   Health Check: http://localhost:${PORT}/health
   
   To connect to Claude:
   1. Enter "Local MCP Server" as the Name
   2. Enter "http://localhost:${PORT}/mcp" as the Remote MCP server URL
   3. Click "Add"
   
   Available tools:
   - add_note: Add a note to local storage
   - get_notes: Retrieve all notes
   - system_info: Get system information
  `);
});
