/**
 * Advanced logging service for Claude Knowledge Base MCP
 */

import { ENV } from '../config/index.js';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  sessionId?: string;
  component?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(level: LogLevel = 'info') {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'trace'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formatted = `[${timestamp}] ${levelStr} ${message}`;
    
    if (context) {
      formatted += ` | ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      component: context?.component
    };

    // Store in memory (rotating buffer)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const formatted = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'error':
        console.error(formatted, error || '');
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
      case 'trace':
        if (ENV.isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context);
  }

  // Session-aware logging
  session(sessionId: string) {
    return {
      error: (message: string, error?: Error, context?: Record<string, any>) => 
        this.error(message, error, { ...context, sessionId }),
      warn: (message: string, context?: Record<string, any>) => 
        this.warn(message, { ...context, sessionId }),
      info: (message: string, context?: Record<string, any>) => 
        this.info(message, { ...context, sessionId }),
      debug: (message: string, context?: Record<string, any>) => 
        this.debug(message, { ...context, sessionId }),
      trace: (message: string, context?: Record<string, any>) => 
        this.trace(message, { ...context, sessionId })
    };
  }

  // Component-aware logging
  component(componentName: string) {
    return {
      error: (message: string, error?: Error, context?: Record<string, any>) => 
        this.error(message, error, { ...context, component: componentName }),
      warn: (message: string, context?: Record<string, any>) => 
        this.warn(message, { ...context, component: componentName }),
      info: (message: string, context?: Record<string, any>) => 
        this.info(message, { ...context, component: componentName }),
      debug: (message: string, context?: Record<string, any>) => 
        this.debug(message, { ...context, component: componentName }),
      trace: (message: string, context?: Record<string, any>) => 
        this.trace(message, { ...context, component: componentName })
    };
  }

  // Get recent logs
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  // Get logs by session
  getLogsBySession(sessionId: string, count: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.sessionId === sessionId)
      .slice(-count);
  }

  // Performance timing
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`Timer [${label}]: ${duration.toFixed(2)}ms`);
    };
  }

  // Clear logs
  clear(): void {
    this.logs = [];
  }

  // Set log level dynamically
  setLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }

  // Get current level
  getLevel(): LogLevel {
    return this.logLevel;
  }
}

// Create singleton instance
export const logger = new Logger(ENV.logLevel as LogLevel);

// Export for testing
export { Logger };