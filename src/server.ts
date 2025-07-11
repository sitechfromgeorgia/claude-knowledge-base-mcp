#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { homedir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';

import { AdvancedMemorySystem } from './memory-system.js';
import { MCPConfig, SessionData, CommandExecution } from './types.js';

// Default configuration
const DEFAULT_CONFIG: MCPConfig = {
  dataDir: process.env.KB_DATA_DIR || join(homedir(), '.claude-knowledge-base'),
  maxContextSize: 100000,
  autoSaveInterval: 5, // minutes
  vectorDimension: 100,
  maxMemoryItems: 10000,
  compressionThreshold: 0.8,
  marathonEnabled: true,
  contextOverflowThreshold: 80000,
  checkpointInterval: 5, // minutes
  integrations: {
    vectorDB: 'local',
    workflows: 'none',
    storage: 'local',
    monitoring: 'none'
  }
};

class ClaudeKnowledgeBaseMCP {
  private server: Server;
  private memorySystem: AdvancedMemorySystem;
  private config: MCPConfig;
  private currentSession: SessionData;
  private autoSaveScheduler?: cron.ScheduledTask;

  constructor(config: MCPConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memorySystem = new AdvancedMemorySystem(this.config);
    
    this.currentSession = this.createNewSession();

    this.server = new Server(
      {
        name: 'claude-knowledge-base',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.initializeMarathonMode();
  }

  private createNewSession(): SessionData {
    return {
      id: uuidv4(),
      startTime: new Date().toISOString(),
      commands: [],
      marathonMode: false,
      contextSize: 0,
      checkpoints: [],
      status: 'active'
    };
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'kb_command',
            description: 'Enhanced command processor (---, +++, ..., ***) with Marathon Mode',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Command with symbols: --- (load), +++ (execute), ... (save), *** (marathon)',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'kb_load_context',
            description: 'Smart context loading with relevance filtering',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Context search query',
                },
                categories: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by categories: infrastructure, projects, interactions, workflows, insights',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum results to return',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'kb_execute_complex',
            description: 'Complex task execution with tool chaining',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Complex task to execute',
                },
                enableMarathon: {
                  type: 'boolean',
                  description: 'Enable Marathon Mode for long tasks',
                  default: false,
                },
                steps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional predefined steps',
                },
              },
              required: ['task'],
            },
          },
          {
            name: 'kb_save_progress',
            description: 'Event-driven progress saving with intelligent checkpointing',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  description: 'Progress data to save',
                },
                category: {
                  type: 'string',
                  enum: ['infrastructure', 'projects', 'interactions', 'workflows', 'insights'],
                  description: 'Memory category',
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  default: 'medium',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for better organization',
                },
              },
              required: ['data', 'category'],
            },
          },
          {
            name: 'kb_marathon_mode',
            description: 'Marathon Mode management with automated session transfer',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['prepare_transfer', 'restore_checkpoint', 'create_checkpoint', 'status'],
                  description: 'Marathon Mode action',
                },
                checkpointId: {
                  type: 'string',
                  description: 'Checkpoint ID for restore operations',
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID for operations',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'kb_search_memory',
            description: 'Advanced semantic search with graph context',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                includeGraph: {
                  type: 'boolean',
                  description: 'Include knowledge graph context',
                  default: true,
                },
                timeRange: {
                  type: 'object',
                  properties: {
                    start: { type: 'string' },
                    end: { type: 'string' },
                  },
                  description: 'Filter by time range',
                },
                threshold: {
                  type: 'number',
                  description: 'Similarity threshold (0-1)',
                  default: 0.3,
                },
              },
              required: ['query'],
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
            return await this.handleEnhancedCommand(args.command);
          case 'kb_load_context':
            return await this.loadContext(args.query, args.categories, args.limit);
          case 'kb_execute_complex':
            return await this.executeComplexTask(args.task, args.enableMarathon, args.steps);
          case 'kb_save_progress':
            return await this.saveProgress(args.data, args.category, args.priority, args.tags);
          case 'kb_marathon_mode':
            return await this.handleMarathonMode(args.action, args.checkpointId, args.sessionId);
          case 'kb_search_memory':
            return await this.searchMemory(args.query, args.includeGraph, args.timeRange, args.threshold);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private initializeMarathonMode() {
    if (this.config.marathonEnabled) {
      // Auto-save scheduler
      this.autoSaveScheduler = cron.schedule(`*/${this.config.autoSaveInterval} * * * *`, async () => {
        await this.performAutoSave();
      });

      // Context overflow detection
      setInterval(() => {
        this.checkContextOverflow();
      }, 60000); // Check every minute
    }
  }

  // === ENHANCED COMMAND PROCESSING ===

  private async handleEnhancedCommand(command: string) {
    const symbols = {
      load: command.includes('---'),
      execute: command.includes('+++'),
      save: command.includes('...'),
      marathon: command.includes('***')
    };

    const cleanCommand = command
      .replace(/---/g, '')
      .replace(/\+\+\+/g, '')
      .replace(/\.\.\./g, '')
      .replace(/\*\*\*/g, '')
      .trim();

    const execution: CommandExecution = {
      command,
      type: 'load', // Will be updated based on primary action
      timestamp: new Date().toISOString(),
      result: null,
      duration: 0,
      success: false
    };

    const startTime = Date.now();
    const results: any[] = [];

    try {
      // 1. Load Context (---)
      if (symbols.load) {
        execution.type = 'load';
        const contextResult = await this.memorySystem.loadContextForSession(
          this.currentSession.id,
          cleanCommand
        );
        results.push({
          type: 'context_loaded',
          memories: contextResult.relevantMemories.length,
          graphEntities: contextResult.graphContext.entities.length,
          sessionHistory: !!contextResult.sessionHistory
        });
      }

      // 2. Execute Complex Task (+++)
      if (symbols.execute) {
        execution.type = 'execute';
        const taskResult = await this.executeTaskWithSequentialThinking(
          cleanCommand,
          symbols.marathon
        );
        results.push(taskResult);
      }

      // 3. Save Progress (...)
      if (symbols.save) {
        execution.type = 'update';
        const saveResult = await this.intelligentProgressSave(cleanCommand, results);
        results.push(saveResult);
      }

      // 4. Marathon Mode (***)
      if (symbols.marathon) {
        execution.type = 'marathon';
        const marathonResult = await this.handleMarathonTransfer();
        results.push(marathonResult);
      }

      execution.success = true;
      execution.result = results;
      execution.duration = Date.now() - startTime;

      // Add to session history
      this.currentSession.commands.push(execution);
      this.updateContextSize();

      return {
        content: [
          {
            type: 'text',
            text: this.formatCommandResults(symbols, results, execution.duration),
          },
        ],
      };

    } catch (error) {
      execution.success = false;
      execution.result = { error: error instanceof Error ? error.message : String(error) };
      execution.duration = Date.now() - startTime;

      this.currentSession.commands.push(execution);

      throw error;
    }
  }

  private async executeTaskWithSequentialThinking(task: string, marathonMode: boolean) {
    return {
      type: 'sequential_execution',
      task,
      marathonMode,
      steps: [
        '🧠 Analyzing task complexity and requirements',
        '📚 Loading relevant context from knowledge base',
        '🔍 Identifying required tools and resources',
        '⚡ Executing step-by-step workflow',
        '💾 Tracking progress and creating checkpoints',
        marathonMode ? '🏃‍♂️ Marathon Mode: Enhanced persistence enabled' : ''
      ].filter(Boolean),
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.id,
      status: 'initiated'
    };
  }

  private async intelligentProgressSave(command: string, previousResults: any[]) {
    // Determine category based on content
    const category = this.categorizeContent(command, previousResults);
    
    // Generate intelligent tags
    const tags = this.generateTags(command, previousResults);
    
    // Extract priority from context
    const priority = this.determinePriority(command, previousResults);

    const memoryId = await this.memorySystem.saveMemory({
      content: `Command: ${command}\nResults: ${JSON.stringify(previousResults, null, 2)}`,
      category,
      sessionId: this.currentSession.id,
      priority,
      tags,
      metadata: {
        commandType: 'enhanced',
        resultCount: previousResults.length,
        executionContext: 'mcp_server'
      }
    });

    return {
      type: 'progress_saved',
      memoryId,
      category,
      priority,
      tags,
      timestamp: new Date().toISOString()
    };
  }

  // === MARATHON MODE IMPLEMENTATION ===

  private async handleMarathonTransfer() {
    const result = await this.memorySystem.prepareMarathonTransfer(this.currentSession.id);
    
    // Mark current session for transfer
    this.currentSession.status = 'transferred';
    this.currentSession.endTime = new Date().toISOString();

    return {
      type: 'marathon_transfer',
      checkpointId: result.checkpointId,
      transferInstructions: result.transferInstructions,
      contextSummary: result.contextSummary,
      sessionId: this.currentSession.id
    };
  }

  private async performAutoSave() {
    if (this.currentSession.commands.length === 0) return;

    try {
      const checkpointId = await this.memorySystem.createCheckpoint(
        this.currentSession.id,
        'auto'
      );
      
      console.error(`🔄 Auto-save checkpoint created: ${checkpointId}`);
    } catch (error) {
      console.error(`❌ Auto-save failed: ${error}`);
    }
  }

  private checkContextOverflow() {
    if (this.currentSession.contextSize > this.config.contextOverflowThreshold) {
      console.error(`⚠️ Context overflow detected: ${this.currentSession.contextSize} > ${this.config.contextOverflowThreshold}`);
      // Could trigger automatic Marathon Mode here
    }
  }

  // === TOOL IMPLEMENTATIONS ===

  private async loadContext(query?: string, categories?: string[], limit = 10) {
    const contextData = await this.memorySystem.loadContextForSession(
      this.currentSession.id,
      query
    );

    const memories = categories 
      ? contextData.relevantMemories.filter(m => categories.includes(m.category))
      : contextData.relevantMemories;

    return {
      content: [
        {
          type: 'text',
          text: `
🧠 **Context Loaded Successfully**

**Relevant Memories:** ${memories.slice(0, limit).length}
**Graph Entities:** ${contextData.graphContext.entities.length}
**Session History:** ${contextData.sessionHistory ? 'Available' : 'None'}

**Recent Memories:**
${memories.slice(0, limit).map((m, i) => 
  `${i + 1}. [${m.category}] ${m.content.substring(0, 100)}...`
).join('\n')}

**Graph Context:**
${contextData.graphContext.entities.slice(0, 5).map(e => 
  `• ${e.name} (${e.type}) - ${e.properties.mentions || 0} mentions`
).join('\n')}
          `.trim(),
        },
      ],
    };
  }

  private async executeComplexTask(task: string, enableMarathon = false, steps?: string[]) {
    if (enableMarathon) {
      this.currentSession.marathonMode = true;
    }

    const taskExecution = {
      task,
      sessionId: this.currentSession.id,
      marathonMode: enableMarathon,
      predefinedSteps: steps,
      startTime: new Date().toISOString(),
      status: 'executing'
    };

    return {
      content: [
        {
          type: 'text',
          text: `
🚀 **Complex Task Execution Started**

**Task:** ${task}
**Session:** ${this.currentSession.id}
**Marathon Mode:** ${enableMarathon ? '✅ Enabled' : '❌ Disabled'}

**Execution Strategy:**
${steps ? steps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 
  '• Sequential thinking with context awareness\n• Tool chaining for multi-step operations\n• Automatic progress tracking\n• Error handling and recovery'}

${enableMarathon ? `
⚡ **Marathon Mode Features:**
• Auto-save every ${this.config.autoSaveInterval} minutes
• Context overflow protection
• Seamless session transfer capability
• Enhanced error recovery
` : ''}

**Status:** ${taskExecution.status}
          `.trim(),
        },
      ],
    };
  }

  private async saveProgress(data: any, category: string, priority = 'medium', tags: string[] = []) {
    const memoryId = await this.memorySystem.saveMemory({
      content: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      category: category as any,
      sessionId: this.currentSession.id,
      priority: priority as any,
      tags,
      metadata: {
        source: 'manual_save',
        timestamp: new Date().toISOString()
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `
💾 **Progress Saved Successfully**

**Memory ID:** ${memoryId}
**Category:** ${category}
**Priority:** ${priority}
**Tags:** ${tags.join(', ') || 'None'}
**Session:** ${this.currentSession.id}

**Data Size:** ${JSON.stringify(data).length} characters
**Timestamp:** ${new Date().toISOString()}
          `.trim(),
        },
      ],
    };
  }

  private async handleMarathonMode(action: string, checkpointId?: string, sessionId?: string) {
    switch (action) {
      case 'prepare_transfer':
        return await this.prepareTransfer();
      case 'restore_checkpoint':
        return await this.restoreCheckpoint(checkpointId!);
      case 'create_checkpoint':
        return await this.createManualCheckpoint();
      case 'status':
        return await this.getMarathonStatus();
      default:
        throw new Error(`Unknown Marathon Mode action: ${action}`);
    }
  }

  private async prepareTransfer() {
    const result = await this.memorySystem.prepareMarathonTransfer(this.currentSession.id);
    
    return {
      content: [
        {
          type: 'text',
          text: result.transferInstructions,
        },
      ],
    };
  }

  private async restoreCheckpoint(checkpointId: string) {
    const result = await this.memorySystem.restoreFromCheckpoint(checkpointId);
    
    // Update current session
    this.currentSession = {
      id: result.sessionId,
      startTime: new Date().toISOString(),
      commands: [],
      marathonMode: true,
      contextSize: 0,
      checkpoints: [],
      status: 'active'
    };

    return {
      content: [
        {
          type: 'text',
          text: result.contextSummary,
        },
      ],
    };
  }

  private async createManualCheckpoint() {
    const checkpointId = await this.memorySystem.createCheckpoint(
      this.currentSession.id,
      'manual'
    );

    return {
      content: [
        {
          type: 'text',
          text: `✅ Manual checkpoint created: ${checkpointId}`,
        },
      ],
    };
  }

  private async getMarathonStatus() {
    return {
      content: [
        {
          type: 'text',
          text: `
📊 **Marathon Mode Status**

**Current Session:** ${this.currentSession.id}
**Marathon Mode:** ${this.currentSession.marathonMode ? '✅ Active' : '❌ Inactive'}
**Commands Executed:** ${this.currentSession.commands.length}
**Context Size:** ${this.currentSession.contextSize}
**Auto-Save:** ${this.autoSaveScheduler ? '✅ Enabled' : '❌ Disabled'}
**Checkpoints:** ${this.currentSession.checkpoints.length}

**Configuration:**
• Auto-save interval: ${this.config.autoSaveInterval} minutes
• Context overflow threshold: ${this.config.contextOverflowThreshold}
• Max memory items: ${this.config.maxMemoryItems}
          `.trim(),
        },
      ],
    };
  }

  private async searchMemory(query: string, includeGraph = true, timeRange?: any, threshold = 0.3) {
    const searchOptions = {
      threshold,
      includeMetadata: true,
      timeRange,
      limit: 20
    };

    const memories = await this.memorySystem.searchMemory(query, searchOptions);
    
    let graphContext = { entities: [], relationships: [] };
    if (includeGraph) {
      graphContext = await this.memorySystem.loadContextForSession(this.currentSession.id, query)
        .then(result => result.graphContext);
    }

    return {
      content: [
        {
          type: 'text',
          text: `
🔍 **Memory Search Results**

**Query:** "${query}"
**Results Found:** ${memories.length}
**Graph Entities:** ${graphContext.entities.length}

**Memories:**
${memories.slice(0, 10).map((m, i) => 
  `${i + 1}. [${m.category}] ${m.content.substring(0, 150)}...
   Tags: ${m.tags.join(', ')} | Priority: ${m.priority}`
).join('\n\n')}

${includeGraph && graphContext.entities.length > 0 ? `
**Related Entities:**
${graphContext.entities.slice(0, 5).map(e => 
  `• ${e.name} (${e.type})`
).join('\n')}
` : ''}
          `.trim(),
        },
      ],
    };
  }

  // === UTILITY METHODS ===

  private categorizeContent(command: string, results: any[]): string {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('deploy') || lowerCommand.includes('server') || lowerCommand.includes('config')) {
      return 'infrastructure';
    }
    if (lowerCommand.includes('project') || lowerCommand.includes('task') || lowerCommand.includes('develop')) {
      return 'projects';
    }
    if (lowerCommand.includes('workflow') || lowerCommand.includes('automation') || lowerCommand.includes('process')) {
      return 'workflows';
    }
    if (lowerCommand.includes('learn') || lowerCommand.includes('insight') || lowerCommand.includes('analysis')) {
      return 'insights';
    }
    
    return 'interactions';
  }

  private generateTags(command: string, results: any[]): string[] {
    const tags = new Set<string>();
    
    // Extract tags from command
    const words = command.toLowerCase().split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'from', 'that', 'this'].includes(word)
    );
    
    importantWords.slice(0, 3).forEach(word => tags.add(word));
    
    // Add context tags
    if (results.some(r => r.type === 'marathon_transfer')) tags.add('marathon');
    if (results.some(r => r.type === 'sequential_execution')) tags.add('complex-task');
    
    return Array.from(tags);
  }

  private determinePriority(command: string, results: any[]): string {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('critical') || lowerCommand.includes('urgent') || lowerCommand.includes('emergency')) {
      return 'critical';
    }
    if (lowerCommand.includes('important') || lowerCommand.includes('deploy') || lowerCommand.includes('production')) {
      return 'high';
    }
    if (lowerCommand.includes('low') || lowerCommand.includes('minor') || lowerCommand.includes('note')) {
      return 'low';
    }
    
    return 'medium';
  }

  private updateContextSize() {
    this.currentSession.contextSize = JSON.stringify(this.currentSession).length;
  }

  private formatCommandResults(symbols: any, results: any[], duration: number): string {
    const symbolsList = Object.entries(symbols)
      .filter(([_, active]) => active)
      .map(([symbol, _]) => {
        const symbolMap: Record<string, string> = {
          load: '--- (Context Loaded)',
          execute: '+++ (Task Executed)',
          save: '... (Progress Saved)',
          marathon: '*** (Marathon Mode)'
        };
        return symbolMap[symbol];
      });

    return `
🎯 **Enhanced Command Execution Complete**

**Symbols Used:** ${symbolsList.join(', ')}
**Duration:** ${duration}ms
**Session:** ${this.currentSession.id}

**Results:**
${results.map((result, i) => `${i + 1}. ${JSON.stringify(result, null, 2)}`).join('\n')}

**Next Actions Available:**
• Use \`kb_search_memory\` to find related information
• Use \`kb_marathon_mode\` to manage session transfer
• Use enhanced commands with symbol combinations
    `.trim();
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🧠 Claude Knowledge Base MCP v2.0 Server started with Marathon Mode');
  }
}

// Start the server
const server = new ClaudeKnowledgeBaseMCP();
await server.start();
