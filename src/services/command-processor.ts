/**
 * Advanced Command Processing System
 */

import type { 
  ParsedCommand, 
  CommandSymbol, 
  SessionData,
  ExecutionResult,
  MCPConfig,
  MarathonState
} from '../types/index.js';
import { logger } from './logger.js';
import { MemoryManager } from './memory/index.js';
import { MarathonModeManager } from './marathon/index.js';
import { IntegrationManager } from './integrations/index.js';
import { v4 as uuidv4 } from 'uuid';

export class CommandProcessor {
  private config: MCPConfig;
  private memoryManager: MemoryManager;
  private marathonManager: MarathonModeManager;
  private integrationManager: IntegrationManager;
  private processorLogger = logger.component('CommandProcessor');
  private currentSession: SessionData | null = null;

  constructor(
    config: MCPConfig,
    memoryManager: MemoryManager,
    marathonManager: MarathonModeManager,
    integrationManager: IntegrationManager
  ) {
    this.config = config;
    this.memoryManager = memoryManager;
    this.marathonManager = marathonManager;
    this.integrationManager = integrationManager;
  }

  async initialize(): Promise<void> {
    this.processorLogger.info('Initializing command processor');
    
    // Initialize current session
    this.currentSession = this.createSession();
    
    this.processorLogger.info('Command processor initialized', {
      sessionId: this.currentSession.id
    });
  }

  async processCommand(commandString: string): Promise<{
    success: boolean;
    results: any[];
    sessionId: string;
    marathonState?: MarathonState;
    errors?: string[];
  }> {
    const sessionLogger = this.processorLogger.session(this.currentSession?.id || 'unknown');
    
    try {
      sessionLogger.info('Processing command', { command: commandString });
      
      // Parse command
      const parsedCommand = this.parseCommand(commandString);
      
      if (!parsedCommand.isValid) {
        throw new Error('Invalid command format');
      }
      
      // Log command execution
      const commandExecution = {
        command: commandString,
        timestamp: new Date().toISOString(),
        symbols: parsedCommand.symbols,
        taskDescription: parsedCommand.taskDescription,
        duration: 0,
        success: false
      };
      
      this.currentSession!.commands.push(commandExecution);
      
      const startTime = performance.now();
      const results: ExecutionResult[] = [];
      const errors: string[] = [];
      
      // Execute command steps in order
      if (parsedCommand.hasLoad) {
        try {
          const loadResult = await this.executeLoad(parsedCommand);
          results.push(loadResult);
          sessionLogger.debug('Load step completed', { resultId: loadResult.id });
        } catch (error) {
          errors.push(`Load failed: ${(error as Error).message}`);
          sessionLogger.error('Load step failed', error as Error);
        }
      }
      
      if (parsedCommand.hasExecute) {
        try {
          const executeResult = await this.executeComplex(parsedCommand);
          results.push(executeResult);
          sessionLogger.debug('Execute step completed', { resultId: executeResult.id });
        } catch (error) {
          errors.push(`Execute failed: ${(error as Error).message}`);
          sessionLogger.error('Execute step failed', error as Error);
        }
      }
      
      if (parsedCommand.hasUpdate) {
        try {
          const updateResult = await this.executeUpdate(parsedCommand, results);
          results.push(updateResult);
          sessionLogger.debug('Update step completed', { resultId: updateResult.id });
        } catch (error) {
          errors.push(`Update failed: ${(error as Error).message}`);
          sessionLogger.error('Update step failed', error as Error);
        }
      }
      
      // Handle Marathon Mode
      let marathonState: MarathonState | undefined;
      if (parsedCommand.hasMarathon) {
        try {
          marathonState = await this.executeMarathon(parsedCommand);
          sessionLogger.debug('Marathon step completed', { sessionId: marathonState.sessionId });
        } catch (error) {
          errors.push(`Marathon failed: ${(error as Error).message}`);
          sessionLogger.error('Marathon step failed', error as Error);
        }
      }
      
      // Update command execution record
      const duration = performance.now() - startTime;
      commandExecution.duration = duration;
      commandExecution.success = errors.length === 0;
      
      // Store results in session
      this.currentSession!.results.push(...results);
      
      // Auto-checkpoint if significant progress
      if (this.marathonManager.isMarathonActive() && results.length > 0) {
        await this.marathonManager.createCheckpoint(
          `Command executed: ${parsedCommand.taskDescription}`,
          {
            command: commandString,
            resultCount: results.length,
            duration
          },
          true
        );
      }
      
      sessionLogger.info('Command processing completed', {
        success: errors.length === 0,
        resultCount: results.length,
        errorCount: errors.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: errors.length === 0,
        results,
        sessionId: this.currentSession!.id,
        marathonState,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      sessionLogger.error('Command processing failed', error as Error, {
        command: commandString
      });
      
      return {
        success: false,
        results: [],
        sessionId: this.currentSession?.id || 'unknown',
        errors: [(error as Error).message]
      };
    }
  }

  private parseCommand(command: string): ParsedCommand {
    const symbols: CommandSymbol[] = [];
    let hasLoad = false;
    let hasExecute = false;
    let hasUpdate = false;
    let hasMarathon = false;
    
    // Check for command symbols
    if (command.includes('---')) {
      symbols.push('---');
      hasLoad = true;
    }
    
    if (command.includes('+++')) {
      symbols.push('+++');
      hasExecute = true;
    }
    
    if (command.includes('...')) {
      symbols.push('...');
      hasUpdate = true;
    }
    
    if (command.includes('***')) {
      symbols.push('***');
      hasMarathon = true;
    }
    
    // Extract task description (remove symbols)
    const taskDescription = command
      .replace(/---/g, '')
      .replace(/\+\+\+/g, '')
      .replace(/\.\.\./g, '')
      .replace(/\*\*\*/g, '')
      .trim();
    
    // Determine priority based on symbols and content
    let priority: ParsedCommand['priority'] = 'medium';
    if (hasMarathon) priority = 'urgent';
    else if (hasExecute && hasLoad) priority = 'high';
    else if (hasLoad || hasUpdate) priority = 'low';
    
    // Estimate duration based on task complexity
    const estimatedDuration = this.estimateTaskDuration(taskDescription, symbols);
    
    return {
      symbols,
      taskDescription,
      hasLoad,
      hasExecute,
      hasUpdate,
      hasMarathon,
      isValid: symbols.length > 0 && taskDescription.length > 0,
      priority,
      estimatedDuration
    };
  }

  private async executeLoad(parsedCommand: ParsedCommand): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      this.processorLogger.debug('Executing load command');
      
      // Search memory for relevant context
      const searchResult = await this.memoryManager.searchMemory({
        query: parsedCommand.taskDescription,
        limit: 10,
        threshold: 0.1
      });
      
      // Get current knowledge base state
      const knowledgeBase = await this.memoryManager.getKnowledgeBase();
      
      // Get system health
      const systemHealth = await this.integrationManager.getSystemHealth();
      
      const loadData = {
        searchResults: searchResult,
        knowledgeBase: {
          infrastructure: Object.keys(knowledgeBase.infrastructure.servers).length > 0 ? 
            knowledgeBase.infrastructure : 'No infrastructure data',
          projects: Object.keys(knowledgeBase.projects.active).length,
          interactions: knowledgeBase.interactions.length,
          workflows: knowledgeBase.workflows.n8n.length,
          insights: knowledgeBase.insights.analytics.commandUsage
        },
        systemHealth,
        availableIntegrations: this.integrationManager.getAvailableIntegrations(),
        currentSession: this.currentSession?.id,
        lastUpdated: knowledgeBase.lastUpdated
      };
      
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'load',
        data: loadData,
        timestamp: new Date().toISOString(),
        success: true,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'load',
        data: { error: (error as Error).message },
        timestamp: new Date().toISOString(),
        success: false,
        duration
      };
    }
  }

  private async executeComplex(parsedCommand: ParsedCommand): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      this.processorLogger.debug('Executing complex task', {
        task: parsedCommand.taskDescription,
        hasMarathon: parsedCommand.hasMarathon
      });
      
      // Start Marathon Mode if requested
      if (parsedCommand.hasMarathon && !this.marathonManager.isMarathonActive()) {
        await this.marathonManager.startMarathonMode(
          this.currentSession!,
          parsedCommand.taskDescription
        );
      }
      
      // Analyze task and determine required integrations
      const requiredIntegrations = this.analyzeTaskRequirements(parsedCommand.taskDescription);
      
      // Execute task steps
      const taskResults: any[] = [];
      
      for (const integration of requiredIntegrations) {
        try {
          let result;
          
          switch (integration.type) {
            case 'n8n':
              result = await this.integrationManager.triggerN8nWorkflow(
                integration.workflowId,
                integration.data
              );
              break;
              
            case 'chrome':
              if (integration.action === 'screenshot') {
                result = await this.integrationManager.takeScreenshot(
                  integration.url,
                  integration.options
                );
              } else if (integration.action === 'scrape') {
                result = await this.integrationManager.scrapeWebContent(
                  integration.url,
                  integration.selectors
                );
              }
              break;
              
            case 'supabase':
              if (integration.action === 'store') {
                result = await this.integrationManager.storeInSupabase(
                  integration.table,
                  integration.data
                );
              } else if (integration.action === 'query') {
                result = await this.integrationManager.querySupabase(
                  integration.table,
                  integration.query
                );
              }
              break;
              
            case 'erpnext':
              result = await this.integrationManager.getERPNextData(
                integration.doctype,
                integration.filters
              );
              break;
          }
          
          if (result) {
            taskResults.push({
              integration: integration.type,
              success: result.success,
              data: result.data,
              duration: result.duration
            });
          }
        } catch (error) {
          taskResults.push({
            integration: integration.type,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'execute',
        data: {
          task: parsedCommand.taskDescription,
          requiredIntegrations: requiredIntegrations.length,
          results: taskResults,
          marathonActive: this.marathonManager.isMarathonActive()
        },
        timestamp: new Date().toISOString(),
        success: taskResults.every(r => r.success),
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'execute',
        data: { error: (error as Error).message },
        timestamp: new Date().toISOString(),
        success: false,
        duration
      };
    }
  }

  private async executeUpdate(parsedCommand: ParsedCommand, results: ExecutionResult[]): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      this.processorLogger.debug('Executing update command');
      
      // Prepare update data
      const updateData = {
        command: parsedCommand.taskDescription,
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession!.id,
        results: results.map(r => ({
          type: r.type,
          success: r.success,
          duration: r.duration
        })),
        integrations: this.integrationManager.getAvailableIntegrations(),
        performance: {
          totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
          successRate: results.filter(r => r.success).length / results.length
        }
      };
      
      // Store in memory
      const memoryId = await this.memoryManager.storeMemory({
        content: JSON.stringify(updateData),
        category: 'interactions',
        relevanceScore: 1.0,
        metadata: {
          type: 'command_execution',
          sessionId: this.currentSession!.id,
          commandType: parsedCommand.symbols.join(''),
          success: results.every(r => r.success)
        }
      });
      
      // Update knowledge base
      await this.memoryManager.updateKnowledgeBase('interactions', updateData);
      
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'update',
        data: {
          memoryId,
          updateData,
          stored: true
        },
        timestamp: new Date().toISOString(),
        success: true,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        id: uuidv4(),
        commandId: this.currentSession!.commands[this.currentSession!.commands.length - 1]?.command || '',
        type: 'update',
        data: { error: (error as Error).message },
        timestamp: new Date().toISOString(),
        success: false,
        duration
      };
    }
  }

  private async executeMarathon(parsedCommand: ParsedCommand): Promise<MarathonState> {
    this.processorLogger.debug('Executing marathon command');
    
    if (this.marathonManager.isMarathonActive()) {
      // Save and switch if already active
      const result = await this.marathonManager.saveAndSwitch(parsedCommand.taskDescription);
      return result.savedState;
    } else {
      // Start new marathon session
      return await this.marathonManager.startMarathonMode(
        this.currentSession!,
        parsedCommand.taskDescription
      );
    }
  }

  private analyzeTaskRequirements(taskDescription: string): Array<{
    type: 'n8n' | 'chrome' | 'supabase' | 'erpnext';
    action?: string;
    workflowId?: string;
    url?: string;
    table?: string;
    doctype?: string;
    data?: any;
    options?: any;
    selectors?: any[];
    query?: any;
    filters?: any;
  }> {
    const requirements: any[] = [];
    const taskLower = taskDescription.toLowerCase();
    
    // Analyze task for automation keywords
    if (taskLower.includes('workflow') || taskLower.includes('automate')) {
      requirements.push({
        type: 'n8n',
        workflowId: 'default', // Would be determined dynamically
        data: { task: taskDescription }
      });
    }
    
    // Analyze for web scraping/screenshots
    if (taskLower.includes('screenshot') || taskLower.includes('capture')) {
      requirements.push({
        type: 'chrome',
        action: 'screenshot',
        url: this.extractUrlFromTask(taskDescription),
        options: { fullPage: true }
      });
    }
    
    if (taskLower.includes('scrape') || taskLower.includes('extract')) {
      requirements.push({
        type: 'chrome',
        action: 'scrape',
        url: this.extractUrlFromTask(taskDescription),
        selectors: [{ selector: 'body' }] // Would be more specific
      });
    }
    
    // Analyze for data storage
    if (taskLower.includes('store') || taskLower.includes('save') || taskLower.includes('database')) {
      requirements.push({
        type: 'supabase',
        action: 'store',
        table: 'task_results',
        data: { task: taskDescription, timestamp: new Date().toISOString() }
      });
    }
    
    // Analyze for business data
    if (taskLower.includes('customer') || taskLower.includes('invoice') || taskLower.includes('sales')) {
      requirements.push({
        type: 'erpnext',
        doctype: this.determineERPNextDoctype(taskDescription),
        filters: {}
      });
    }
    
    return requirements;
  }

  private extractUrlFromTask(task: string): string {
    // Simple URL extraction - would be more sophisticated in practice
    const urlMatch = task.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : 'https://example.com';
  }

  private determineERPNextDoctype(task: string): string {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('customer')) return 'Customer';
    if (taskLower.includes('invoice')) return 'Sales Invoice';
    if (taskLower.includes('sales')) return 'Sales Order';
    if (taskLower.includes('item')) return 'Item';
    
    return 'Customer'; // Default
  }

  private estimateTaskDuration(taskDescription: string, symbols: CommandSymbol[]): number {
    let duration = 5; // Base 5 seconds
    
    // Add duration based on symbols
    if (symbols.includes('---')) duration += 2;
    if (symbols.includes('+++')) duration += 10;
    if (symbols.includes('...')) duration += 3;
    if (symbols.includes('***')) duration += 5;
    
    // Add duration based on task complexity
    const complexityKeywords = ['deploy', 'configure', 'integrate', 'analyze', 'process'];
    complexityKeywords.forEach(keyword => {
      if (taskDescription.toLowerCase().includes(keyword)) {
        duration += 15;
      }
    });
    
    return Math.min(duration, 300); // Cap at 5 minutes
  }

  private createSession(): SessionData {
    return {
      id: uuidv4(),
      startTime: new Date().toISOString(),
      commands: [],
      results: [],
      marathonMode: false,
      context: {
        knowledgeLoaded: false,
        marathonActive: false,
        toolsAvailable: Object.keys(this.integrationManager.getAvailableIntegrations()),
        integrationStatus: this.integrationManager.getAvailableIntegrations(),
        recentInteractions: []
      },
      metadata: {
        features: ['memory', 'marathon', 'integrations'],
        preferences: {}
      }
    };
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  async shutdown(): Promise<void> {
    this.processorLogger.info('Shutting down command processor');
    
    if (this.currentSession) {
      this.currentSession.endTime = new Date().toISOString();
      
      // Save session data
      try {
        await this.memoryManager.storeMemory({
          content: JSON.stringify(this.currentSession),
          category: 'interactions',
          relevanceScore: 0.8,
          metadata: {
            type: 'session_data',
            sessionId: this.currentSession.id,
            commandCount: this.currentSession.commands.length
          }
        });
      } catch (error) {
        this.processorLogger.error('Failed to save session data', error as Error);
      }
    }
    
    this.processorLogger.info('Command processor shutdown completed');
  }
}