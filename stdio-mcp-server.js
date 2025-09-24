#!/usr/bin/env node

// Simple stdio-based MCP server for Claude Desktop
const readline = require('readline');

// In-memory storage
let notes = [];

// Create interface for stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Send JSON-RPC response
function sendResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: '2.0',
    id: id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  console.log(JSON.stringify(response));
}

// Handle incoming messages
rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    const { id, method, params = {} } = request;
    
    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'Local MCP Server',
            version: '1.0.0'
          }
        });
        break;
        
      case 'tools/list':
        sendResponse(id, {
          tools: [
            {
              name: 'add_note',
              description: 'Add a note to local storage',
              inputSchema: {
                type: 'object',
                properties: {
                  content: { 
                    type: 'string', 
                    description: 'The note content to add' 
                  }
                },
                required: ['content']
              }
            },
            {
              name: 'get_notes',
              description: 'Get all stored notes',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'clear_notes',
              description: 'Clear all notes',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        });
        break;
        
      case 'tools/call':
        const toolName = params.name;
        const args = params.arguments || {};
        
        if (toolName === 'add_note') {
          const note = {
            id: Date.now(),
            content: args.content,
            timestamp: new Date().toISOString()
          };
          notes.push(note);
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `Note added with ID: ${note.id}`
            }]
          });
        } else if (toolName === 'get_notes') {
          sendResponse(id, {
            content: [{
              type: 'text',
              text: notes.length > 0 
                ? JSON.stringify(notes, null, 2)
                : 'No notes stored yet'
            }]
          });
        } else if (toolName === 'clear_notes') {
          const count = notes.length;
          notes = [];
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `Cleared ${count} notes`
            }]
          });
        } else {
          sendResponse(id, null, {
            code: -32601,
            message: `Unknown tool: ${toolName}`
          });
        }
        break;
        
      case 'notifications/initialized':
        // No response needed for notifications
        break;
        
      case 'prompts/list':
        sendResponse(id, { prompts: [] });
        break;
        
      case 'resources/list':
        sendResponse(id, { resources: [] });
        break;
        
      default:
        sendResponse(id, null, {
          code: -32601,
          message: `Method not found: ${method}`
        });
    }
  } catch (error) {
    // Log errors to stderr to avoid interfering with JSON-RPC
    process.stderr.write(`Error: ${error.message}\n`);
  }
});

// Log startup to stderr
process.stderr.write('MCP Server started via stdio\n');