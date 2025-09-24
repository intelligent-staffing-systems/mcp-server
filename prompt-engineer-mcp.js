#!/usr/bin/env node

// MCP Server for Claude Desktop to act as Prompt Engineer for Claude Code
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

// File paths for communication
const PROMPTS_DIR = path.join(os.homedir(), '.claude-prompts');
const CURRENT_PROMPT_FILE = path.join(PROMPTS_DIR, 'current_prompt.md');
const TASK_LIST_FILE = path.join(PROMPTS_DIR, 'task_list.json');
const RESULTS_FILE = path.join(PROMPTS_DIR, 'results.md');
const STATUS_FILE = path.join(PROMPTS_DIR, 'status.json');

// Ensure directory exists
if (!fs.existsSync(PROMPTS_DIR)) {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(TASK_LIST_FILE)) {
  fs.writeFileSync(TASK_LIST_FILE, JSON.stringify({ tasks: [] }, null, 2));
}
if (!fs.existsSync(STATUS_FILE)) {
  fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: 'idle', lastUpdate: new Date().toISOString() }, null, 2));
}

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
            name: 'Prompt Engineer MCP',
            version: '1.0.0'
          }
        });
        break;
        
      case 'tools/list':
        sendResponse(id, {
          tools: [
            {
              name: 'write_prompt',
              description: 'Write a prompt/instruction for Claude Code to execute',
              inputSchema: {
                type: 'object',
                properties: {
                  prompt: { 
                    type: 'string', 
                    description: 'The detailed prompt/instruction for Claude Code' 
                  },
                  priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'urgent'],
                    description: 'Priority level of the task'
                  }
                },
                required: ['prompt']
              }
            },
            {
              name: 'add_task',
              description: 'Add a task to the task list for Claude Code',
              inputSchema: {
                type: 'object',
                properties: {
                  task: { 
                    type: 'string', 
                    description: 'Task description' 
                  },
                  category: {
                    type: 'string',
                    description: 'Task category (e.g., development, testing, documentation)'
                  },
                  dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of task IDs this task depends on'
                  }
                },
                required: ['task']
              }
            },
            {
              name: 'view_tasks',
              description: 'View all tasks in the task list',
              inputSchema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['all', 'pending', 'in_progress', 'completed', 'blocked'],
                    description: 'Filter tasks by status'
                  }
                }
              }
            },
            {
              name: 'update_task_status',
              description: 'Update the status of a task',
              inputSchema: {
                type: 'object',
                properties: {
                  task_id: { 
                    type: 'string', 
                    description: 'Task ID to update' 
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'completed', 'blocked'],
                    description: 'New status for the task'
                  },
                  notes: {
                    type: 'string',
                    description: 'Optional notes about the status update'
                  }
                },
                required: ['task_id', 'status']
              }
            },
            {
              name: 'check_results',
              description: 'Check the results/output from Claude Code',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'check_status',
              description: 'Check current working status of Claude Code',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'create_project_plan',
              description: 'Create a comprehensive project plan for Claude Code to follow',
              inputSchema: {
                type: 'object',
                properties: {
                  project_name: {
                    type: 'string',
                    description: 'Name of the project'
                  },
                  objectives: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of project objectives'
                  },
                  milestones: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key milestones'
                  },
                  tech_stack: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Technologies to use'
                  }
                },
                required: ['project_name', 'objectives']
              }
            },
            {
              name: 'clear_all',
              description: 'Clear all prompts, tasks, and results',
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
        
        if (toolName === 'write_prompt') {
          const promptContent = `# Claude Code Instructions
          
**Priority**: ${args.priority || 'medium'}
**Created**: ${new Date().toISOString()}
**Created by**: Claude Desktop (Prompt Engineer)

## Task Instructions

${args.prompt}

---

*This prompt was created by Claude Desktop acting as your prompt engineer. Please execute these instructions and write the results to ~/.claude-prompts/results.md*`;
          
          fs.writeFileSync(CURRENT_PROMPT_FILE, promptContent);
          
          // Update status
          const status = { 
            status: 'new_prompt_available', 
            lastUpdate: new Date().toISOString(),
            priority: args.priority || 'medium'
          };
          fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `Prompt written to ${CURRENT_PROMPT_FILE}\n\nClaude Code should read this file and execute the instructions.`
            }]
          });
          
        } else if (toolName === 'add_task') {
          const tasks = JSON.parse(fs.readFileSync(TASK_LIST_FILE, 'utf8'));
          const newTask = {
            id: `task_${Date.now()}`,
            description: args.task,
            category: args.category || 'general',
            dependencies: args.dependencies || [],
            status: 'pending',
            created: new Date().toISOString()
          };
          tasks.tasks.push(newTask);
          fs.writeFileSync(TASK_LIST_FILE, JSON.stringify(tasks, null, 2));
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `Task added with ID: ${newTask.id}\nTotal tasks: ${tasks.tasks.length}`
            }]
          });
          
        } else if (toolName === 'view_tasks') {
          const tasks = JSON.parse(fs.readFileSync(TASK_LIST_FILE, 'utf8'));
          const statusFilter = args.status || 'all';
          
          let filteredTasks = tasks.tasks;
          if (statusFilter !== 'all') {
            filteredTasks = tasks.tasks.filter(t => t.status === statusFilter);
          }
          
          const taskList = filteredTasks.map(t => 
            `[${t.status}] ${t.id}: ${t.description} (${t.category})`
          ).join('\n');
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: taskList || 'No tasks found'
            }]
          });
          
        } else if (toolName === 'update_task_status') {
          const tasks = JSON.parse(fs.readFileSync(TASK_LIST_FILE, 'utf8'));
          const taskIndex = tasks.tasks.findIndex(t => t.id === args.task_id);
          
          if (taskIndex >= 0) {
            tasks.tasks[taskIndex].status = args.status;
            tasks.tasks[taskIndex].lastUpdate = new Date().toISOString();
            if (args.notes) {
              tasks.tasks[taskIndex].notes = args.notes;
            }
            fs.writeFileSync(TASK_LIST_FILE, JSON.stringify(tasks, null, 2));
            
            sendResponse(id, {
              content: [{
                type: 'text',
                text: `Task ${args.task_id} updated to status: ${args.status}`
              }]
            });
          } else {
            sendResponse(id, {
              content: [{
                type: 'text',
                text: `Task ${args.task_id} not found`
              }]
            });
          }
          
        } else if (toolName === 'check_results') {
          let results = 'No results file found yet.';
          if (fs.existsSync(RESULTS_FILE)) {
            results = fs.readFileSync(RESULTS_FILE, 'utf8');
          }
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: results
            }]
          });
          
        } else if (toolName === 'check_status') {
          const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: JSON.stringify(status, null, 2)
            }]
          });
          
        } else if (toolName === 'create_project_plan') {
          const plan = {
            project_name: args.project_name,
            objectives: args.objectives,
            milestones: args.milestones || [],
            tech_stack: args.tech_stack || [],
            created: new Date().toISOString(),
            tasks: []
          };
          
          // Auto-generate tasks based on objectives
          args.objectives.forEach((objective, i) => {
            plan.tasks.push({
              id: `task_${Date.now()}_${i}`,
              description: objective,
              category: 'objective',
              status: 'pending',
              priority: 'high'
            });
          });
          
          // Save the plan
          const planFile = path.join(PROMPTS_DIR, `project_${args.project_name.replace(/\s+/g, '_')}.json`);
          fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
          
          // Also update task list
          const tasks = JSON.parse(fs.readFileSync(TASK_LIST_FILE, 'utf8'));
          tasks.tasks.push(...plan.tasks);
          fs.writeFileSync(TASK_LIST_FILE, JSON.stringify(tasks, null, 2));
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: `Project plan created: ${planFile}\nGenerated ${plan.tasks.length} tasks from objectives`
            }]
          });
          
        } else if (toolName === 'clear_all') {
          // Clear all files
          if (fs.existsSync(CURRENT_PROMPT_FILE)) fs.unlinkSync(CURRENT_PROMPT_FILE);
          if (fs.existsSync(RESULTS_FILE)) fs.unlinkSync(RESULTS_FILE);
          fs.writeFileSync(TASK_LIST_FILE, JSON.stringify({ tasks: [] }, null, 2));
          fs.writeFileSync(STATUS_FILE, JSON.stringify({ status: 'idle', lastUpdate: new Date().toISOString() }, null, 2));
          
          sendResponse(id, {
            content: [{
              type: 'text',
              text: 'All prompts, tasks, and results cleared'
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
    process.stderr.write(`Error: ${error.message}\n`);
  }
});

// Log startup
process.stderr.write('Prompt Engineer MCP Server started via stdio\n');
process.stderr.write(`Prompt directory: ${PROMPTS_DIR}\n`);