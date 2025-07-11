/**
 * Integration Services for External Tools and APIs
 */

import type { MCPConfig, IntegrationResponse, SystemHealth, ComponentHealth } from '../../types/index.js';
import { logger } from '../logger.js';
import { N8nIntegration } from './n8n.js';
import { SupabaseIntegration } from './supabase.js';
import { ChromeIntegration } from './chrome.js';
import { ERPNextIntegration } from './erpnext.js';

export class IntegrationManager {
  private config: MCPConfig;
  private n8n: N8nIntegration;
  private supabase: SupabaseIntegration;
  private chrome: ChromeIntegration;
  private erpnext: ERPNextIntegration;
  private integrationLogger = logger.component('IntegrationManager');
  private healthChecks: Map<string, () => Promise<ComponentHealth>> = new Map();

  constructor(config: MCPConfig) {
    this.config = config;
    
    // Initialize integrations
    this.n8n = new N8nIntegration(config.integrations.n8n);
    this.supabase = new SupabaseIntegration(config.integrations.supabase);
    this.chrome = new ChromeIntegration(config.integrations.chrome);
    this.erpnext = new ERPNextIntegration(config.integrations.erpnext);
    
    // Register health checks
    this.registerHealthChecks();
  }

  async initialize(): Promise<void> {
    this.integrationLogger.info('Initializing integration manager');
    
    const initPromises: Promise<void>[] = [];
    
    if (this.config.integrations.n8n.enabled) {
      initPromises.push(this.n8n.initialize());
    }
    
    if (this.config.integrations.supabase.enabled) {
      initPromises.push(this.supabase.initialize());
    }
    
    if (this.config.integrations.chrome.enabled) {
      initPromises.push(this.chrome.initialize());
    }
    
    if (this.config.integrations.erpnext.enabled) {
      initPromises.push(this.erpnext.initialize());
    }
    
    try {
      await Promise.all(initPromises);
      this.integrationLogger.info('All enabled integrations initialized successfully');
    } catch (error) {
      this.integrationLogger.error('Failed to initialize some integrations', error as Error);
      throw error;
    }
  }

  // N8n Operations
  async triggerN8nWorkflow(workflowId: string, data: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.n8n.enabled) {
      throw new Error('n8n integration is disabled');
    }
    
    return await this.n8n.triggerWorkflow(workflowId, data);
  }

  async getN8nWorkflows(): Promise<IntegrationResponse> {
    if (!this.config.integrations.n8n.enabled) {
      throw new Error('n8n integration is disabled');
    }
    
    return await this.n8n.getWorkflows();
  }

  async createN8nWebhook(workflowData: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.n8n.enabled) {
      throw new Error('n8n integration is disabled');
    }
    
    return await this.n8n.createWebhook(workflowData);
  }

  // Supabase Operations
  async storeInSupabase(table: string, data: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.supabase.enabled) {
      throw new Error('Supabase integration is disabled');
    }
    
    return await this.supabase.insertData(table, data);
  }

  async querySupabase(table: string, query: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.supabase.enabled) {
      throw new Error('Supabase integration is disabled');
    }
    
    return await this.supabase.queryData(table, query);
  }

  async searchSupabaseVectors(query: string, table: string = 'memory_vectors'): Promise<IntegrationResponse> {
    if (!this.config.integrations.supabase.enabled) {
      throw new Error('Supabase integration is disabled');
    }
    
    return await this.supabase.vectorSearch(query, table);
  }

  // Chrome API Operations
  async takeScreenshot(url: string, options?: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.chrome.enabled) {
      throw new Error('Chrome integration is disabled');
    }
    
    return await this.chrome.screenshot(url, options);
  }

  async generatePDF(url: string, options?: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.chrome.enabled) {
      throw new Error('Chrome integration is disabled');
    }
    
    return await this.chrome.generatePDF(url, options);
  }

  async scrapeWebContent(url: string, selectors: any[]): Promise<IntegrationResponse> {
    if (!this.config.integrations.chrome.enabled) {
      throw new Error('Chrome integration is disabled');
    }
    
    return await this.chrome.scrapeContent(url, selectors);
  }

  // ERPNext Operations
  async getERPNextData(doctype: string, filters?: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.erpnext.enabled) {
      throw new Error('ERPNext integration is disabled');
    }
    
    return await this.erpnext.getData(doctype, filters);
  }

  async createERPNextRecord(doctype: string, data: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.erpnext.enabled) {
      throw new Error('ERPNext integration is disabled');
    }
    
    return await this.erpnext.createRecord(doctype, data);
  }

  async updateERPNextRecord(doctype: string, name: string, data: any): Promise<IntegrationResponse> {
    if (!this.config.integrations.erpnext.enabled) {
      throw new Error('ERPNext integration is disabled');
    }
    
    return await this.erpnext.updateRecord(doctype, name, data);
  }

  // Health Monitoring
  async getSystemHealth(): Promise<SystemHealth> {
    this.integrationLogger.debug('Performing system health check');
    
    const components: Record<string, ComponentHealth> = {};
    
    // Check each integration
    for (const [name, healthCheck] of this.healthChecks) {
      try {
        components[name] = await healthCheck();
      } catch (error) {
        components[name] = {
          status: 'critical',
          message: `Health check failed: ${(error as Error).message}`
        };
      }
    }
    
    // Determine overall health
    const statuses = Object.values(components).map(c => c.status);
    let overall: SystemHealth['overall'];
    
    if (statuses.includes('critical')) {
      overall = 'critical';
    } else if (statuses.includes('degraded')) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    const health: SystemHealth = {
      overall,
      components,
      lastCheck: new Date().toISOString()
    };
    
    this.integrationLogger.debug('System health check completed', {
      overall,
      componentCount: Object.keys(components).length
    });
    
    return health;
  }

  // Get available integrations
  getAvailableIntegrations(): Record<string, boolean> {
    return {
      n8n: this.config.integrations.n8n.enabled,
      supabase: this.config.integrations.supabase.enabled,
      chrome: this.config.integrations.chrome.enabled,
      erpnext: this.config.integrations.erpnext.enabled
    };
  }

  // Execute combined workflow
  async executeWorkflow(workflow: {
    name: string;
    steps: Array<{
      integration: 'n8n' | 'supabase' | 'chrome' | 'erpnext';
      action: string;
      parameters: any;
    }>;
  }): Promise<{
    success: boolean;
    results: IntegrationResponse[];
    errors: string[];
  }> {
    this.integrationLogger.info('Executing combined workflow', {
      workflowName: workflow.name,
      stepCount: workflow.steps.length
    });
    
    const results: IntegrationResponse[] = [];
    const errors: string[] = [];
    
    for (const [index, step] of workflow.steps.entries()) {
      try {
        this.integrationLogger.debug(`Executing workflow step ${index + 1}`, {
          integration: step.integration,
          action: step.action
        });
        
        let result: IntegrationResponse;
        
        switch (step.integration) {
          case 'n8n':
            result = await this.executeN8nStep(step.action, step.parameters);
            break;
          case 'supabase':
            result = await this.executeSupabaseStep(step.action, step.parameters);
            break;
          case 'chrome':
            result = await this.executeChromeStep(step.action, step.parameters);
            break;
          case 'erpnext':
            result = await this.executeERPNextStep(step.action, step.parameters);
            break;
          default:
            throw new Error(`Unknown integration: ${step.integration}`);
        }
        
        results.push(result);
        
        if (!result.success) {
          errors.push(`Step ${index + 1} failed: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = `Step ${index + 1} error: ${(error as Error).message}`;
        errors.push(errorMsg);
        this.integrationLogger.error('Workflow step failed', error as Error, {
          stepIndex: index + 1,
          integration: step.integration,
          action: step.action
        });
      }
    }
    
    const success = errors.length === 0;
    
    this.integrationLogger.info('Workflow execution completed', {
      workflowName: workflow.name,
      success,
      errorCount: errors.length
    });
    
    return {
      success,
      results,
      errors
    };
  }

  private registerHealthChecks(): void {
    if (this.config.integrations.n8n.enabled) {
      this.healthChecks.set('n8n', () => this.n8n.healthCheck());
    }
    
    if (this.config.integrations.supabase.enabled) {
      this.healthChecks.set('supabase', () => this.supabase.healthCheck());
    }
    
    if (this.config.integrations.chrome.enabled) {
      this.healthChecks.set('chrome', () => this.chrome.healthCheck());
    }
    
    if (this.config.integrations.erpnext.enabled) {
      this.healthChecks.set('erpnext', () => this.erpnext.healthCheck());
    }
  }

  private async executeN8nStep(action: string, parameters: any): Promise<IntegrationResponse> {
    switch (action) {
      case 'trigger_workflow':
        return await this.n8n.triggerWorkflow(parameters.workflowId, parameters.data);
      case 'get_workflows':
        return await this.n8n.getWorkflows();
      case 'create_webhook':
        return await this.n8n.createWebhook(parameters);
      default:
        throw new Error(`Unknown n8n action: ${action}`);
    }
  }

  private async executeSupabaseStep(action: string, parameters: any): Promise<IntegrationResponse> {
    switch (action) {
      case 'insert':
        return await this.supabase.insertData(parameters.table, parameters.data);
      case 'query':
        return await this.supabase.queryData(parameters.table, parameters.query);
      case 'vector_search':
        return await this.supabase.vectorSearch(parameters.query, parameters.table);
      default:
        throw new Error(`Unknown Supabase action: ${action}`);
    }
  }

  private async executeChromeStep(action: string, parameters: any): Promise<IntegrationResponse> {
    switch (action) {
      case 'screenshot':
        return await this.chrome.screenshot(parameters.url, parameters.options);
      case 'pdf':
        return await this.chrome.generatePDF(parameters.url, parameters.options);
      case 'scrape':
        return await this.chrome.scrapeContent(parameters.url, parameters.selectors);
      default:
        throw new Error(`Unknown Chrome action: ${action}`);
    }
  }

  private async executeERPNextStep(action: string, parameters: any): Promise<IntegrationResponse> {
    switch (action) {
      case 'get_data':
        return await this.erpnext.getData(parameters.doctype, parameters.filters);
      case 'create_record':
        return await this.erpnext.createRecord(parameters.doctype, parameters.data);
      case 'update_record':
        return await this.erpnext.updateRecord(parameters.doctype, parameters.name, parameters.data);
      default:
        throw new Error(`Unknown ERPNext action: ${action}`);
    }
  }

  async shutdown(): Promise<void> {
    this.integrationLogger.info('Shutting down integration manager');
    
    const shutdownPromises: Promise<void>[] = [];
    
    if (this.config.integrations.n8n.enabled) {
      shutdownPromises.push(this.n8n.shutdown());
    }
    
    if (this.config.integrations.supabase.enabled) {
      shutdownPromises.push(this.supabase.shutdown());
    }
    
    if (this.config.integrations.chrome.enabled) {
      shutdownPromises.push(this.chrome.shutdown());
    }
    
    if (this.config.integrations.erpnext.enabled) {
      shutdownPromises.push(this.erpnext.shutdown());
    }
    
    try {
      await Promise.all(shutdownPromises);
      this.integrationLogger.info('Integration manager shutdown completed');
    } catch (error) {
      this.integrationLogger.error('Error during integration manager shutdown', error as Error);
    }
  }
}