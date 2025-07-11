import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'chokidar';
import { join } from 'path';

export interface ToolIntegration {
  name: string;
  version: string;
  status: 'connected' | 'disconnected' | 'error';
  capabilities: string[];
  lastActivity?: string;
}

export interface ContextEvent {
  type: 'file_change' | 'command_executed' | 'context_update' | 'session_transfer';
  source: string;
  data: any;
  timestamp: string;
  sessionId?: string;
}

export interface SharedContext {
  sessionId: string;
  workingDirectory: string;
  activeFiles: string[];
  recentCommands: Array<{
    tool: string;
    command: string;
    timestamp: string;
    success: boolean;
  }>;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export class ToolIntegrationManager extends EventEmitter {
  private integrations: Map<string, ToolIntegration> = new Map();
  private sharedContext: SharedContext;
  private fileWatchers: Map<string, FSWatcher> = new Map();
  private contextSyncInterval?: NodeJS.Timeout;

  constructor(initialContext?: Partial<SharedContext>) {
    super();
    
    this.sharedContext = {
      sessionId: initialContext?.sessionId || `session_${Date.now()}`,
      workingDirectory: initialContext?.workingDirectory || process.cwd(),
      activeFiles: initialContext?.activeFiles || [],
      recentCommands: initialContext?.recentCommands || [],
      variables: initialContext?.variables || {},
      metadata: initialContext?.metadata || {}
    };

    this.initializeIntegrations();
    this.startContextSync();
  }

  private initializeIntegrations(): void {
    // Register built-in integrations
    this.registerIntegration({
      name: 'desktop-commander',
      version: '1.0.0',
      status: 'disconnected',
      capabilities: [
        'file_operations',
        'command_execution',
        'process_management',
        'search_operations'
      ]
    });

    this.registerIntegration({
      name: 'filesystem',
      version: '1.0.0',
      status: 'disconnected',
      capabilities: [
        'file_reading',
        'file_writing',
        'directory_operations',
        'file_watching'
      ]
    });

    this.registerIntegration({
      name: 'github',
      version: '1.0.0',
      status: 'disconnected',
      capabilities: [
        'repository_operations',
        'issue_management',
        'pr_management',
        'code_search'
      ]
    });

    this.registerIntegration({
      name: 'memory',
      version: '1.0.0',
      status: 'connected',
      capabilities: [
        'context_storage',
        'semantic_search',
        'session_management',
        'knowledge_graph'
      ]
    });
  }

  private startContextSync(): void {
    // Sync context every 30 seconds
    this.contextSyncInterval = setInterval(() => {
      this.syncContext();
    }, 30000);
  }

  // === TOOL REGISTRATION ===

  registerIntegration(integration: ToolIntegration): void {
    this.integrations.set(integration.name, integration);
    this.emit('tool_registered', integration);
    
    // Auto-connect if possible
    this.attemptConnection(integration.name);
  }

  private async attemptConnection(toolName: string): Promise<void> {
    try {
      switch (toolName) {
        case 'desktop-commander':
          await this.connectDesktopCommander();
          break;
        case 'filesystem':
          await this.connectFilesystem();
          break;
        case 'github':
          await this.connectGitHub();
          break;
        default:
          console.warn(`No auto-connection handler for ${toolName}`);
      }
    } catch (error) {
      console.error(`Failed to connect to ${toolName}:`, error);
      this.updateIntegrationStatus(toolName, 'error');
    }
  }

  // === DESKTOP COMMANDER INTEGRATION ===

  private async connectDesktopCommander(): Promise<void> {
    try {
      // Check if Desktop Commander MCP is available
      // This would typically involve checking for the MCP server
      this.updateIntegrationStatus('desktop-commander', 'connected');
      
      // Set up file watching for the working directory
      this.setupFileWatching();
      
      this.emit('context_event', {
        type: 'context_update',
        source: 'desktop-commander',
        data: { connected: true, workingDirectory: this.sharedContext.workingDirectory },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.updateIntegrationStatus('desktop-commander', 'error');
      throw error;
    }
  }

  private setupFileWatching(): void {
    const workingDir = this.sharedContext.workingDirectory;
    
    // Watch for file changes in the working directory
    const watcher = watch(workingDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => this.handleFileEvent('added', path))
      .on('change', path => this.handleFileEvent('changed', path))
      .on('unlink', path => this.handleFileEvent('deleted', path));

    this.fileWatchers.set('working-directory', watcher);
  }

  private handleFileEvent(event: string, filePath: string): void {
    const contextEvent: ContextEvent = {
      type: 'file_change',
      source: 'desktop-commander',
      data: {
        event,
        path: filePath,
        isRelevant: this.isRelevantFile(filePath)
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sharedContext.sessionId
    };

    this.emit('context_event', contextEvent);

    // Update active files list
    if (event === 'added' || event === 'changed') {
      this.addActiveFile(filePath);
    } else if (event === 'deleted') {
      this.removeActiveFile(filePath);
    }
  }

  private isRelevantFile(filePath: string): boolean {
    const relevantExtensions = [
      '.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs',
      '.json', '.yaml', '.yml', '.xml', '.config',
      '.md', '.txt', '.doc', '.docx',
      '.sql', '.db', '.sqlite'
    ];

    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext ? relevantExtensions.includes(`.${ext}`) : false;
  }

  // === FILESYSTEM INTEGRATION ===

  private async connectFilesystem(): Promise<void> {
    // Filesystem integration is usually always available
    this.updateIntegrationStatus('filesystem', 'connected');
    
    this.emit('context_event', {
      type: 'context_update',
      source: 'filesystem',
      data: { connected: true },
      timestamp: new Date().toISOString()
    });
  }

  // === GITHUB INTEGRATION ===

  private async connectGitHub(): Promise<void> {
    try {
      // Check if we're in a git repository
      const isGitRepo = await this.checkGitRepository();
      
      if (isGitRepo) {
        this.updateIntegrationStatus('github', 'connected');
        
        // Get current repository info
        const repoInfo = await this.getRepositoryInfo();
        
        this.emit('context_event', {
          type: 'context_update',
          source: 'github',
          data: { connected: true, repository: repoInfo },
          timestamp: new Date().toISOString()
        });
      } else {
        this.updateIntegrationStatus('github', 'disconnected');
      }
    } catch (error) {
      this.updateIntegrationStatus('github', 'error');
      throw error;
    }
  }

  private async checkGitRepository(): Promise<boolean> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('git rev-parse --git-dir', { cwd: this.sharedContext.workingDirectory });
      return true;
    } catch {
      return false;
    }
  }

  private async getRepositoryInfo(): Promise<any> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const [remoteResult, branchResult] = await Promise.all([
        execAsync('git remote get-url origin', { cwd: this.sharedContext.workingDirectory }),
        execAsync('git branch --show-current', { cwd: this.sharedContext.workingDirectory })
      ]);

      return {
        remote: remoteResult.stdout.trim(),
        branch: branchResult.stdout.trim()
      };
    } catch {
      return { remote: 'unknown', branch: 'unknown' };
    }
  }

  // === CONTEXT MANAGEMENT ===

  updateSharedContext(updates: Partial<SharedContext>): void {
    this.sharedContext = { ...this.sharedContext, ...updates };
    
    this.emit('context_event', {
      type: 'context_update',
      source: 'integration-manager',
      data: { updates },
      timestamp: new Date().toISOString()
    });

    this.syncContext();
  }

  getSharedContext(): SharedContext {
    return { ...this.sharedContext };
  }

  addRecentCommand(tool: string, command: string, success: boolean): void {
    const commandEntry = {
      tool,
      command,
      timestamp: new Date().toISOString(),
      success
    };

    this.sharedContext.recentCommands.unshift(commandEntry);
    
    // Keep only last 50 commands
    if (this.sharedContext.recentCommands.length > 50) {
      this.sharedContext.recentCommands = this.sharedContext.recentCommands.slice(0, 50);
    }

    this.emit('context_event', {
      type: 'command_executed',
      source: tool,
      data: commandEntry,
      timestamp: commandEntry.timestamp,
      sessionId: this.sharedContext.sessionId
    });
  }

  addActiveFile(filePath: string): void {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    if (!this.sharedContext.activeFiles.includes(normalizedPath)) {
      this.sharedContext.activeFiles.unshift(normalizedPath);
      
      // Keep only last 20 active files
      if (this.sharedContext.activeFiles.length > 20) {
        this.sharedContext.activeFiles = this.sharedContext.activeFiles.slice(0, 20);
      }
    }
  }

  removeActiveFile(filePath: string): void {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const index = this.sharedContext.activeFiles.indexOf(normalizedPath);
    
    if (index > -1) {
      this.sharedContext.activeFiles.splice(index, 1);
    }
  }

  setVariable(key: string, value: any): void {
    this.sharedContext.variables[key] = value;
    
    this.emit('context_event', {
      type: 'context_update',
      source: 'integration-manager',
      data: { variable: { key, value } },
      timestamp: new Date().toISOString()
    });
  }

  getVariable(key: string): any {
    return this.sharedContext.variables[key];
  }

  // === SESSION TRANSFER ===

  prepareSessionTransfer(): {
    transferData: any;
    instructions: string;
  } {
    const transferData = {
      sessionId: this.sharedContext.sessionId,
      context: this.sharedContext,
      integrations: Array.from(this.integrations.entries()),
      timestamp: new Date().toISOString()
    };

    const instructions = `\n🔄 **Session Transfer Ready**\n\n` +
      `**Session ID:** ${this.sharedContext.sessionId}\n` +
      `**Working Directory:** ${this.sharedContext.workingDirectory}\n` +
      `**Active Tools:** ${Array.from(this.integrations.keys()).join(', ')}\n` +
      `**Recent Commands:** ${this.sharedContext.recentCommands.length}\n\n` +
      `**To continue in new chat:**\n` +
      `\`\`\`\n` +
      `/marathon restore --session-id="${this.sharedContext.sessionId}"\n` +
      `\`\`\`\n\n` +
      `**Context preserved:** File watching, command history, active files, variables`;

    return { transferData, instructions };
  }

  restoreFromTransfer(transferData: any): void {
    this.sharedContext = transferData.context;
    
    // Restore integrations
    transferData.integrations.forEach(([name, integration]: [string, ToolIntegration]) => {
      this.integrations.set(name, integration);
    });

    // Reconnect tools
    this.initializeIntegrations();

    this.emit('context_event', {
      type: 'session_transfer',
      source: 'integration-manager',
      data: { restored: true, sessionId: this.sharedContext.sessionId },
      timestamp: new Date().toISOString()
    });
  }

  // === UTILITY METHODS ===

  private updateIntegrationStatus(name: string, status: ToolIntegration['status']): void {
    const integration = this.integrations.get(name);
    if (integration) {
      integration.status = status;
      integration.lastActivity = new Date().toISOString();
      this.integrations.set(name, integration);
    }
  }

  private syncContext(): void {
    // Sync context with all connected tools
    const connectedTools = Array.from(this.integrations.values())
      .filter(tool => tool.status === 'connected');

    this.emit('context_sync', {
      context: this.sharedContext,
      connectedTools: connectedTools.map(t => t.name)
    });
  }

  getIntegrationStatus(): ToolIntegration[] {
    return Array.from(this.integrations.values());
  }

  getRelevantContext(query?: string): any {
    const context = {
      session: this.sharedContext.sessionId,
      workingDirectory: this.sharedContext.workingDirectory,
      activeFiles: this.sharedContext.activeFiles.slice(0, 10),
      recentCommands: this.sharedContext.recentCommands.slice(0, 10),
      connectedTools: Array.from(this.integrations.values())
        .filter(tool => tool.status === 'connected')
        .map(tool => tool.name)
    };

    // Filter by query if provided
    if (query) {
      const queryLower = query.toLowerCase();
      
      // Filter active files
      context.activeFiles = context.activeFiles.filter(file =>
        file.toLowerCase().includes(queryLower)
      );
      
      // Filter recent commands
      context.recentCommands = context.recentCommands.filter(cmd =>
        cmd.command.toLowerCase().includes(queryLower) ||
        cmd.tool.toLowerCase().includes(queryLower)
      );
    }

    return context;
  }

  // === CLEANUP ===

  dispose(): void {
    // Clear interval
    if (this.contextSyncInterval) {
      clearInterval(this.contextSyncInterval);
    }

    // Close file watchers
    this.fileWatchers.forEach(watcher => watcher.close());
    this.fileWatchers.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
}

// === INTEGRATION-SPECIFIC HELPERS ===

export class DesktopCommanderBridge {
  private integrationManager: ToolIntegrationManager;

  constructor(integrationManager: ToolIntegrationManager) {
    this.integrationManager = integrationManager;
  }

  async executeCommand(command: string): Promise<{ success: boolean; result: any }> {
    try {
      // This would call the actual Desktop Commander MCP tool
      // For now, we'll simulate the call
      
      const result = {
        command,
        timestamp: new Date().toISOString(),
        output: `Simulated execution of: ${command}`
      };

      this.integrationManager.addRecentCommand('desktop-commander', command, true);
      
      return { success: true, result };
    } catch (error) {
      this.integrationManager.addRecentCommand('desktop-commander', command, false);
      return { success: false, result: { error: error.message } };
    }
  }

  async readFile(path: string): Promise<string> {
    // This would call desktop-commander:read_file
    this.integrationManager.addActiveFile(path);
    return `File content from ${path}`;
  }

  async writeFile(path: string, content: string): Promise<void> {
    // This would call desktop-commander:write_file
    this.integrationManager.addActiveFile(path);
    this.integrationManager.addRecentCommand('desktop-commander', `write_file ${path}`, true);
  }
}

export class GitHubBridge {
  private integrationManager: ToolIntegrationManager;

  constructor(integrationManager: ToolIntegrationManager) {
    this.integrationManager = integrationManager;
  }

  async createCommit(message: string, files: string[]): Promise<{ success: boolean; result: any }> {
    try {
      // This would call github MCP tools
      const result = {
        message,
        files,
        timestamp: new Date().toISOString(),
        sha: `sha_${Math.random().toString(36).substr(2, 9)}`
      };

      this.integrationManager.addRecentCommand('github', `commit: ${message}`, true);
      
      // Add files to active files
      files.forEach(file => this.integrationManager.addActiveFile(file));

      return { success: true, result };
    } catch (error) {
      this.integrationManager.addRecentCommand('github', `commit: ${message}`, false);
      return { success: false, result: { error: error.message } };
    }
  }
}
