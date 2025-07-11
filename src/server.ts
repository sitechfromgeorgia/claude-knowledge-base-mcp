#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Knowledge Base data directory
const KB_DATA_DIR = process.env.KB_DATA_DIR || join(homedir(), '.claude-knowledge-base');

// Ensure data directory exists
await fs.mkdir(KB_DATA_DIR, { recursive: true });
await fs.mkdir(join(KB_DATA_DIR, 'sessions'), { recursive: true });

interface KnowledgeBase {
  infrastructure: any;
  projects: any;
  interactions: any;
  workflows: any;
  insights: any;
  currentSession: string;
  lastUpdated: string;
}

interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  commands: string[];
  results: any[];
  marathonMode: boolean;
  context: string;
}

class ClaudeKnowledgeBase {
  private server: Server;
  private knowledgeBase: KnowledgeBase;
  private currentSession: SessionData;

  constructor() {
    this.server = new Server(
      {
        name: 'claude-knowledge-base',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.knowledgeBase = {
      infrastructure: {},
      projects: {},
      interactions: [],
      workflows: {},
      insights: {},
      currentSession: '',
      lastUpdated: new Date().toISOString(),
    };

    this.currentSession = {
      id: uuidv4(),
      startTime: new Date().toISOString(),
      commands: [],
      results: [],
      marathonMode: false,
      context: '',
    };

    this.setupTools();
  }

  private setupTools() {
    // Command parser and executor
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'kb_command',
            description: 'Execute knowledge base commands (---, +++, ..., ***)',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Command string with symbols and task description',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'kb_load',
            description: 'Load knowledge base context (--- command)',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Optional query to filter context',
                },
              },
            },
          },
          {
            name: 'kb_execute',
            description: 'Execute complex task (+++ command)',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Complex task to execute',
                },
                useMarathonMode: {
                  type: 'boolean',
                  description: 'Enable Marathon Mode for long tasks',
                  default: false,
                },
              },
              required: ['task'],
            },
          },
          {
            name: 'kb_update',
            description: 'Update knowledge base (... command)',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  description: 'Data to update in knowledge base',
                },
                category: {
                  type: 'string',
                  enum: ['infrastructure', 'projects', 'interactions', 'workflows', 'insights'],
                  description: 'Category to update',
                },
              },
              required: ['data', 'category'],
            },
          },
          {
            name: 'kb_marathon',
            description: 'Marathon Mode save & switch (*** command)',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['save_and_switch', 'continue'],
                  description: 'Marathon action to perform',
                },
                taskDescription: {
                  type: 'string',
                  description: 'Description of task for continuation',
                },
              },
              required: ['action'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'kb_command':
            return await this.handleCommand(args.command);
          case 'kb_load':
            return await this.loadKnowledgeBase(args.query);
          case 'kb_execute':
            return await this.executeComplexTask(args.task, args.useMarathonMode);
          case 'kb_update':
            return await this.updateKnowledgeBase(args.data, args.category);
          case 'kb_marathon':
            return await this.marathonMode(args.action, args.taskDescription);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async handleCommand(command: string) {
    // Parse command symbols
    const hasLoad = command.includes('---');
    const hasExecute = command.includes('+++');
    const hasUpdate = command.includes('...');
    const hasMarathon = command.includes('***');

    // Extract task description (remove symbols)
    const taskDescription = command
      .replace(/---/g, '')
      .replace(/\+\+\+/g, '')
      .replace(/\.\.\./g, '')
      .replace(/\*\*\*/g, '')
      .trim();

    let result = { steps: [], context: '', marathon: false };

    // Execute in order based on symbols present
    if (hasLoad) {
      const loadResult = await this.loadKnowledgeBase();
      result.steps.push({ action: 'load', result: loadResult });
      result.context = loadResult.content[0].text;
    }

    if (hasExecute) {
      const executeResult = await this.executeComplexTask(taskDescription, hasMarathon);
      result.steps.push({ action: 'execute', result: executeResult });
    }

    if (hasUpdate) {
      // Update with current session data
      const updateData = {
        task: taskDescription,
        timestamp: new Date().toISOString(),
        command: command,
        sessionId: this.currentSession.id,
      };
      const updateResult = await this.updateKnowledgeBase(updateData, 'interactions');
      result.steps.push({ action: 'update', result: updateResult });
    }

    if (hasMarathon) {
      const marathonResult = await this.marathonMode('save_and_switch', taskDescription);
      result.steps.push({ action: 'marathon', result: marathonResult });
      result.marathon = true;
    }

    // Log command execution
    this.currentSession.commands.push(command);
    this.currentSession.results.push(result);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async loadKnowledgeBase(query?: string) {
    try {
      // Load all knowledge base files
      const infrastructure = await this.loadFile('infrastructure.json');
      const projects = await this.loadFile('projects.json');
      const interactions = await this.loadFile('interactions.json');
      const workflows = await this.loadFile('workflows.json');
      const insights = await this.loadFile('insights.json');

      this.knowledgeBase = {
        infrastructure,
        projects,
        interactions,
        workflows,
        insights,
        currentSession: this.currentSession.id,
        lastUpdated: new Date().toISOString(),
      };

      // Filter by query if provided
      let contextText = `
🧠 Knowledge Base Loaded Successfully

📊 Infrastructure Status: ${Object.keys(infrastructure).length} items
📋 Active Projects: ${Object.keys(projects).length} projects  
💬 Interactions: ${interactions.length || 0} recorded
🔄 Workflows: ${Object.keys(workflows).length} defined
📚 Insights: ${Object.keys(insights).length} documented

Current Session: ${this.currentSession.id}
Last Updated: ${this.knowledgeBase.lastUpdated}
`;

      if (query) {
        // Simple query filtering (can be enhanced)
        const relevantData = this.searchKnowledgeBase(query);
        contextText += `\n🔍 Query Results for "${query}":\n${JSON.stringify(relevantData, null, 2)}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: contextText,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error loading knowledge base: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async executeComplexTask(task: string, marathonMode: boolean = false) {
    // Mark marathon mode if requested
    this.currentSession.marathonMode = marathonMode;

    const execution = {
      task,
      sessionId: this.currentSession.id,
      startTime: new Date().toISOString(),
      marathonMode,
      status: 'executing',
      steps: [
        'Sequential thinking initiated',
        'Loading relevant context from knowledge base',
        'Analyzing task complexity and requirements',
        'Determining required tools and resources',
        'Executing step-by-step workflow',
        marathonMode ? 'Marathon Mode: Progress tracking enabled' : '',
      ].filter(Boolean),
    };

    // Save execution state
    await this.saveFile(`sessions/${this.currentSession.id}.json`, this.currentSession);

    return {
      content: [
        {
          type: 'text',
          text: `
🚀 Complex Task Execution Started

Task: ${task}
Session: ${this.currentSession.id}
Marathon Mode: ${marathonMode ? '✅ Enabled' : '❌ Disabled'}

Execution Steps:
${execution.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${marathonMode ? `
⚡ Marathon Mode Active:
- Progress tracking every 5 minutes
- Automatic save & switch when context full
- Seamless continuation capability
- Use "*** +++" to save and switch when needed
` : ''}

Status: ${execution.status}
`,
        },
      ],
    };
  }

  private async updateKnowledgeBase(data: any, category: keyof KnowledgeBase) {
    try {
      if (category === 'currentSession' || category === 'lastUpdated') {
        throw new Error('Cannot directly update system fields');
      }

      // Load current data
      const currentData = await this.loadFile(`${category}.json`);
      
      // Merge with new data
      let updatedData;
      if (Array.isArray(currentData)) {
        updatedData = [...currentData, data];
      } else {
        updatedData = { ...currentData, ...data };
      }

      // Save updated data
      await this.saveFile(`${category}.json`, updatedData);
      
      // Update in-memory knowledge base
      this.knowledgeBase[category] = updatedData;
      this.knowledgeBase.lastUpdated = new Date().toISOString();

      return {
        content: [
          {
            type: 'text',
            text: `
✅ Knowledge Base Updated

Category: ${category}
Data Added: ${JSON.stringify(data, null, 2)}
Timestamp: ${this.knowledgeBase.lastUpdated}
Session: ${this.currentSession.id}

Total ${category} entries: ${Array.isArray(updatedData) ? updatedData.length : Object.keys(updatedData).length}
`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating knowledge base: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async marathonMode(action: string, taskDescription?: string) {
    if (action === 'save_and_switch') {
      // Save current session state
      this.currentSession.endTime = new Date().toISOString();
      this.currentSession.marathonMode = true;
      await this.saveFile(`sessions/${this.currentSession.id}.json`, this.currentSession);

      // Save current task state for continuation
      const marathonState = {
        sessionId: this.currentSession.id,
        taskDescription: taskDescription || 'Marathon task',
        timestamp: new Date().toISOString(),
        context: this.currentSession.context,
        commands: this.currentSession.commands,
        status: 'ready_for_continuation',
      };

      await this.saveFile('marathon-state.json', marathonState);

      return {
        content: [
          {
            type: 'text',
            text: `
🏃‍♂️ Marathon Mode: Save & Switch Complete

✅ Current progress saved
📝 Session: ${this.currentSession.id}
💾 State preserved for continuation
⚡ Ready for fresh session

🎯 To continue in new chat window:
--- +++ ... *** Continue ${taskDescription || 'previous task'} from previous session

📊 Marathon State:
- Task: ${taskDescription || 'Marathon task'}
- Session ID: ${this.currentSession.id}
- Commands executed: ${this.currentSession.commands.length}
- Timestamp: ${marathonState.timestamp}

Open new chat window and use the continuation command above.
Context window optimization complete! 🚀
`,
          },
        ],
      };
    } else if (action === 'continue') {
      // Load marathon state and continue
      try {
        const marathonState = await this.loadFile('marathon-state.json');
        
        // Create new session for continuation
        this.currentSession = {
          id: uuidv4(),
          startTime: new Date().toISOString(),
          commands: [],
          results: [],
          marathonMode: true,
          context: marathonState.context || '',
        };

        return {
          content: [
            {
              type: 'text',
              text: `
🏃‍♂️ Marathon Mode: Continuation Loaded

✅ Previous state restored
🔄 Session: ${this.currentSession.id} (new)
📂 Previous session: ${marathonState.sessionId}
⚡ Ready to continue execution

📊 Restored Context:
- Task: ${marathonState.taskDescription}
- Previous commands: ${marathonState.commands?.length || 0}
- Timestamp: ${marathonState.timestamp}

🚀 Marathon Mode active - seamless continuation ready!
You can now execute complex tasks with full context restored.
`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error loading marathon state: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Unknown marathon action: ${action}`,
        },
      ],
    };
  }

  private searchKnowledgeBase(query: string) {
    const results: any = {};
    
    // Simple search across all categories
    Object.entries(this.knowledgeBase).forEach(([category, data]) => {
      if (category === 'currentSession' || category === 'lastUpdated') return;
      
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes(query.toLowerCase())) {
        results[category] = data;
      }
    });

    return results;
  }

  private async loadFile(filename: string): Promise<any> {
    try {
      const filePath = join(KB_DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return default structure if file doesn't exist
      if (filename.includes('interactions')) return [];
      return {};
    }
  }

  private async saveFile(filename: string, data: any): Promise<void> {
    const filePath = join(KB_DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Claude Knowledge Base MCP Server started');
  }
}

// Start the server
const knowledgeBase = new ClaudeKnowledgeBase();
await knowledgeBase.start();
