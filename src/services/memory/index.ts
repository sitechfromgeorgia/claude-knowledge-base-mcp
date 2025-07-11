/**
 * Advanced Memory Management Service for Claude Knowledge Base MCP
 */

import { join } from 'path';
import { promises as fs } from 'fs';
import type { 
  KnowledgeBase, 
  MemoryItem, 
  MemorySearchResult, 
  VectorSearchQuery,
  MCPConfig
} from '../../types/index.js';
import { logger } from '../logger.js';
import { VectorStore } from './vector-store.js';
import { KnowledgeGraphStore } from './knowledge-graph.js';

export class MemoryManager {
  private config: MCPConfig;
  private vectorStore: VectorStore;
  private knowledgeGraph: KnowledgeGraphStore;
  private knowledgeBase: KnowledgeBase;
  private memoryLogger = logger.component('MemoryManager');

  constructor(config: MCPConfig) {
    this.config = config;
    this.vectorStore = new VectorStore(config);
    this.knowledgeGraph = new KnowledgeGraphStore(config);
    this.knowledgeBase = this.getDefaultKnowledgeBase();
  }

  async initialize(): Promise<void> {
    this.memoryLogger.info('Initializing memory management system');
    
    try {
      // Ensure data directory exists
      await fs.mkdir(this.config.server.dataDirectory, { recursive: true });
      await fs.mkdir(join(this.config.server.dataDirectory, 'sessions'), { recursive: true });
      await fs.mkdir(join(this.config.server.dataDirectory, 'vectors'), { recursive: true });
      await fs.mkdir(join(this.config.server.dataDirectory, 'knowledge-graph'), { recursive: true });

      // Initialize components
      await this.vectorStore.initialize();
      await this.knowledgeGraph.initialize();
      
      // Load existing knowledge base
      await this.loadKnowledgeBase();
      
      this.memoryLogger.info('Memory management system initialized successfully');
    } catch (error) {
      this.memoryLogger.error('Failed to initialize memory management system', error as Error);
      throw error;
    }
  }

  async searchMemory(query: VectorSearchQuery): Promise<MemorySearchResult> {
    const startTime = performance.now();
    
    try {
      this.memoryLogger.debug('Searching memory', { query: query.query, limit: query.limit });
      
      // Perform hybrid search (vector + keyword)
      const vectorResults = await this.vectorStore.search(query);
      const keywordResults = await this.searchKeywords(query.query, query.limit || 10);
      
      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(vectorResults, keywordResults);
      
      // Enhance with knowledge graph relationships
      const enhancedResults = await this.enhanceWithKnowledgeGraph(combinedResults);
      
      const executionTime = performance.now() - startTime;
      
      this.memoryLogger.debug('Memory search completed', {
        query: query.query,
        resultCount: enhancedResults.length,
        executionTime: `${executionTime.toFixed(2)}ms`
      });
      
      return {
        items: enhancedResults,
        totalCount: enhancedResults.length,
        query: query.query,
        executionTime
      };
    } catch (error) {
      this.memoryLogger.error('Memory search failed', error as Error, { query });
      throw error;
    }
  }

  async storeMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    try {
      const memoryItem: MemoryItem = {
        ...item,
        id: this.generateId(),
        timestamp: new Date().toISOString()
      };
      
      this.memoryLogger.debug('Storing memory item', { 
        id: memoryItem.id, 
        category: memoryItem.category,
        contentLength: memoryItem.content.length
      });
      
      // Store in vector database
      await this.vectorStore.store(memoryItem);
      
      // Update knowledge graph
      await this.knowledgeGraph.addNode(memoryItem);
      
      // Update in-memory knowledge base
      await this.updateKnowledgeBaseCategory(memoryItem);
      
      this.memoryLogger.info('Memory item stored successfully', { id: memoryItem.id });
      
      return memoryItem.id;
    } catch (error) {
      this.memoryLogger.error('Failed to store memory item', error as Error, { item });
      throw error;
    }
  }

  async getKnowledgeBase(): Promise<KnowledgeBase> {
    return this.knowledgeBase;
  }

  async updateKnowledgeBase(category: keyof KnowledgeBase, data: any): Promise<void> {
    try {
      this.memoryLogger.debug('Updating knowledge base category', { category });
      
      if (category === 'currentSession' || category === 'lastUpdated') {
        throw new Error('Cannot directly update system fields');
      }
      
      // Load current data
      const currentData = await this.loadFile(`${category}.json`);
      
      // Merge with new data
      let updatedData;
      if (Array.isArray(currentData)) {
        updatedData = [...currentData, data];
      } else {
        updatedData = { ...currentData, ...data };
      }
      
      // Save updated data
      await this.saveFile(`${category}.json`, updatedData);
      
      // Update in-memory knowledge base
      (this.knowledgeBase as any)[category] = updatedData;
      this.knowledgeBase.lastUpdated = new Date().toISOString();
      
      // Store in vector database for semantic search
      await this.storeMemory({
        content: JSON.stringify(data),
        category,
        relevanceScore: 1.0,
        metadata: {
          type: 'knowledge_base_update',
          category,
          updateType: Array.isArray(currentData) ? 'append' : 'merge'
        }
      });
      
      this.memoryLogger.info('Knowledge base updated successfully', { category });
    } catch (error) {
      this.memoryLogger.error('Failed to update knowledge base', error as Error, { category });
      throw error;
    }
  }

  async getMemoryStats(): Promise<{
    totalItems: number;
    categories: Record<string, number>;
    storageSize: number;
    vectorCount: number;
  }> {
    try {
      const vectorStats = await this.vectorStore.getStats();
      const kbStats = await this.getKnowledgeBaseStats();
      
      return {
        totalItems: vectorStats.count,
        categories: kbStats.categories,
        storageSize: kbStats.storageSize,
        vectorCount: vectorStats.count
      };
    } catch (error) {
      this.memoryLogger.error('Failed to get memory stats', error as Error);
      return {
        totalItems: 0,
        categories: {},
        storageSize: 0,
        vectorCount: 0
      };
    }
  }

  private getDefaultKnowledgeBase(): KnowledgeBase {
    return {
      infrastructure: {
        servers: {},
        services: {},
        databases: {},
        monitoring: {
          uptime: 0,
          alerts: [],
          metrics: []
        }
      },
      projects: {
        active: {},
        completed: {},
        archived: {}
      },
      interactions: [],
      workflows: {
        n8n: [],
        automation: [],
        integrations: [],
        schedules: []
      },
      insights: {
        analytics: {
          commandUsage: {},
          sessionDuration: {
            average: 0,
            longest: 0,
            shortest: 0
          },
          marathonModeUsage: {
            activations: 0,
            averageDuration: 0,
            successRate: 0
          },
          toolIntegrations: {}
        },
        patterns: [],
        recommendations: [],
        learnings: []
      },
      currentSession: '',
      lastUpdated: new Date().toISOString()
    };
  }

  private async loadKnowledgeBase(): Promise<void> {
    try {
      const infrastructure = await this.loadFile('infrastructure.json');
      const projects = await this.loadFile('projects.json');
      const interactions = await this.loadFile('interactions.json');
      const workflows = await this.loadFile('workflows.json');
      const insights = await this.loadFile('insights.json');

      this.knowledgeBase = {
        infrastructure: infrastructure || this.knowledgeBase.infrastructure,
        projects: projects || this.knowledgeBase.projects,
        interactions: interactions || this.knowledgeBase.interactions,
        workflows: workflows || this.knowledgeBase.workflows,
        insights: insights || this.knowledgeBase.insights,
        currentSession: '',
        lastUpdated: new Date().toISOString()
      };
      
      this.memoryLogger.info('Knowledge base loaded successfully');
    } catch (error) {
      this.memoryLogger.warn('Failed to load knowledge base, using defaults', { error: (error as Error).message });
    }
  }

  private async loadFile(filename: string): Promise<any> {
    try {
      const filePath = join(this.config.server.dataDirectory, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return default structure if file doesn't exist
      if (filename.includes('interactions')) return [];
      return null;
    }
  }

  private async saveFile(filename: string, data: any): Promise<void> {
    const filePath = join(this.config.server.dataDirectory, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async searchKeywords(query: string, limit: number): Promise<MemoryItem[]> {
    // Simple keyword search implementation
    const results: MemoryItem[] = [];
    const queryLower = query.toLowerCase();
    
    // Search through knowledge base
    Object.entries(this.knowledgeBase).forEach(([category, data]) => {
      if (category === 'currentSession' || category === 'lastUpdated') return;
      
      const dataStr = JSON.stringify(data).toLowerCase();
      if (dataStr.includes(queryLower)) {
        results.push({
          id: `keyword-${category}-${Date.now()}`,
          content: JSON.stringify(data),
          category: category as keyof KnowledgeBase,
          relevanceScore: this.calculateKeywordRelevance(dataStr, queryLower),
          timestamp: new Date().toISOString(),
          metadata: {
            searchType: 'keyword',
            category
          }
        });
      }
    });
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private combineSearchResults(vectorResults: MemoryItem[], keywordResults: MemoryItem[]): MemoryItem[] {
    const seen = new Set<string>();
    const combined: MemoryItem[] = [];
    
    // Add vector results first (higher priority)
    for (const item of vectorResults) {
      if (!seen.has(item.content)) {
        seen.add(item.content);
        combined.push(item);
      }
    }
    
    // Add unique keyword results
    for (const item of keywordResults) {
      if (!seen.has(item.content)) {
        seen.add(item.content);
        combined.push(item);
      }
    }
    
    return combined.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async enhanceWithKnowledgeGraph(items: MemoryItem[]): Promise<MemoryItem[]> {
    // Enhance search results with knowledge graph relationships
    for (const item of items) {
      try {
        const relationships = await this.knowledgeGraph.getRelationships(item.id);
        item.metadata = {
          ...item.metadata,
          relationships: relationships.length,
          relatedNodes: relationships.map(r => r.target)
        };
      } catch (error) {
        // Continue if knowledge graph enhancement fails
        this.memoryLogger.debug('Failed to enhance item with knowledge graph', { itemId: item.id });
      }
    }
    
    return items;
  }

  private calculateKeywordRelevance(text: string, query: string): number {
    const matches = (text.match(new RegExp(query, 'gi')) || []).length;
    return Math.min(matches * 0.1, 1.0);
  }

  private async updateKnowledgeBaseCategory(item: MemoryItem): Promise<void> {
    try {
      const category = item.category;
      const data = JSON.parse(item.content);
      
      if (Array.isArray((this.knowledgeBase as any)[category])) {
        (this.knowledgeBase as any)[category].push(data);
      } else {
        (this.knowledgeBase as any)[category] = {
          ...(this.knowledgeBase as any)[category],
          ...data
        };
      }
      
      this.knowledgeBase.lastUpdated = new Date().toISOString();
    } catch (error) {
      this.memoryLogger.debug('Failed to update knowledge base category from memory item', { 
        itemId: item.id, 
        category: item.category 
      });
    }
  }

  private async getKnowledgeBaseStats(): Promise<{
    categories: Record<string, number>;
    storageSize: number;
  }> {
    const categories: Record<string, number> = {};
    let totalSize = 0;
    
    Object.entries(this.knowledgeBase).forEach(([category, data]) => {
      if (category === 'currentSession' || category === 'lastUpdated') return;
      
      const size = JSON.stringify(data).length;
      categories[category] = Array.isArray(data) ? data.length : Object.keys(data).length;
      totalSize += size;
    });
    
    return {
      categories,
      storageSize: totalSize
    };
  }

  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    try {
      this.memoryLogger.info('Starting memory cleanup');
      
      // Clean up old vectors based on retention policy
      await this.vectorStore.cleanup(this.config.memory.retentionDays);
      
      // Clean up knowledge graph
      await this.knowledgeGraph.cleanup();
      
      this.memoryLogger.info('Memory cleanup completed');
    } catch (error) {
      this.memoryLogger.error('Memory cleanup failed', error as Error);
    }
  }

  async shutdown(): Promise<void> {
    this.memoryLogger.info('Shutting down memory manager');
    
    try {
      await this.vectorStore.shutdown();
      await this.knowledgeGraph.shutdown();
      
      this.memoryLogger.info('Memory manager shutdown completed');
    } catch (error) {
      this.memoryLogger.error('Error during memory manager shutdown', error as Error);
    }
  }
}