/**
 * Knowledge Graph Storage for Relationships and Context
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { MemoryItem, MCPConfig } from '../../types/index.js';
import { logger } from '../logger.js';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  timestamp: string;
}

interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
  timestamp: string;
}

interface KnowledgeGraph {
  nodes: Record<string, GraphNode>;
  relationships: Record<string, GraphRelationship>;
  metadata: {
    nodeCount: number;
    relationshipCount: number;
    lastUpdated: string;
  };
}

export class KnowledgeGraphStore {
  private config: MCPConfig;
  private graph: KnowledgeGraph;
  private graphPath: string;
  private graphLogger = logger.component('KnowledgeGraph');
  private isInitialized = false;

  constructor(config: MCPConfig) {
    this.config = config;
    this.graphPath = join(config.server.dataDirectory, 'knowledge-graph', 'graph.json');
    this.graph = {
      nodes: {},
      relationships: {},
      metadata: {
        nodeCount: 0,
        relationshipCount: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.graphLogger.info('Initializing knowledge graph');
      
      // Ensure knowledge graph directory exists
      await mkdir(join(this.config.server.dataDirectory, 'knowledge-graph'), { recursive: true });
      
      // Load existing graph
      await this.loadGraph();
      
      this.isInitialized = true;
      this.graphLogger.info('Knowledge graph initialized', {
        nodeCount: this.graph.metadata.nodeCount,
        relationshipCount: this.graph.metadata.relationshipCount
      });
    } catch (error) {
      this.graphLogger.error('Failed to initialize knowledge graph', error as Error);
      throw error;
    }
  }

  async addNode(item: MemoryItem): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.graphLogger.debug('Adding node to knowledge graph', { itemId: item.id });
      
      const node: GraphNode = {
        id: item.id,
        type: 'memory_item',
        label: this.generateLabel(item),
        properties: {
          category: item.category,
          content: item.content,
          relevanceScore: item.relevanceScore,
          ...item.metadata
        },
        timestamp: item.timestamp
      };
      
      this.graph.nodes[item.id] = node;
      
      // Auto-create relationships based on content similarity and category
      await this.createAutoRelationships(node);
      
      // Update metadata
      this.updateMetadata();
      
      // Save graph
      await this.saveGraph();
      
      this.graphLogger.debug('Node added to knowledge graph', { itemId: item.id });
    } catch (error) {
      this.graphLogger.error('Failed to add node to knowledge graph', error as Error, { itemId: item.id });
      throw error;
    }
  }

  async addRelationship(
    sourceId: string,
    targetId: string,
    type: string,
    properties: Record<string, any> = {},
    weight: number = 1.0
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Verify nodes exist
      if (!this.graph.nodes[sourceId] || !this.graph.nodes[targetId]) {
        throw new Error('Source or target node does not exist');
      }
      
      const relationshipId = `${sourceId}-${type}-${targetId}`;
      
      const relationship: GraphRelationship = {
        id: relationshipId,
        source: sourceId,
        target: targetId,
        type,
        properties,
        weight,
        timestamp: new Date().toISOString()
      };
      
      this.graph.relationships[relationshipId] = relationship;
      
      // Update metadata
      this.updateMetadata();
      
      // Save graph
      await this.saveGraph();
      
      this.graphLogger.debug('Relationship added', {
        relationshipId,
        type,
        weight
      });
    } catch (error) {
      this.graphLogger.error('Failed to add relationship', error as Error, {
        sourceId,
        targetId,
        type
      });
      throw error;
    }
  }

  async getRelationships(nodeId: string): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = [];
    
    Object.values(this.graph.relationships).forEach(rel => {
      if (rel.source === nodeId || rel.target === nodeId) {
        relationships.push(rel);
      }
    });
    
    return relationships.sort((a, b) => b.weight - a.weight);
  }

  async getConnectedNodes(nodeId: string, maxDepth: number = 2): Promise<GraphNode[]> {
    const visited = new Set<string>();
    const connected: GraphNode[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId, depth: 0 }];
    
    while (queue.length > 0) {
      const { nodeId: currentNodeId, depth } = queue.shift()!;
      
      if (visited.has(currentNodeId) || depth > maxDepth) {
        continue;
      }
      
      visited.add(currentNodeId);
      
      const node = this.graph.nodes[currentNodeId];
      if (node && currentNodeId !== nodeId) {
        connected.push(node);
      }
      
      if (depth < maxDepth) {
        const relationships = await this.getRelationships(currentNodeId);
        relationships.forEach(rel => {
          const nextNodeId = rel.source === currentNodeId ? rel.target : rel.source;
          if (!visited.has(nextNodeId)) {
            queue.push({ nodeId: nextNodeId, depth: depth + 1 });
          }
        });
      }
    }
    
    return connected;
  }

  async searchNodes(query: string, limit: number = 10): Promise<GraphNode[]> {
    const queryLower = query.toLowerCase();
    const matches: Array<{ node: GraphNode; score: number }> = [];
    
    Object.values(this.graph.nodes).forEach(node => {
      let score = 0;
      
      // Check label match
      if (node.label.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      
      // Check content match
      if (node.properties.content?.toLowerCase().includes(queryLower)) {
        score += 2;
      }
      
      // Check category match
      if (node.properties.category?.toLowerCase().includes(queryLower)) {
        score += 1;
      }
      
      if (score > 0) {
        matches.push({ node, score });
      }
    });
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(match => match.node);
  }

  async getClusterAnalysis(): Promise<{
    clusters: Array<{
      id: string;
      nodes: string[];
      centralNode: string;
      coherence: number;
    }>;
    insights: string[];
  }> {
    // Simple clustering based on relationship density
    const clusters: Array<{
      id: string;
      nodes: string[];
      centralNode: string;
      coherence: number;
    }> = [];
    
    const visited = new Set<string>();
    
    Object.keys(this.graph.nodes).forEach(nodeId => {
      if (visited.has(nodeId)) return;
      
      const cluster = this.findCluster(nodeId, visited);
      if (cluster.nodes.length > 1) {
        clusters.push(cluster);
      }
    });
    
    const insights = this.generateClusterInsights(clusters);
    
    return { clusters, insights };
  }

  async cleanup(): Promise<void> {
    try {
      this.graphLogger.info('Starting knowledge graph cleanup');
      
      // Remove orphaned nodes (nodes with no relationships)
      const connectedNodes = new Set<string>();
      Object.values(this.graph.relationships).forEach(rel => {
        connectedNodes.add(rel.source);
        connectedNodes.add(rel.target);
      });
      
      const initialNodeCount = Object.keys(this.graph.nodes).length;
      
      Object.keys(this.graph.nodes).forEach(nodeId => {
        if (!connectedNodes.has(nodeId)) {
          delete this.graph.nodes[nodeId];
        }
      });
      
      // Update metadata
      this.updateMetadata();
      
      // Save graph
      await this.saveGraph();
      
      const removedNodes = initialNodeCount - Object.keys(this.graph.nodes).length;
      this.graphLogger.info('Knowledge graph cleanup completed', {
        removedOrphanNodes: removedNodes,
        remainingNodes: Object.keys(this.graph.nodes).length
      });
    } catch (error) {
      this.graphLogger.error('Knowledge graph cleanup failed', error as Error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.saveGraph();
      this.graphLogger.info('Knowledge graph shutdown completed');
    } catch (error) {
      this.graphLogger.error('Error during knowledge graph shutdown', error as Error);
    }
  }

  private async loadGraph(): Promise<void> {
    try {
      const graphData = await readFile(this.graphPath, 'utf-8');
      this.graph = JSON.parse(graphData);
      
      // Validate graph structure
      if (!this.graph.nodes || !this.graph.relationships || !this.graph.metadata) {
        throw new Error('Invalid graph structure');
      }
      
      this.graphLogger.debug('Knowledge graph loaded', {
        nodeCount: this.graph.metadata.nodeCount,
        relationshipCount: this.graph.metadata.relationshipCount
      });
    } catch (error) {
      // Create new graph if file doesn't exist or is invalid
      this.graphLogger.info('Creating new knowledge graph');
      await this.saveGraph();
    }
  }

  private async saveGraph(): Promise<void> {
    try {
      await writeFile(this.graphPath, JSON.stringify(this.graph, null, 2), 'utf-8');
      this.graphLogger.trace('Knowledge graph saved to disk');
    } catch (error) {
      this.graphLogger.error('Failed to save knowledge graph', error as Error);
      throw error;
    }
  }

  private generateLabel(item: MemoryItem): string {
    const content = item.content.substring(0, 50);
    return `${item.category}: ${content}${item.content.length > 50 ? '...' : ''}`;
  }

  private async createAutoRelationships(node: GraphNode): Promise<void> {
    // Find similar nodes based on category and content
    Object.values(this.graph.nodes).forEach(async existingNode => {
      if (existingNode.id === node.id) return;
      
      // Category relationship
      if (existingNode.properties.category === node.properties.category) {
        await this.addRelationship(node.id, existingNode.id, 'SAME_CATEGORY', {}, 0.5);
      }
      
      // Content similarity (simple keyword matching)
      const similarity = this.calculateContentSimilarity(
        node.properties.content,
        existingNode.properties.content
      );
      
      if (similarity > 0.3) {
        await this.addRelationship(node.id, existingNode.id, 'SIMILAR_CONTENT', {
          similarity
        }, similarity);
      }
    });
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = new Set(content1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(content2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private findCluster(startNodeId: string, visited: Set<string>): {
    id: string;
    nodes: string[];
    centralNode: string;
    coherence: number;
  } {
    const clusterNodes: string[] = [];
    const queue = [startNodeId];
    const localVisited = new Set<string>();
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (localVisited.has(nodeId) || visited.has(nodeId)) {
        continue;
      }
      
      localVisited.add(nodeId);
      visited.add(nodeId);
      clusterNodes.push(nodeId);
      
      // Add connected nodes to queue
      Object.values(this.graph.relationships).forEach(rel => {
        if (rel.source === nodeId && !localVisited.has(rel.target)) {
          queue.push(rel.target);
        } else if (rel.target === nodeId && !localVisited.has(rel.source)) {
          queue.push(rel.source);
        }
      });
    }
    
    // Find central node (most connections within cluster)
    let centralNode = startNodeId;
    let maxConnections = 0;
    
    clusterNodes.forEach(nodeId => {
      const connections = Object.values(this.graph.relationships).filter(rel => {
        return (rel.source === nodeId || rel.target === nodeId) &&
               (clusterNodes.includes(rel.source) && clusterNodes.includes(rel.target));
      }).length;
      
      if (connections > maxConnections) {
        maxConnections = connections;
        centralNode = nodeId;
      }
    });
    
    // Calculate coherence
    const totalPossibleConnections = clusterNodes.length * (clusterNodes.length - 1) / 2;
    const actualConnections = Object.values(this.graph.relationships).filter(rel => {
      return clusterNodes.includes(rel.source) && clusterNodes.includes(rel.target);
    }).length;
    
    const coherence = totalPossibleConnections > 0 ? actualConnections / totalPossibleConnections : 0;
    
    return {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      nodes: clusterNodes,
      centralNode,
      coherence
    };
  }

  private generateClusterInsights(clusters: Array<{
    id: string;
    nodes: string[];
    centralNode: string;
    coherence: number;
  }>): string[] {
    const insights: string[] = [];
    
    if (clusters.length === 0) {
      insights.push('No significant clusters found in the knowledge graph');
      return insights;
    }
    
    // Largest cluster
    const largestCluster = clusters.reduce((max, cluster) => 
      cluster.nodes.length > max.nodes.length ? cluster : max
    );
    insights.push(`Largest knowledge cluster contains ${largestCluster.nodes.length} related items`);
    
    // Most coherent cluster
    const mostCoherent = clusters.reduce((max, cluster) => 
      cluster.coherence > max.coherence ? cluster : max
    );
    insights.push(`Most coherent cluster has ${(mostCoherent.coherence * 100).toFixed(1)}% interconnection`);
    
    // Average cluster size
    const avgSize = clusters.reduce((sum, cluster) => sum + cluster.nodes.length, 0) / clusters.length;
    insights.push(`Average cluster size is ${avgSize.toFixed(1)} items`);
    
    return insights;
  }

  private updateMetadata(): void {
    this.graph.metadata = {
      nodeCount: Object.keys(this.graph.nodes).length,
      relationshipCount: Object.keys(this.graph.relationships).length,
      lastUpdated: new Date().toISOString()
    };
  }
}