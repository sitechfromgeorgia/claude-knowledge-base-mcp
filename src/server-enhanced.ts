#!/usr/bin/env node

/**
 * Enhanced Claude Knowledge Base MCP Server
 * Advanced implementation with full feature set
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import our services
import { getConfig, validateConfig } from './config/index.js';
import { logger } from './services/logger.js';
import { MemoryManager } from './services/memory/index.js';
import { MarathonModeManager } from './services/marathon/index.js';
import { IntegrationManager } from './services/integrations/index.js';
import { CommandProcessor } from './services/command-processor.js';

import type { MCPConfig } from './types/index.js';

class EnhancedClaudeKnowledgeBase {
  private server: Server;
  private config: MCPConfig;
  private memoryManager: MemoryManager;
  private marathonManager: MarathonModeManager;
  private integrationManager: IntegrationManager;
  private commandProcessor: CommandProcessor;
  private serverLogger = logger.component('MCPServer');
  private isInitialized = false;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    
    // Load and validate configuration
    this.config = getConfig();
    const validation = validateConfig(this.config);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.serverLogger.info('Initializing Enhanced Claude Knowledge Base MCP Server', {
      version: this.config.server.version,
      dataDirectory: this.config.server.dataDirectory
    });

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize service components
    this.memoryManager = new MemoryManager(this.config);
    this.marathonManager = new MarathonModeManager(this.config);
    this.integrationManager = new IntegrationManager(this.config);
    this.commandProcessor = new CommandProcessor(
      this.config,
      this.memoryManager,
      this.marathonManager,
      this.integrationManager
    );

    this.setupTools();
    this.setupEventHandlers();
  }

  private setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'kb_command',
          description: 'Execute advanced knowledge base commands with symbol syntax (---, +++, ..., ***)',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Command string with symbols and task description. Symbols: --- (load), +++ (execute), ... (update), *** (marathon)',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'kb_memory_search',
          description: 'Search the knowledge base using semantic and keyword search',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for finding relevant information',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
                default: 10,
              },
              threshold: {
                type: 'number',
                description: 'Minimum relevance score threshold (default: 0.1)',
                default: 0.1,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'kb_marathon_control',
          description: 'Control Marathon Mode operations (start, save_and_switch, continue, end)',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['start', 'save_and_switch', 'continue', 'end', 'status'],
                description: 'Marathon Mode action to perform',
              },
              taskDescription: {
                type: 'string',
                description: 'Description of the task (required for start and save_and_switch)',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'kb_integration_execute',
          description: 'Execute operations with external integrations (n8n, Supabase, Chrome, ERPNext)',
          inputSchema: {
            type: 'object',
            properties: {
              integration: {
                type: 'string',
                enum: ['n8n', 'supabase', 'chrome', 'erpnext'],
                description: 'Integration service to use',
              },
              action: {
                type: 'string',
                description: 'Action to perform (depends on integration)',
              },
              parameters: {
                type: 'object',
                description: 'Parameters for the action',
              },
            },
            required: ['integration', 'action', 'parameters'],
          },
        },
        {
          name: 'kb_system_health',
          description: 'Get comprehensive system health and status information',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: {
                type: 'boolean',
                description: 'Include detailed component information',
                default: false,
              },
            },
          },
        },
        {
          name: 'kb_analytics',
          description: 'Get analytics and insights about knowledge base usage',
          inputSchema: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                enum: ['hour', 'day', 'week', 'month', 'all'],
                description: 'Timeframe for analytics',
                default: 'day',
              },
              includePatterns: {
                type: 'boolean',
                description: 'Include usage patterns analysis',
                default: true,
              },
            },
          },
        },
      ];

      return { tools };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolLogger = this.serverLogger.session('tool-execution');
      
      try {
        const { name, arguments: args } = request.params;
        
        toolLogger.debug('Tool execution started', { tool: name, args });
        
        const startTime = performance.now();
        let result: any;

        switch (name) {
          case 'kb_command':
            result = await this.handleCommand(args.command);
            break;
            
          case 'kb_memory_search':
            result = await this.handleMemorySearch(args.query, args.limit, args.threshold);
            break;
            
          case 'kb_marathon_control':
            result = await this.handleMarathonControl(args.action, args.taskDescription);
            break;
            
          case 'kb_integration_execute':
            result = await this.handleIntegrationExecute(args.integration, args.action, args.parameters);
            break;
            
          case 'kb_system_health':
            result = await this.handleSystemHealth(args.detailed);
            break;
            
          case 'kb_analytics':
            result = await this.handleAnalytics(args.timeframe, args.includePatterns);
            break;
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        const duration = performance.now() - startTime;
        
        toolLogger.info('Tool execution completed', {
          tool: name,
          success: true,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        toolLogger.error('Tool execution failed', error as Error, {
          tool: request.params.name,
          args: request.params.arguments
        });
        
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

  private async handleCommand(command: string): Promise<string> {
    this.serverLogger.debug('Processing advanced command', { command });
    
    const result = await this.commandProcessor.processCommand(command);
    
    let response = `🚀 **Command Execution Result**\n\n`;
    response += `**Session:** ${result.sessionId}\n`;
    response += `**Success:** ${result.success ? '✅' : '❌'}\n`;
    response += `**Steps Completed:** ${result.results.length}\n\n`;
    
    if (result.errors && result.errors.length > 0) {
      response += `**Errors:**\n${result.errors.map(e => `- ${e}`).join('\n')}\n\n`;
    }
    
    // Add step details
    result.results.forEach((step, index) => {
      response += `**Step ${index + 1}: ${step.type.toUpperCase()}**\n`;
      response += `- Success: ${step.success ? '✅' : '❌'}\n`;
      response += `- Duration: ${step.duration.toFixed(2)}ms\n`;
      
      if (step.type === 'load' && step.success) {
        const data = step.data;
        response += `- Search Results: ${data.searchResults?.items?.length || 0}\n`;
        response += `- System Health: ${data.systemHealth?.overall || 'unknown'}\n`;
        response += `- Available Integrations: ${Object.entries(data.availableIntegrations || {})
          .filter(([_, enabled]) => enabled)
          .map(([name, _]) => name)
          .join(', ') || 'none'}\n`;
      }
      
      response += `\n`;
    });
    
    // Add Marathon Mode status
    if (result.marathonState) {
      response += `🏃‍♂️ **Marathon Mode Status:**\n`;
      response += `- Status: ${result.marathonState.status}\n`;
      response += `- Progress: ${result.marathonState.progress.percentage.toFixed(1)}%\n`;
      response += `- Checkpoints: ${result.marathonState.checkpoints.length}\n`;
      
      if (result.marathonState.status === 'ready_for_continuation') {
        response += `\n⚡ **Ready for new session!**\n`;
        response += `Use this command in a new chat:\n`;
        response += `\`\`\`\n--- +++ ... *** Continue ${result.marathonState.taskDescription} from previous session\n\`\`\`\n`;
      }
    }
    
    return response;
  }

  private async handleMemorySearch(query: string, limit: number = 10, threshold: number = 0.1): Promise<string> {
    const searchResult = await this.memoryManager.searchMemory({
      query,
      limit,
      threshold
    });
    
    let response = `🔍 **Memory Search Results**\n\n`;
    response += `**Query:** ${query}\n`;
    response += `**Results:** ${searchResult.items.length}/${searchResult.totalCount}\n`;
    response += `**Execution Time:** ${searchResult.executionTime.toFixed(2)}ms\n\n`;
    
    if (searchResult.items.length === 0) {
      response += `No results found for the query.\n`;
    } else {
      searchResult.items.forEach((item, index) => {
        response += `**Result ${index + 1}** (Score: ${item.relevanceScore.toFixed(3)})\n`;
        response += `- Category: ${item.category}\n`;
        response += `- Content: ${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
        response += `- Timestamp: ${item.timestamp}\n\n`;
      });
    }
    
    return response;
  }

  private async handleMarathonControl(action: string, taskDescription?: string): Promise<string> {
    let response = `🏃‍♂️ **Marathon Mode Control**\n\n`;
    
    switch (action) {
      case 'status':
        const currentState = this.marathonManager.getCurrentState();
        if (currentState) {
          response += `**Status:** ${currentState.status}\n`;
          response += `**Task:** ${currentState.taskDescription}\n`;
          response += `**Progress:** ${currentState.progress.percentage.toFixed(1)}%\n`;
          response += `**Checkpoints:** ${currentState.checkpoints.length}\n`;
          response += `**Session ID:** ${currentState.sessionId}\n`;
        } else {
          response += `**Status:** Inactive\n`;
        }
        break;
        
      case 'start':
        if (!taskDescription) {
          throw new Error('Task description required for starting Marathon Mode');
        }
        const session = this.commandProcessor.getCurrentSession();
        if (!session) {
          throw new Error('No active session available');
        }
        const startedState = await this.marathonManager.startMarathonMode(session, taskDescription);
        response += `**Started Successfully!**\n`;
        response += `**Session ID:** ${startedState.sessionId}\n`;
        response += `**Task:** ${startedState.taskDescription}\n`;
        break;
        
      case 'save_and_switch':
        const switchResult = await this.marathonManager.saveAndSwitch(taskDescription);
        response += `**Saved and Ready for Switch!**\n`;
        response += `**Continuation Command:**\n\`\`\`\n${switchResult.continuationCommand}\n\`\`\`\n`;
        break;
        
      case 'continue':
        const continuedState = await this.marathonManager.continueFromPrevious();
        response += `**Continued Successfully!**\n`;
        response += `**New Session ID:** ${continuedState.sessionId}\n`;
        response += `**Previous Session:** ${continuedState.previousSessionId}\n`;
        break;
        
      case 'end':
        await this.marathonManager.endMarathonMode('completed');
        response += `**Marathon Mode Ended**\n`;
        break;
        
      default:
        throw new Error(`Unknown Marathon Mode action: ${action}`);
    }
    
    return response;
  }

  private async handleIntegrationExecute(integration: string, action: string, parameters: any): Promise<string> {
    let response = `🔗 **Integration Execution**\n\n`;
    response += `**Service:** ${integration}\n`;
    response += `**Action:** ${action}\n\n`;
    
    let result: any;
    
    switch (integration) {
      case 'n8n':
        if (action === 'trigger_workflow') {
          result = await this.integrationManager.triggerN8nWorkflow(
            parameters.workflowId,
            parameters.data
          );
        } else if (action === 'get_workflows') {
          result = await this.integrationManager.getN8nWorkflows();
        }
        break;
        
      case 'supabase':
        if (action === 'store') {
          result = await this.integrationManager.storeInSupabase(
            parameters.table,
            parameters.data
          );
        } else if (action === 'query') {
          result = await this.integrationManager.querySupabase(
            parameters.table,
            parameters.query
          );
        }
        break;
        
      case 'chrome':
        if (action === 'screenshot') {
          result = await this.integrationManager.takeScreenshot(
            parameters.url,
            parameters.options
          );
        } else if (action === 'scrape') {
          result = await this.integrationManager.scrapeWebContent(
            parameters.url,
            parameters.selectors
          );
        }
        break;
        
      case 'erpnext':
        if (action === 'get_data') {
          result = await this.integrationManager.getERPNextData(
            parameters.doctype,
            parameters.filters
          );
        }
        break;
        
      default:
        throw new Error(`Unknown integration: ${integration}`);
    }
    
    if (result) {
      response += `**Result:**\n`;
      response += `- Success: ${result.success ? '✅' : '❌'}\n`;
      response += `- Duration: ${result.duration.toFixed(2)}ms\n`;
      
      if (result.success) {
        response += `- Data: ${JSON.stringify(result.data, null, 2).substring(0, 500)}...\n`;
      } else {
        response += `- Error: ${result.error}\n`;
      }
    }
    
    return response;
  }

  private async handleSystemHealth(detailed: boolean = false): Promise<string> {
    const health = await this.integrationManager.getSystemHealth();
    const memoryStats = await this.memoryManager.getMemoryStats();
    
    let response = `🏥 **System Health Report**\n\n`;
    response += `**Overall Status:** ${this.getHealthEmoji(health.overall)} ${health.overall.toUpperCase()}\n`;
    response += `**Last Check:** ${health.lastCheck}\n\n`;
    
    response += `**Memory Statistics:**\n`;
    response += `- Total Items: ${memoryStats.totalItems}\n`;
    response += `- Storage Size: ${(memoryStats.storageSize / 1024).toFixed(2)} KB\n`;
    response += `- Vector Count: ${memoryStats.vectorCount}\n\n`;
    
    response += `**Component Status:**\n`;
    Object.entries(health.components).forEach(([name, component]) => {
      response += `- ${name}: ${this.getHealthEmoji(component.status)} ${component.status}`;
      if (component.responseTime) {
        response += ` (${component.responseTime.toFixed(2)}ms)`;
      }
      response += `\n`;
      
      if (detailed && component.message) {
        response += `  ${component.message}\n`;
      }
    });
    
    response += `\n**Marathon Mode:** ${this.marathonManager.isMarathonActive() ? '🏃‍♂️ Active' : '💤 Inactive'}\n`;
    
    const uptime = Date.now() - this.startTime;
    response += `**Server Uptime:** ${this.formatDuration(uptime)}\n`;
    
    return response;
  }

  private async handleAnalytics(timeframe: string = 'day', includePatterns: boolean = true): Promise<string> {
    const knowledgeBase = await this.memoryManager.getKnowledgeBase();
    
    let response = `📊 **Analytics Report**\n\n`;
    response += `**Timeframe:** ${timeframe}\n\n`;
    
    // Command usage analytics
    const analytics = knowledgeBase.insights.analytics;
    response += `**Command Usage:**\n`;
    Object.entries(analytics.commandUsage).forEach(([command, count]) => {
      response += `- ${command}: ${count} times\n`;
    });
    
    response += `\n**Session Statistics:**\n`;
    response += `- Average Duration: ${analytics.sessionDuration.average.toFixed(2)} minutes\n`;
    response += `- Longest Session: ${analytics.sessionDuration.longest.toFixed(2)} minutes\n`;
    response += `- Shortest Session: ${analytics.sessionDuration.shortest.toFixed(2)} minutes\n`;
    
    response += `\n**Marathon Mode:**\n`;
    response += `- Activations: ${analytics.marathonModeUsage.activations}\n`;
    response += `- Average Duration: ${analytics.marathonModeUsage.averageDuration.toFixed(2)} minutes\n`;
    response += `- Success Rate: ${(analytics.marathonModeUsage.successRate * 100).toFixed(1)}%\n`;
    
    if (includePatterns) {
      response += `\n**Usage Patterns:**\n`;
      knowledgeBase.insights.patterns.forEach((pattern, index) => {
        response += `${index + 1}. ${pattern.name} (${(pattern.confidence * 100).toFixed(1)}% confidence)\n`;
        response += `   ${pattern.description}\n`;
      });
    }
    
    return response;
  }

  private getHealthEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private setupEventHandlers(): void {
    // Marathon Mode events
    this.marathonManager.on('marathonEvent', (event) => {
      this.serverLogger.info('Marathon Mode event', {
        type: event.type,
        sessionId: event.sessionId
      });
    });
    
    this.marathonManager.on('recommendSwitch', (data) => {
      this.serverLogger.warn('Marathon Mode recommends session switch', data);
    });
    
    // Process error handling
    process.on('SIGINT', async () => {
      this.serverLogger.info('Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      this.serverLogger.info('Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
      this.serverLogger.error('Uncaught exception', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      this.serverLogger.error('Unhandled rejection', reason as Error, {
        promise: promise.toString()
      });
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      this.serverLogger.info('Starting initialization sequence...');
      
      // Initialize services in order
      await this.memoryManager.initialize();
      await this.marathonManager.initialize();
      await this.integrationManager.initialize();
      await this.commandProcessor.initialize();
      
      this.isInitialized = true;
      
      const initTime = Date.now() - this.startTime;
      this.serverLogger.info('Enhanced MCP server initialized successfully', {
        initializationTime: `${initTime}ms`,
        availableIntegrations: this.integrationManager.getAvailableIntegrations()
      });
    } catch (error) {
      this.serverLogger.error('Failed to initialize MCP server', error as Error);
      throw error;
    }
  }

  async start(): Promise<void> {
    await this.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.serverLogger.info('🚀 Enhanced Claude Knowledge Base MCP Server started', {
      version: this.config.server.version,
      features: ['memory', 'marathon', 'integrations', 'analytics'],
      dataDirectory: this.config.server.dataDirectory
    });
  }

  async shutdown(): Promise<void> {
    this.serverLogger.info('Starting graceful shutdown...');
    
    try {
      // Shutdown services in reverse order
      await this.commandProcessor.shutdown();
      await this.integrationManager.shutdown();
      await this.marathonManager.shutdown();
      await this.memoryManager.shutdown();
      
      this.serverLogger.info('Graceful shutdown completed');
    } catch (error) {
      this.serverLogger.error('Error during shutdown', error as Error);
    }
  }
}

// Start the enhanced server
const enhancedServer = new EnhancedClaudeKnowledgeBase();
enhancedServer.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});