/**
 * Supabase Integration Service
 */

import type { IntegrationResponse, ComponentHealth } from '../../types/index.js';
import { logger } from '../logger.js';

interface SupabaseConfig {
  enabled: boolean;
  url: string;
  apiKey?: string;
  serviceKey?: string;
}

export class SupabaseIntegration {
  private config: SupabaseConfig;
  private supabaseLogger = logger.component('SupabaseIntegration');
  private isInitialized = false;

  constructor(config: SupabaseConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.supabaseLogger.info('Supabase integration is disabled');
      return;
    }

    try {
      this.supabaseLogger.info('Initializing Supabase integration', {
        url: this.config.url
      });
      
      // Test connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.supabaseLogger.info('Supabase integration initialized successfully');
    } catch (error) {
      this.supabaseLogger.error('Failed to initialize Supabase integration', error as Error);
      throw error;
    }
  }

  async insertData(table: string, data: any): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.supabaseLogger.debug('Inserting data into Supabase', {
        table,
        dataKeys: Object.keys(data || {})
      });
      
      const response = await fetch(`${this.config.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.serviceKey || this.config.apiKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${result.message || response.statusText}`);
      }
      
      this.supabaseLogger.info('Data inserted into Supabase successfully', {
        table,
        recordCount: Array.isArray(result) ? result.length : 1,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.supabaseLogger.error('Failed to insert data into Supabase', error as Error, {
        table
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    }
  }

  async queryData(table: string, query: any = {}): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.supabaseLogger.debug('Querying data from Supabase', {
        table,
        queryParams: Object.keys(query)
      });
      
      // Build query string
      const queryParams = new URLSearchParams();
      
      // Handle select
      if (query.select) {
        queryParams.append('select', query.select);
      }
      
      // Handle filters
      Object.entries(query.filters || {}).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      
      // Handle ordering
      if (query.order) {
        queryParams.append('order', query.order);
      }
      
      // Handle limit
      if (query.limit) {
        queryParams.append('limit', String(query.limit));
      }
      
      const url = `${this.config.url}/rest/v1/${table}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.serviceKey || this.config.apiKey}`
        }
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${result.message || response.statusText}`);
      }
      
      this.supabaseLogger.debug('Data queried from Supabase successfully', {
        table,
        recordCount: Array.isArray(result) ? result.length : 1,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.supabaseLogger.error('Failed to query data from Supabase', error as Error, {
        table
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    }
  }

  async vectorSearch(query: string, table: string = 'memory_vectors'): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.supabaseLogger.debug('Performing vector search in Supabase', {
        query,
        table
      });
      
      // This would use Supabase's vector search capabilities
      // For now, we'll do a simple text search
      const response = await fetch(`${this.config.url}/rest/v1/${table}?content=ilike.*${encodeURIComponent(query)}*`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.serviceKey || this.config.apiKey}`
        }
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${result.message || response.statusText}`);
      }
      
      this.supabaseLogger.debug('Vector search completed successfully', {
        query,
        resultCount: Array.isArray(result) ? result.length : 0,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.supabaseLogger.error('Vector search failed', error as Error, {
        query,
        table
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'supabase'
      };
    }
  }

  async healthCheck(): Promise<ComponentHealth> {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.config.url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': this.config.apiKey || '',
          'Authorization': `Bearer ${this.config.apiKey}`
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
        message: status === 'healthy' ? 'Supabase is responding normally' : `High response time: ${responseTime.toFixed(2)}ms`
      };
    } catch (error) {
      this.supabaseLogger.error('Supabase health check failed', error as Error);
      
      return {
        status: 'critical',
        message: `Health check failed: ${(error as Error).message}`
      };
    }
  }

  async shutdown(): Promise<void> {
    this.supabaseLogger.info('Shutting down Supabase integration');
    this.isInitialized = false;
  }
}