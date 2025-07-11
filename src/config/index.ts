/**
 * Configuration management for Claude Knowledge Base MCP
 */

import { homedir } from 'os';
import { join } from 'path';
import type { MCPConfig } from '../types/index.js';

/**
 * Default configuration values
 */
const defaultConfig: MCPConfig = {
  server: {
    name: 'claude-knowledge-base',
    version: '2.0.0',
    dataDirectory: process.env.KB_DATA_DIR || join(homedir(), '.claude-knowledge-base')
  },
  marathon: {
    autoSaveInterval: 5, // minutes
    maxSessionDuration: 60, // minutes
    checkpointThreshold: 10, // commands
    compressionEnabled: true
  },
  memory: {
    vectorDimensions: 1536, // OpenAI embedding dimensions
    maxMemorySize: 1000, // MB
    retentionDays: 90,
    embeddingModel: 'text-embedding-ada-002'
  },
  integrations: {
    n8n: {
      enabled: process.env.N8N_ENABLED === 'true',
      baseUrl: process.env.N8N_BASE_URL || 'https://n8n.acura.ge',
      apiKey: process.env.N8N_API_KEY
    },
    supabase: {
      enabled: process.env.SUPABASE_ENABLED === 'true',
      url: process.env.SUPABASE_URL || 'https://supabase-api.acura.ge',
      apiKey: process.env.SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_KEY
    },
    chrome: {
      enabled: process.env.CHROME_ENABLED === 'true',
      baseUrl: process.env.CHROME_BASE_URL || 'https://chrome.acura.ge',
      apiToken: process.env.CHROME_API_TOKEN
    },
    erpnext: {
      enabled: process.env.ERPNEXT_ENABLED === 'true',
      baseUrl: process.env.ERPNEXT_BASE_URL || 'https://erp.acura.ge',
      username: process.env.ERPNEXT_USERNAME,
      password: process.env.ERPNEXT_PASSWORD
    }
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    interval: parseInt(process.env.MONITORING_INTERVAL || '30'),
    healthChecks: true,
    metricsCollection: true
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED === 'true',
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000')
    },
    authentication: {
      required: process.env.AUTH_REQUIRED === 'true',
      type: (process.env.AUTH_TYPE as 'none' | 'token' | 'oauth') || 'none'
    }
  }
};

/**
 * Get configuration with environment overrides
 */
export function getConfig(): MCPConfig {
  return {
    ...defaultConfig,
    // Allow runtime overrides
    server: {
      ...defaultConfig.server,
      name: process.env.MCP_SERVER_NAME || defaultConfig.server.name,
      version: process.env.MCP_SERVER_VERSION || defaultConfig.server.version
    }
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: MCPConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate server config
  if (!config.server.name) {
    errors.push('Server name is required');
  }
  if (!config.server.version) {
    errors.push('Server version is required');
  }
  if (!config.server.dataDirectory) {
    errors.push('Data directory is required');
  }

  // Validate marathon config
  if (config.marathon.autoSaveInterval < 1) {
    errors.push('Marathon auto-save interval must be at least 1 minute');
  }
  if (config.marathon.maxSessionDuration < 10) {
    errors.push('Marathon max session duration must be at least 10 minutes');
  }

  // Validate memory config
  if (config.memory.vectorDimensions < 1) {
    errors.push('Vector dimensions must be positive');
  }
  if (config.memory.maxMemorySize < 10) {
    errors.push('Max memory size must be at least 10 MB');
  }

  // Validate enabled integrations have required config
  Object.entries(config.integrations).forEach(([name, integration]) => {
    if (integration.enabled && !integration.baseUrl) {
      errors.push(`${name} integration is enabled but missing baseUrl`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Environment configuration helper
 */
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  logLevel: process.env.LOG_LEVEL || 'info',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost'
};

/**
 * Integration status helper
 */
export function getIntegrationStatus(config: MCPConfig) {
  return {
    n8n: config.integrations.n8n.enabled && !!config.integrations.n8n.baseUrl,
    supabase: config.integrations.supabase.enabled && !!config.integrations.supabase.url,
    chrome: config.integrations.chrome.enabled && !!config.integrations.chrome.baseUrl,
    erpnext: config.integrations.erpnext.enabled && !!config.integrations.erpnext.baseUrl
  };
}

export default getConfig;