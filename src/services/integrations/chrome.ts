/**
 * Chrome Puppeteer Integration Service
 */

import type { IntegrationResponse, ComponentHealth } from '../../types/index.js';
import { logger } from '../logger.js';

interface ChromeConfig {
  enabled: boolean;
  baseUrl: string;
  apiToken?: string;
}

export class ChromeIntegration {
  private config: ChromeConfig;
  private chromeLogger = logger.component('ChromeIntegration');
  private isInitialized = false;

  constructor(config: ChromeConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.chromeLogger.info('Chrome integration is disabled');
      return;
    }

    try {
      this.chromeLogger.info('Initializing Chrome integration', {
        baseUrl: this.config.baseUrl
      });
      
      // Test connection
      await this.healthCheck();
      
      this.isInitialized = true;
      this.chromeLogger.info('Chrome integration initialized successfully');
    } catch (error) {
      this.chromeLogger.error('Failed to initialize Chrome integration', error as Error);
      throw error;
    }
  }

  async screenshot(url: string, options: any = {}): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.chromeLogger.debug('Taking screenshot', {
        url,
        options: Object.keys(options)
      });
      
      const response = await fetch(`${this.config.baseUrl}/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiToken && { 'Authorization': `Bearer ${this.config.apiToken}` })
        },
        body: JSON.stringify({
          url,
          options: {
            fullPage: true,
            type: 'png',
            ...options
          }
        })
      });
      
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chrome API error: ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      
      this.chromeLogger.info('Screenshot taken successfully', {
        url,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.chromeLogger.error('Failed to take screenshot', error as Error, {
        url
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    }
  }

  async generatePDF(url: string, options: any = {}): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.chromeLogger.debug('Generating PDF', {
        url,
        options: Object.keys(options)
      });
      
      const response = await fetch(`${this.config.baseUrl}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiToken && { 'Authorization': `Bearer ${this.config.apiToken}` })
        },
        body: JSON.stringify({
          url,
          options: {
            format: 'A4',
            printBackground: true,
            ...options
          }
        })
      });
      
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chrome API error: ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      
      this.chromeLogger.info('PDF generated successfully', {
        url,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.chromeLogger.error('Failed to generate PDF', error as Error, {
        url
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    }
  }

  async scrapeContent(url: string, selectors: any[]): Promise<IntegrationResponse> {
    const startTime = performance.now();
    
    try {
      this.chromeLogger.debug('Scraping content', {
        url,
        selectorCount: selectors.length
      });
      
      const response = await fetch(`${this.config.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiToken && { 'Authorization': `Bearer ${this.config.apiToken}` })
        },
        body: JSON.stringify({
          url,
          elements: selectors
        })
      });
      
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chrome API error: ${errorText || response.statusText}`);
      }
      
      const result = await response.json();
      
      this.chromeLogger.info('Content scraped successfully', {
        url,
        elementCount: Object.keys(result.data || {}).length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return {
        success: true,
        data: result,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.chromeLogger.error('Failed to scrape content', error as Error, {
        url
      });
      
      return {
        success: false,
        error: (error as Error).message,
        duration,
        timestamp: new Date().toISOString(),
        service: 'chrome'
      };
    }
  }

  async healthCheck(): Promise<ComponentHealth> {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: {
          ...(this.config.apiToken && { 'Authorization': `Bearer ${this.config.apiToken}` })
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
      if (responseTime > 10000) {
        status = 'critical';
      } else if (responseTime > 5000) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }
      
      return {
        status,
        responseTime,
        message: status === 'healthy' ? 'Chrome API is responding normally' : `High response time: ${responseTime.toFixed(2)}ms`
      };
    } catch (error) {
      this.chromeLogger.error('Chrome health check failed', error as Error);
      
      return {
        status: 'critical',
        message: `Health check failed: ${(error as Error).message}`
      };
    }
  }

  async shutdown(): Promise<void> {
    this.chromeLogger.info('Shutting down Chrome integration');
    this.isInitialized = false;
  }
}