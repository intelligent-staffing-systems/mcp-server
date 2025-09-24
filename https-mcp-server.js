const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
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
              name: 'Local MCP Dev Server (HTTPS)',
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

// Generate self-signed certificate if it doesn't exist
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

// Start HTTPS server
const PORT = process.env.PORT || 3443;

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('⚠️  SSL certificates not found. Generating self-signed certificates...');
  console.log('Run the following command to generate certificates:');
  console.log(`
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
`);
  console.log('\nThen restart the server with: node https-mcp-server.js');
  process.exit(1);
} else {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`
🔐 HTTPS MCP Server is running!
   
   URL: https://localhost:${PORT}/mcp
   Health Check: https://localhost:${PORT}/health
   
   To connect to Claude:
   1. Enter "Local MCP Server" as the Name
   2. Enter "https://localhost:${PORT}/mcp" as the Remote MCP server URL
   3. Click "Add"
   
   Note: You may need to accept the self-signed certificate in your browser first.
   Visit https://localhost:${PORT}/health to do this.
   
   Available tools:
   - add_note: Add a note to local storage
   - get_notes: Retrieve all notes
   - system_info: Get system information
  `);
  });
}