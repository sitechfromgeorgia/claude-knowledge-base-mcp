/**
 * n8n Integration Service
 */

import type { IntegrationResponse, ComponentHealth } from '../../types/index.js';
import { logger } from '../logger.js';

interface N8nConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey?: string;
}

export class N8nIntegration {
  private config: N8nConfig;
  private n8nLogger = logger.component('N8nIntegration');
  private isInitialized = false;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.n8nLogger.info('n8n integration is disabled');
      return;
    }

    try {
      this.n8nLogger.info('Initializing n8n integration', {
        baseUrl: this.config.baseUrl
      });
      
      // Test connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.n8nLogger.info('n8n integration initialized successfully');
    } catch (error) {
      this.n8nLogger.error('Failed to initialize n8n integration', error as Error);
      throw error;
    }
  }

  async triggerWorkflow(workflowId: string, data: any): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.n8nLogger.debug('Triggering n8n workflow', {
        workflowId,
        dataKeys: Object.keys(data || {})
      });
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`n8n API error: ${result.message || response.statusText}`);
      }
      
      this.n8nLogger.info('n8n workflow executed successfully', {
        workflowId,
        executionId: result.data?.id,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.n8nLogger.error('Failed to trigger n8n workflow', error as Error, {
        workflowId
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    }
  }

  async getWorkflows(): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.n8nLogger.debug('Fetching n8n workflows');
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        }
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`n8n API error: ${result.message || response.statusText}`);
      }
      
      this.n8nLogger.debug('n8n workflows fetched successfully', {
        workflowCount: result.data?.length || 0,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.n8nLogger.error('Failed to fetch n8n workflows', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    }
  }

  async createWebhook(workflowData: any): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.n8nLogger.debug('Creating n8n webhook');
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        },
        body: JSON.stringify(workflowData)
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`n8n API error: ${result.message || response.statusText}`);
      }
      
      this.n8nLogger.info('n8n webhook created successfully', {
        workflowId: result.data?.id,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.n8nLogger.error('Failed to create n8n webhook', error as Error);
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'n8n'
      };
    }
  }

  async healthCheck(): Promise<ComponentHealth> {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.config.baseUrl}/healthz`, {
        method: 'GET',
        headers: {
          ...(this.config.apiKey && { 'X-N8N-API-KEY': this.config.apiKey })
        }
      });
      
      const responseTime = performance.now() - startTime;
      
      if (!response.ok) {
        return {
          status: 'critical',
          responseTime,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      // Check response time thresholds
      let status: ComponentHealth['status'];
      if (responseTime > 5000) {
        status = 'critical';
      } else if (responseTime > 2000) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }
      
      return {
        status,
        responseTime,
        message: status === 'healthy' ? 'n8n is responding normally' : `High response time: ${responseTime.toFixed(2)}ms`
      };
    } catch (error) {
      this.n8nLogger.error('n8n health check failed', error as Error);
      
      return {
        status: 'critical',
        message: `Health check failed: ${(error as Error).message}`
      };
    }
  }

  async shutdown(): Promise<void> {
    this.n8nLogger.info('Shutting down n8n integration');
    this.isInitialized = false;
  }
}