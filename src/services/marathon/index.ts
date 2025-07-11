/**
 * Marathon Mode Manager - Advanced Session Management and Auto-Save
 */

import * as cron from 'node-cron';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { 
  MarathonState, 
  CheckpointInfo, 
  SessionData, 
  MarathonEvent,
  MCPConfig 
} from '../../types/index.js';
import { logger } from '../logger.js';
import { EventEmitter } from 'events';

export class MarathonModeManager extends EventEmitter {
  private config: MCPConfig;
  private currentState: MarathonState | null = null;
  private autoSaveTask: cron.ScheduledTask | null = null;
  private checkpointCounter = 0;
  private marathonLogger = logger.component('MarathonMode');
  private isActive = false;
  private stateFilePath: string;

  constructor(config: MCPConfig) {
    super();
    this.config = config;
    this.stateFilePath = join(config.server.dataDirectory, 'marathon-state.json');
    
    // Set up event listeners
    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    try {
      this.marathonLogger.info('Initializing Marathon Mode Manager');
      
      // Ensure marathon directory exists
      await mkdir(join(this.config.server.dataDirectory, 'marathon'), { recursive: true });
      
      // Try to load existing state
      await this.loadState();
      
      this.marathonLogger.info('Marathon Mode Manager initialized', {
        hasExistingState: !!this.currentState,
        autoSaveInterval: this.config.marathon.autoSaveInterval
      });
    } catch (error) {
      this.marathonLogger.error('Failed to initialize Marathon Mode Manager', error as Error);
      throw error;
    }
  }

  async startMarathonMode(sessionData: SessionData, taskDescription: string): Promise<MarathonState> {
    try {
      this.marathonLogger.info('Starting Marathon Mode', {
        sessionId: sessionData.id,
        taskDescription
      });
      
      this.currentState = {
        sessionId: sessionData.id,
        previousSessionId: this.currentState?.sessionId,
        taskDescription,
        timestamp: new Date().toISOString(),
        context: sessionData.context,
        commands: sessionData.commands,
        checkpoints: [],
        status: 'active',
        progress: {
          completed: 0,
          total: this.estimateTaskComplexity(taskDescription),
          percentage: 0
        }
      };
      
      // Save initial state
      await this.saveState();
      
      // Start auto-save scheduler
      this.startAutoSave();
      
      // Create initial checkpoint
      await this.createCheckpoint('Marathon Mode started', {
        taskDescription,
        initialContext: sessionData.context
      }, true);
      
      this.isActive = true;
      
      // Emit event
      this.emitMarathonEvent('checkpoint', {
        checkpointType: 'start',
        taskDescription
      });
      
      this.marathonLogger.info('Marathon Mode started successfully', {
        sessionId: this.currentState.sessionId,
        estimatedComplexity: this.currentState.progress.total
      });
      
      return this.currentState;
    } catch (error) {
      this.marathonLogger.error('Failed to start Marathon Mode', error as Error);
      throw error;
    }
  }

  async saveAndSwitch(newTaskDescription?: string): Promise<{
    savedState: MarathonState;
    continuationCommand: string;
  }> {
    if (!this.currentState) {
      throw new Error('No active Marathon Mode session');
    }

    try {
      this.marathonLogger.info('Executing save and switch', {
        sessionId: this.currentState.sessionId,
        newTaskDescription
      });
      
      // Create critical checkpoint
      await this.createCheckpoint('Save and switch checkpoint', {
        saveAndSwitch: true,
        newTaskDescription,
        currentProgress: this.currentState.progress
      }, true, true);
      
      // Update state
      this.currentState.status = 'ready_for_continuation';
      
      if (newTaskDescription) {
        this.currentState.taskDescription = newTaskDescription;
      }
      
      // Save state
      await this.saveState();
      
      // Stop auto-save temporarily
      this.stopAutoSave();
      
      // Generate continuation command
      const continuationCommand = this.generateContinuationCommand();
      
      // Emit event
      this.emitMarathonEvent('switch', {
        previousSessionId: this.currentState.sessionId,
        continuationCommand
      });
      
      this.marathonLogger.info('Save and switch completed', {
        sessionId: this.currentState.sessionId,
        continuationCommand
      });
      
      return {
        savedState: { ...this.currentState },
        continuationCommand
      };
    } catch (error) {
      this.marathonLogger.error('Failed to save and switch', error as Error);
      throw error;
    }
  }

  async continueFromPrevious(): Promise<MarathonState> {
    try {
      this.marathonLogger.info('Continuing from previous Marathon Mode session');
      
      if (!this.currentState) {
        throw new Error('No previous Marathon Mode state found');
      }
      
      if (this.currentState.status !== 'ready_for_continuation') {
        throw new Error(`Cannot continue from state: ${this.currentState.status}`);
      }
      
      // Create new session ID for continuation
      const previousSessionId = this.currentState.sessionId;
      this.currentState.sessionId = this.generateSessionId();
      this.currentState.previousSessionId = previousSessionId;
      this.currentState.status = 'active';
      this.currentState.timestamp = new Date().toISOString();
      
      // Create continuation checkpoint
      await this.createCheckpoint('Marathon Mode continued', {
        previousSessionId,
        continuedAt: new Date().toISOString()
      }, true, true);
      
      // Restart auto-save
      this.startAutoSave();
      
      this.isActive = true;
      
      // Emit event
      this.emitMarathonEvent('continue', {
        newSessionId: this.currentState.sessionId,
        previousSessionId
      });
      
      this.marathonLogger.info('Marathon Mode continuation successful', {
        newSessionId: this.currentState.sessionId,
        previousSessionId
      });
      
      return this.currentState;
    } catch (error) {
      this.marathonLogger.error('Failed to continue Marathon Mode', error as Error);
      throw error;
    }
  }

  async createCheckpoint(
    description: string,
    data: any,
    automatic: boolean = false,
    critical: boolean = false
  ): Promise<CheckpointInfo> {
    if (!this.currentState) {
      throw new Error('No active Marathon Mode session');
    }

    try {
      const checkpoint: CheckpointInfo = {
        id: `checkpoint_${Date.now()}_${++this.checkpointCounter}`,
        timestamp: new Date().toISOString(),
        description,
        data,
        automatic,
        critical
      };
      
      this.currentState.checkpoints.push(checkpoint);
      
      // Save state after checkpoint
      await this.saveState();
      
      this.marathonLogger.debug('Checkpoint created', {
        checkpointId: checkpoint.id,
        description,
        critical,
        automatic
      });
      
      // Emit event
      this.emitMarathonEvent('checkpoint', {
        checkpointId: checkpoint.id,
        description,
        critical
      });
      
      return checkpoint;
    } catch (error) {
      this.marathonLogger.error('Failed to create checkpoint', error as Error);
      throw error;
    }
  }

  async updateProgress(completed: number, total?: number): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active Marathon Mode session');
    }

    try {
      this.currentState.progress.completed = completed;
      
      if (total !== undefined) {
        this.currentState.progress.total = total;
      }
      
      this.currentState.progress.percentage = Math.min(
        100,
        (this.currentState.progress.completed / this.currentState.progress.total) * 100
      );
      
      // Auto-checkpoint on significant progress
      if (this.currentState.progress.percentage % 25 === 0) {
        await this.createCheckpoint(
          `Progress milestone: ${this.currentState.progress.percentage}%`,
          { progress: this.currentState.progress },
          true
        );
      }
      
      await this.saveState();
      
      this.marathonLogger.debug('Progress updated', {
        completed,
        total: this.currentState.progress.total,
        percentage: this.currentState.progress.percentage
      });
    } catch (error) {
      this.marathonLogger.error('Failed to update progress', error as Error);
    }
  }

  async endMarathonMode(reason: 'completed' | 'cancelled' | 'error' = 'completed'): Promise<void> {
    if (!this.currentState) {
      return;
    }

    try {
      this.marathonLogger.info('Ending Marathon Mode', {
        sessionId: this.currentState.sessionId,
        reason
      });
      
      // Create final checkpoint
      await this.createCheckpoint(`Marathon Mode ended: ${reason}`, {
        reason,
        finalProgress: this.currentState.progress,
        duration: Date.now() - new Date(this.currentState.timestamp).getTime()
      }, true, true);
      
      // Update state
      this.currentState.status = 'completed';
      
      // Save final state
      await this.saveState();
      
      // Stop auto-save
      this.stopAutoSave();
      
      this.isActive = false;
      
      // Emit event
      this.emitMarathonEvent('completed', {
        sessionId: this.currentState.sessionId,
        reason,
        finalProgress: this.currentState.progress
      });
      
      this.marathonLogger.info('Marathon Mode ended successfully', {
        sessionId: this.currentState.sessionId,
        reason,
        checkpointCount: this.currentState.checkpoints.length
      });
      
      // Clear current state
      this.currentState = null;
    } catch (error) {
      this.marathonLogger.error('Error ending Marathon Mode', error as Error);
    }
  }

  getCurrentState(): MarathonState | null {
    return this.currentState;
  }

  isMarathonActive(): boolean {
    return this.isActive && !!this.currentState;
  }

  private startAutoSave(): void {
    if (this.autoSaveTask) {
      this.autoSaveTask.destroy();
    }
    
    const interval = `*/${this.config.marathon.autoSaveInterval} * * * *`; // Every N minutes
    
    this.autoSaveTask = cron.schedule(interval, async () => {
      if (this.currentState && this.isActive) {
        await this.performAutoSave();
      }
    });
    
    this.marathonLogger.debug('Auto-save scheduler started', {
      interval: this.config.marathon.autoSaveInterval
    });
  }

  private stopAutoSave(): void {
    if (this.autoSaveTask) {
      this.autoSaveTask.destroy();
      this.autoSaveTask = null;
      this.marathonLogger.debug('Auto-save scheduler stopped');
    }
  }

  private async performAutoSave(): Promise<void> {
    try {
      if (!this.currentState) return;
      
      this.marathonLogger.debug('Performing auto-save', {
        sessionId: this.currentState.sessionId
      });
      
      // Create auto-save checkpoint
      await this.createCheckpoint(
        'Auto-save checkpoint',
        {
          autoSave: true,
          timestamp: new Date().toISOString()
        },
        true
      );
      
      // Check if session should be switched due to duration
      const sessionDuration = Date.now() - new Date(this.currentState.timestamp).getTime();
      const maxDuration = this.config.marathon.maxSessionDuration * 60 * 1000; // Convert to ms
      
      if (sessionDuration > maxDuration) {
        this.marathonLogger.info('Session duration exceeded, recommending switch', {
          sessionId: this.currentState.sessionId,
          duration: sessionDuration,
          maxDuration
        });
        
        this.emit('recommendSwitch', {
          reason: 'duration_exceeded',
          sessionId: this.currentState.sessionId,
          duration: sessionDuration
        });
      }
    } catch (error) {
      this.marathonLogger.error('Auto-save failed', error as Error);
    }
  }

  private async loadState(): Promise<void> {
    try {
      const stateData = await readFile(this.stateFilePath, 'utf-8');
      this.currentState = JSON.parse(stateData);
      
      this.marathonLogger.debug('Marathon state loaded', {
        sessionId: this.currentState?.sessionId,
        status: this.currentState?.status
      });
    } catch (error) {
      // No existing state file or invalid format
      this.marathonLogger.debug('No existing Marathon state found');
    }
  }

  private async saveState(): Promise<void> {
    if (!this.currentState) return;
    
    try {
      await writeFile(this.stateFilePath, JSON.stringify(this.currentState, null, 2), 'utf-8');
      this.marathonLogger.trace('Marathon state saved');
    } catch (error) {
      this.marathonLogger.error('Failed to save Marathon state', error as Error);
      throw error;
    }
  }

  private generateContinuationCommand(): string {
    if (!this.currentState) {
      return '--- +++ ... *** Continue previous session';
    }
    
    return `--- +++ ... *** Continue ${this.currentState.taskDescription} from previous session (${this.currentState.sessionId})`;
  }

  private generateSessionId(): string {
    return `marathon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTaskComplexity(taskDescription: string): number {
    // Simple heuristic for task complexity
    let complexity = 10; // Base complexity
    
    // Add complexity based on description length
    complexity += Math.min(taskDescription.length / 10, 20);
    
    // Add complexity based on keywords
    const complexKeywords = ['deploy', 'integrate', 'configure', 'setup', 'develop', 'analyze'];
    complexKeywords.forEach(keyword => {
      if (taskDescription.toLowerCase().includes(keyword)) {
        complexity += 5;
      }
    });
    
    return Math.max(10, Math.min(complexity, 100));
  }

  private emitMarathonEvent(type: MarathonEvent['type'], data: any): void {
    const event: MarathonEvent = {
      type,
      timestamp: new Date().toISOString(),
      sessionId: this.currentState?.sessionId || 'unknown',
      data,
      metadata: {
        isActive: this.isActive,
        checkpointCount: this.currentState?.checkpoints.length || 0
      }
    };
    
    this.emit('marathonEvent', event);
  }

  private setupEventHandlers(): void {
    // Handle recommendation to switch sessions
    this.on('recommendSwitch', (data) => {
      this.marathonLogger.warn('Session switch recommended', data);
    });
    
    // Handle errors
    this.on('error', (error) => {
      this.marathonLogger.error('Marathon Mode error', error);
    });
  }

  async shutdown(): Promise<void> {
    try {
      this.marathonLogger.info('Shutting down Marathon Mode Manager');
      
      // Stop auto-save
      this.stopAutoSave();
      
      // Save current state if active
      if (this.currentState && this.isActive) {
        await this.saveState();
      }
      
      this.marathonLogger.info('Marathon Mode Manager shutdown completed');
    } catch (error) {
      this.marathonLogger.error('Error during Marathon Mode Manager shutdown', error as Error);
    }
  }
}