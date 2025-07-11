// Core types for Claude Knowledge Base MCP

export interface MemoryItem {
  id: string;
  content: string;
  embedding?: number[];
  category: 'infrastructure' | 'projects' | 'interactions' | 'workflows' | 'insights';
  timestamp: string;
  sessionId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  metadata: Record<string, any>;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  commands: CommandExecution[];
  marathonMode: boolean;
  contextSize: number;
  checkpoints: Checkpoint[];
  status: 'active' | 'completed' | 'transferred' | 'error';
}

export interface CommandExecution {
  command: string;
  type: 'load' | 'execute' | 'update' | 'marathon';
  timestamp: string;
  result: any;
  duration: number;
  success: boolean;
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  sessionId: string;
  type: 'auto' | 'manual' | 'critical';
  contextSnapshot: string;
  memoryState: MemoryItem[];
  nextActions: string[];
}

export interface KnowledgeGraph {
  entities: Map<string, Entity>;
  relationships: Map<string, Relationship>;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  connections: string[];
  lastUpdated: string;
}

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
}

export interface MCPConfig {
  // Core settings
  dataDir: string;
  maxContextSize: number;
  autoSaveInterval: number; // minutes
  
  // Memory settings
  vectorDimension: number;
  maxMemoryItems: number;
  compressionThreshold: number;
  
  // Marathon mode settings
  marathonEnabled: boolean;
  contextOverflowThreshold: number;
  checkpointInterval: number;
  
  // Optional integrations
  integrations: {
    vectorDB?: 'qdrant' | 'chroma' | 'pinecone' | 'local';
    workflows?: 'n8n' | 'zapier' | 'none';
    storage?: 'supabase' | 's3' | 'local';
    monitoring?: 'custom' | 'none';
  };
}

export interface VectorSearchOptions {
  limit: number;
  threshold: number;
  includeMetadata: boolean;
  categories?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
}
