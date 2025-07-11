/**
 * ERPNext Integration Service
 */

import type { IntegrationResponse, ComponentHealth } from '../../types/index.js';
import { logger } from '../logger.js';

interface ERPNextConfig {
  enabled: boolean;
  baseUrl: string;
  username?: string;
  password?: string;
}

export class ERPNextIntegration {
  private config: ERPNextConfig;
  private erpnextLogger = logger.component('ERPNextIntegration');
  private isInitialized = false;
  private sessionCookie: string | null = null;

  constructor(config: ERPNextConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.erpnextLogger.info('ERPNext integration is disabled');
      return;
    }

    try {
      this.erpnextLogger.info('Initializing ERPNext integration', {
        baseUrl: this.config.baseUrl
      });
      
      // Authenticate if credentials provided
      if (this.config.username && this.config.password) {
        await this.authenticate();
      }
      
      // Test connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.erpnextLogger.info('ERPNext integration initialized successfully');
    } catch (error) {
      this.erpnextLogger.error('Failed to initialize ERPNext integration', error as Error);
      throw error;
    }
  }

  async getData(doctype: string, filters: any = {}): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.erpnextLogger.debug('Fetching ERPNext data', {
        doctype,
        filters: Object.keys(filters)
      });
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('doctype', doctype);
      
      if (Object.keys(filters).length > 0) {
        queryParams.append('filters', JSON.stringify(filters));
      }
      
      const response = await fetch(`${this.config.baseUrl}/api/resource/${doctype}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        }
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`ERPNext API error: ${result.message || response.statusText}`);
      }
      
      this.erpnextLogger.debug('ERPNext data fetched successfully', {
        doctype,
        recordCount: result.data?.length || 0,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.erpnextLogger.error('Failed to fetch ERPNext data', error as Error, {
        doctype
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    }
  }

  async createRecord(doctype: string, data: any): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.erpnextLogger.debug('Creating ERPNext record', {
        doctype,
        dataKeys: Object.keys(data || {})
      });
      
      const response = await fetch(`${this.config.baseUrl}/api/resource/${doctype}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`ERPNext API error: ${result.message || response.statusText}`);
      }
      
      this.erpnextLogger.info('ERPNext record created successfully', {
        doctype,
        recordName: result.data?.name,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.erpnextLogger.error('Failed to create ERPNext record', error as Error, {
        doctype
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    }
  }

  async updateRecord(doctype: string, name: string, data: any): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.erpnextLogger.debug('Updating ERPNext record', {
        doctype,
        name,
        dataKeys: Object.keys(data || {})
      });
      
      const response = await fetch(`${this.config.baseUrl}/api/resource/${doctype}/${name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`ERPNext API error: ${result.message || response.statusText}`);
      }
      
      this.erpnextLogger.info('ERPNext record updated successfully', {
        doctype,
        name,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result.data,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.erpnextLogger.error('Failed to update ERPNext record', error as Error, {
        doctype,
        name
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'erpnext'
      };
    }
  }

  private async authenticate(): Promise<void> {
    try {
      this.erpnextLogger.debug('Authenticating with ERPNext');
      
      const response = await fetch(`${this.config.baseUrl}/api/method/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usr: this.config.username,
          pwd: this.config.password
        })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
      
      // Extract session cookie
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        this.sessionCookie = setCookieHeader;
      }
      
      this.erpnextLogger.info('ERPNext authentication successful');
    } catch (error) {
      this.erpnextLogger.error('ERPNext authentication failed', error as Error);
      throw error;
    }
  }

  async healthCheck(): Promise<ComponentHealth> {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.config.baseUrl}/api/method/ping`, {
        method: 'GET',
        headers: {
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie })
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
      if (responseTime > 8000) {
        status = 'critical';
      } else if (responseTime > 4000) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }
      
      return {
        status,
        responseTime,
        message: status === 'healthy' ? 'ERPNext is responding normally' : `High response time: ${responseTime.toFixed(2)}ms`
      };
    } catch (error) {
      this.erpnextLogger.error('ERPNext health check failed', error as Error);
      
      return {
        status: 'critical',
        message: `Health check failed: ${(error as Error).message}`
      };
    }
  }

  async shutdown(): Promise<void> {
    this.erpnextLogger.info('Shutting down ERPNext integration');
    this.sessionCookie = null;
    this.isInitialized = false;
  }
}