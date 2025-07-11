import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  MemoryItem,
  SessionData,
  Checkpoint,
  KnowledgeGraph,
  Entity,
  Relationship,
  MCPConfig,
  VectorSearchOptions
} from './types.js';

export class AdvancedMemorySystem {
  private config: MCPConfig;
  private memoryItems: Map<string, MemoryItem> = new Map();
  private knowledgeGraph: KnowledgeGraph;
  private sessions: Map<string, SessionData> = new Map();
  private checkpoints: Map<string, Checkpoint> = new Map();
  
  constructor(config: MCPConfig) {
    this.config = config;
    this.knowledgeGraph = {
      entities: new Map(),
      relationships: new Map()
    };
    this.initializeDataDirectory();
  }

  private async initializeDataDirectory(): Promise<void> {
    await fs.mkdir(this.config.dataDir, { recursive: true });
    await fs.mkdir(join(this.config.dataDir, 'sessions'), { recursive: true });
    await fs.mkdir(join(this.config.dataDir, 'checkpoints'), { recursive: true });
    await fs.mkdir(join(this.config.dataDir, 'memory'), { recursive: true });
    await fs.mkdir(join(this.config.dataDir, 'graph'), { recursive: true });
  }

  // === CORE MEMORY OPERATIONS ===
  
  async saveMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<string> {
    const memoryItem: MemoryItem = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...item
    };

    // Generate simple text-based embedding (can be enhanced with real embeddings)
    memoryItem.embedding = await this.generateEmbedding(item.content);
    
    // Store in memory
    this.memoryItems.set(memoryItem.id, memoryItem);
    
    // Update knowledge graph
    await this.updateKnowledgeGraph(memoryItem);
    
    // Persist to disk
    await this.persistMemoryItem(memoryItem);
    
    return memoryItem.id;
  }

  async searchMemory(query: string, options: Partial<VectorSearchOptions> = {}): Promise<MemoryItem[]> {
    const searchOptions: VectorSearchOptions = {
      limit: 10,
      threshold: 0.3,
      includeMetadata: true,
      ...options
    };

    const queryEmbedding = await this.generateEmbedding(query);
    const results: Array<{ item: MemoryItem; score: number }> = [];

    for (const item of this.memoryItems.values()) {
      // Filter by categories if specified
      if (searchOptions.categories && !searchOptions.categories.includes(item.category)) {
        continue;
      }

      // Filter by time range if specified
      if (searchOptions.timeRange) {
        const itemTime = new Date(item.timestamp);
        const startTime = new Date(searchOptions.timeRange.start);
        const endTime = new Date(searchOptions.timeRange.end);
        
        if (itemTime < startTime || itemTime > endTime) {
          continue;
        }
      }

      // Calculate similarity score
      const score = this.calculateSimilarity(queryEmbedding, item.embedding || []);
      
      if (score >= searchOptions.threshold) {
        results.push({ item, score });
      }
    }

    // Sort by relevance and recency
    results.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) < 0.1) {
        // If scores are close, prioritize recency
        return new Date(b.item.timestamp).getTime() - new Date(a.item.timestamp).getTime();
      }
      return scoreDiff;
    });

    return results
      .slice(0, searchOptions.limit)
      .map(result => result.item);
  }

  async loadContextForSession(sessionId: string, query?: string): Promise<{
    relevantMemories: MemoryItem[];
    graphContext: { entities: Entity[]; relationships: Relationship[] };
    sessionHistory: SessionData | null;
  }> {
    // Load session history
    const sessionHistory = this.sessions.get(sessionId) || await this.loadSessionData(sessionId);
    
    // Search for relevant memories
    const searchQuery = query || this.extractContextFromSession(sessionHistory);
    const relevantMemories = await this.searchMemory(searchQuery, {
      limit: 20,
      categories: ['infrastructure', 'projects', 'insights'],
      includeMetadata: true
    });

    // Get related graph context
    const graphContext = this.getRelevantGraphContext(relevantMemories);

    return {
      relevantMemories,
      graphContext,
      sessionHistory
    };
  }

  // === MARATHON MODE FUNCTIONALITY ===

  async createCheckpoint(sessionId: string, type: 'auto' | 'manual' | 'critical' = 'auto'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const checkpoint: Checkpoint = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      sessionId,
      type,
      contextSnapshot: await this.compressSessionContext(session),
      memoryState: Array.from(this.memoryItems.values()).filter(
        item => item.sessionId === sessionId
      ),
      nextActions: this.extractNextActions(session)
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    await this.persistCheckpoint(checkpoint);

    return checkpoint.id;
  }

  async prepareMarathonTransfer(sessionId: string): Promise<{
    checkpointId: string;
    transferInstructions: string;
    contextSummary: string;
  }> {
    // Create critical checkpoint
    const checkpointId = await this.createCheckpoint(sessionId, 'critical');
    
    // Generate transfer instructions
    const session = this.sessions.get(sessionId);
    const lastCommands = session?.commands.slice(-5) || [];
    
    const transferInstructions = `
🏃‍♂️ **Marathon Mode Transfer Ready**

**Checkpoint:** ${checkpointId}
**Session:** ${sessionId}
**Last Commands:** ${lastCommands.map(cmd => cmd.command).join(', ')}

**To continue in new chat:**
\`\`\`
--- +++ ... *** Resume from checkpoint ${checkpointId}
\`\`\`

**Context preserved:** Memory state, graph relationships, progress tracking
**Ready for:** Seamless continuation with full context restoration
    `.trim();

    const contextSummary = await this.generateContextSummary(sessionId);

    return {
      checkpointId,
      transferInstructions,
      contextSummary
    };
  }

  async restoreFromCheckpoint(checkpointId: string): Promise<{
    sessionId: string;
    restoredMemories: MemoryItem[];
    contextSummary: string;
  }> {
    const checkpoint = this.checkpoints.get(checkpointId) || await this.loadCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    // Create new session for continuation
    const newSessionId = uuidv4();
    const restoredSession: SessionData = {
      id: newSessionId,
      startTime: new Date().toISOString(),
      commands: [],
      marathonMode: true,
      contextSize: 0,
      checkpoints: [checkpoint],
      status: 'active'
    };

    this.sessions.set(newSessionId, restoredSession);

    // Restore memory state
    for (const memoryItem of checkpoint.memoryState) {
      const restoredItem = { ...memoryItem, sessionId: newSessionId };
      this.memoryItems.set(restoredItem.id, restoredItem);
    }

    const contextSummary = `
🔄 **Context Restored Successfully**

**Previous Session:** ${checkpoint.sessionId}
**New Session:** ${newSessionId}
**Memories Restored:** ${checkpoint.memoryState.length}
**Next Actions:** ${checkpoint.nextActions.join(', ')}

**Ready to continue with full context!**
    `.trim();

    return {
      sessionId: newSessionId,
      restoredMemories: checkpoint.memoryState,
      contextSummary
    };
  }

  // === KNOWLEDGE GRAPH OPERATIONS ===

  private async updateKnowledgeGraph(memoryItem: MemoryItem): Promise<void> {
    // Extract entities from content (simple keyword extraction)
    const entities = this.extractEntities(memoryItem.content);
    
    for (const entityName of entities) {
      const entityId = `entity_${entityName.toLowerCase().replace(/\s+/g, '_')}`;
      
      if (!this.knowledgeGraph.entities.has(entityId)) {
        const entity: Entity = {
          id: entityId,
          name: entityName,
          type: memoryItem.category,
          properties: {
            mentions: 1,
            firstSeen: memoryItem.timestamp
          },
          connections: [],
          lastUpdated: memoryItem.timestamp
        };
        this.knowledgeGraph.entities.set(entityId, entity);
      } else {
        const entity = this.knowledgeGraph.entities.get(entityId)!;
        entity.properties.mentions = (entity.properties.mentions || 0) + 1;
        entity.lastUpdated = memoryItem.timestamp;
      }

      // Create relationship to memory item
      const relationshipId = `rel_${memoryItem.id}_${entityId}`;
      const relationship: Relationship = {
        id: relationshipId,
        from: memoryItem.id,
        to: entityId,
        type: 'mentions',
        weight: 1.0,
        properties: {
          category: memoryItem.category,
          timestamp: memoryItem.timestamp
        }
      };
      this.knowledgeGraph.relationships.set(relationshipId, relationship);
    }
  }

  // === UTILITY METHODS ===

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple text-based embedding using character frequencies
    // In production, this would use proper embedding models
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Create a fixed-size vector (100 dimensions)
    const embedding = new Array(100).fill(0);
    const vocab = Array.from(wordCounts.keys()).slice(0, 100);
    
    for (let i = 0; i < vocab.length; i++) {
      embedding[i] = (wordCounts.get(vocab[i]) || 0) / words.length;
    }

    return embedding;
  }

  private calculateSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction (can be enhanced with NLP)
    const patterns = [
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Proper nouns
      /\b(?:https?:\/\/[^\s]+)\b/g, // URLs
      /\b\d+\.\d+\.\d+\.\d+\b/g, // IP addresses
      /\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g // Domains
    ];

    const entities = new Set<string>();
    
    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];
      matches.forEach(match => entities.add(match));
    }

    return Array.from(entities);
  }

  private async compressSessionContext(session: SessionData): Promise<string> {
    // Context compression algorithm
    const recentCommands = session.commands.slice(-10);
    const summary = {
      sessionId: session.id,
      startTime: session.startTime,
      commandCount: session.commands.length,
      recentCommands: recentCommands.map(cmd => ({
        type: cmd.type,
        command: cmd.command.substring(0, 100),
        success: cmd.success
      })),
      status: session.status
    };

    return JSON.stringify(summary, null, 2);
  }

  private extractNextActions(session: SessionData): string[] {
    // Extract likely next actions from session history
    const lastCommand = session.commands[session.commands.length - 1];
    if (!lastCommand) return [];

    const nextActions = [];
    
    if (lastCommand.type === 'execute' && !lastCommand.success) {
      nextActions.push('Retry last command with error handling');
    }
    
    if (lastCommand.command.includes('deploy')) {
      nextActions.push('Verify deployment status', 'Check service health');
    }
    
    if (lastCommand.command.includes('config')) {
      nextActions.push('Test configuration', 'Apply changes');
    }

    return nextActions;
  }

  private getRelevantGraphContext(memories: MemoryItem[]): {
    entities: Entity[];
    relationships: Relationship[];
  } {
    const relevantEntityIds = new Set<string>();
    const relevantRelationships: Relationship[] = [];

    // Find related entities and relationships
    for (const memory of memories) {
      for (const [relId, relationship] of this.knowledgeGraph.relationships) {
        if (relationship.from === memory.id) {
          relevantEntityIds.add(relationship.to);
          relevantRelationships.push(relationship);
        }
      }
    }

    const entities = Array.from(relevantEntityIds)
      .map(id => this.knowledgeGraph.entities.get(id))
      .filter(Boolean) as Entity[];

    return { entities, relationships: relevantRelationships };
  }

  private extractContextFromSession(session: SessionData | null): string {
    if (!session || session.commands.length === 0) {
      return 'general context';
    }

    const recentCommands = session.commands.slice(-3);
    return recentCommands.map(cmd => cmd.command).join(' ');
  }

  private async generateContextSummary(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) return 'No session context available';

    const memories = Array.from(this.memoryItems.values())
      .filter(item => item.sessionId === sessionId);

    const categories = new Map<string, number>();
    memories.forEach(item => {
      categories.set(item.category, (categories.get(item.category) || 0) + 1);
    });

    return `
Session: ${sessionId}
Duration: ${session.startTime} - ${session.endTime || 'ongoing'}
Commands executed: ${session.commands.length}
Memories created: ${memories.length}
Categories: ${Array.from(categories.entries()).map(([cat, count]) => `${cat}(${count})`).join(', ')}
    `.trim();
  }

  // === PERSISTENCE METHODS ===

  private async persistMemoryItem(item: MemoryItem): Promise<void> {
    const filePath = join(this.config.dataDir, 'memory', `${item.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));
  }

  private async persistCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const filePath = join(this.config.dataDir, 'checkpoints', `${checkpoint.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));
  }

  private async loadSessionData(sessionId: string): Promise<SessionData | null> {
    try {
      const filePath = join(this.config.dataDir, 'sessions', `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async loadCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    try {
      const filePath = join(this.config.dataDir, 'checkpoints', `${checkpointId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const checkpoint = JSON.parse(data);
      this.checkpoints.set(checkpointId, checkpoint);
      return checkpoint;
    } catch {
      return null;
    }
  }
}
