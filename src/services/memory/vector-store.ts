/**
 * Vector Storage Implementation for Semantic Memory
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { MemoryItem, VectorSearchQuery, MCPConfig } from '../../types/index.js';
import { logger } from '../logger.js';

interface VectorData {
  id: string;
  vector: number[];
  metadata: {
    content: string;
    category: string;
    timestamp: string;
    [key: string]: any;
  };
}

interface VectorIndex {
  vectors: VectorData[];
  dimension: number;
  count: number;
  lastUpdated: string;
}

export class VectorStore {
  private config: MCPConfig;
  private index: VectorIndex;
  private indexPath: string;
  private vectorLogger = logger.component('VectorStore');
  private isInitialized = false;

  constructor(config: MCPConfig) {
    this.config = config;
    this.indexPath = join(config.server.dataDirectory, 'vectors', 'index.json');
    this.index = {
      vectors: [],
      dimension: config.memory.vectorDimensions,
      count: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.vectorLogger.info('Initializing vector store');
      
      // Ensure vector directory exists
      await mkdir(join(this.config.server.dataDirectory, 'vectors'), { recursive: true });
      
      // Load existing index
      await this.loadIndex();
      
      this.isInitialized = true;
      this.vectorLogger.info('Vector store initialized', {
        vectorCount: this.index.count,
        dimension: this.index.dimension
      });
    } catch (error) {
      this.vectorLogger.error('Failed to initialize vector store', error as Error);
      throw error;
    }
  }

  async store(item: MemoryItem): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.vectorLogger.debug('Storing vector', { itemId: item.id });
      
      // Generate embedding for content
      const vector = await this.generateEmbedding(item.content);
      
      const vectorData: VectorData = {
        id: item.id,
        vector,
        metadata: {
          content: item.content,
          category: item.category,
          timestamp: item.timestamp,
          ...item.metadata
        }
      };
      
      // Add to index
      this.index.vectors.push(vectorData);
      this.index.count = this.index.vectors.length;
      this.index.lastUpdated = new Date().toISOString();
      
      // Save index to disk
      await this.saveIndex();
      
      this.vectorLogger.debug('Vector stored successfully', { itemId: item.id });
    } catch (error) {
      this.vectorLogger.error('Failed to store vector', error as Error, { itemId: item.id });
      throw error;
    }
  }

  async search(query: VectorSearchQuery): Promise<MemoryItem[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.vectorLogger.debug('Searching vectors', { 
        query: query.query, 
        limit: query.limit 
      });
      
      // Generate query embedding
      const queryVector = await this.generateEmbedding(query.query);
      
      // Calculate similarities
      const similarities = this.index.vectors.map(vectorData => ({
        vectorData,
        similarity: this.cosineSimilarity(queryVector, vectorData.vector)
      }));
      
      // Filter by threshold and sort by similarity
      const threshold = query.threshold || 0.1;
      const filtered = similarities
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, query.limit || 10);
      
      // Convert to MemoryItem format
      const results: MemoryItem[] = filtered.map(item => ({
        id: item.vectorData.id,
        content: item.vectorData.metadata.content,
        category: item.vectorData.metadata.category as keyof any,
        relevanceScore: item.similarity,
        timestamp: item.vectorData.metadata.timestamp,
        metadata: {
          ...item.vectorData.metadata,
          searchType: 'vector',
          similarity: item.similarity
        }
      }));
      
      this.vectorLogger.debug('Vector search completed', {
        query: query.query,
        resultCount: results.length,
        topSimilarity: results[0]?.relevanceScore || 0
      });
      
      return results;
    } catch (error) {
      this.vectorLogger.error('Vector search failed', error as Error, { query });
      return [];
    }
  }

  async getStats(): Promise<{ count: number; dimension: number; lastUpdated: string }> {
    return {
      count: this.index.count,
      dimension: this.index.dimension,
      lastUpdated: this.index.lastUpdated
    };
  }

  async cleanup(retentionDays: number): Promise<void> {
    try {
      this.vectorLogger.info('Starting vector store cleanup', { retentionDays });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const initialCount = this.index.vectors.length;
      
      // Remove old vectors
      this.index.vectors = this.index.vectors.filter(vector => {
        const vectorDate = new Date(vector.metadata.timestamp);
        return vectorDate >= cutoffDate;
      });
      
      this.index.count = this.index.vectors.length;
      this.index.lastUpdated = new Date().toISOString();
      
      await this.saveIndex();
      
      const removedCount = initialCount - this.index.count;
      this.vectorLogger.info('Vector store cleanup completed', {
        removedVectors: removedCount,
        remainingVectors: this.index.count
      });
    } catch (error) {
      this.vectorLogger.error('Vector store cleanup failed', error as Error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.saveIndex();
      this.vectorLogger.info('Vector store shutdown completed');
    } catch (error) {
      this.vectorLogger.error('Error during vector store shutdown', error as Error);
    }
  }

  private async loadIndex(): Promise<void> {
    try {
      const indexData = await readFile(this.indexPath, 'utf-8');
      this.index = JSON.parse(indexData);
      
      // Validate index structure
      if (!this.index.vectors || !Array.isArray(this.index.vectors)) {
        throw new Error('Invalid index structure');
      }
      
      this.vectorLogger.debug('Vector index loaded', { 
        vectorCount: this.index.count,
        dimension: this.index.dimension
      });
    } catch (error) {
      // Create new index if file doesn't exist or is invalid
      this.vectorLogger.info('Creating new vector index');
      await this.saveIndex();
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      await writeFile(this.indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
      this.vectorLogger.trace('Vector index saved to disk');
    } catch (error) {
      this.vectorLogger.error('Failed to save vector index', error as Error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Simple text-to-vector conversion for development
      // In production, this would use OpenAI embeddings or similar
      const hash = this.simpleHash(text);
      const vector = new Array(this.config.memory.vectorDimensions).fill(0);
      
      // Generate pseudo-embedding based on text characteristics
      for (let i = 0; i < Math.min(text.length, vector.length); i++) {
        vector[i] = (text.charCodeAt(i % text.length) / 255.0) * (hash % 2 === 0 ? 1 : -1);
      }
      
      // Normalize vector
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let i = 0; i < vector.length; i++) {
          vector[i] /= magnitude;
        }
      }
      
      return vector;
    } catch (error) {
      this.vectorLogger.error('Failed to generate embedding', error as Error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimension');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}