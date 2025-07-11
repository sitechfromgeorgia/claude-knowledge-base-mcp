export interface MCPConfig {
  dataDir: string;
  maxContextSize: number;
  autoSaveInterval: number;
  vectorDimension: number;
  maxMemoryItems: number;
  compressionThreshold: number;
  marathonEnabled: boolean;
  contextOverflowThreshold: number;
  checkpointInterval: number;
  integrations: {
    vectorDB: 'local' | 'qdrant' | 'chroma' | 'pinecone';
    workflows: 'none' | 'n8n' | 'zapier';
    storage: 'local' | 'supabase' | 's3';
    monitoring: 'none' | 'basic' | 'advanced';
  };
}

export interface MemoryItem {
  id: string;
  content: string;
  category: 'infrastructure' | 'projects' | 'interactions' | 'workflows' | 'insights';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  timestamp: string;
  tags: string[];
  metadata: Record<string, any>;
  embedding?: number[];
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

export interface KnowledgeGraph {
  entities: Map<string, Entity>;
  relationships: Map<string, Relationship>;
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  commands: CommandExecution[];
  marathonMode: boolean;
  contextSize: number;
  checkpoints: Checkpoint[];
  status: 'active' | 'transferred' | 'completed' | 'error';
}

export interface CommandExecution {
  id?: string;
  command: string;
  type: 'load' | 'execute' | 'save' | 'update' | 'marathon';
  timestamp: string;
  duration: number;
  success: boolean;
  result: any;
}

export interface Checkpoint {
  id: string;
  sessionId: string;
  type: 'auto' | 'manual' | 'critical' | 'marathon_start';
  timestamp: string;
  contextSnapshot: string;
  memoryState: MemoryItem[];
  nextActions: string[];
}

export interface VectorSearchOptions {
  limit: number;
  threshold: number;
  categories?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  includeMetadata: boolean;
}

export interface SearchResult {
  item: MemoryItem;
  score: number;
  snippet?: string;
  rank?: number;
}

export interface ContextLoadResult {
  relevantMemories: MemoryItem[];
  graphContext: {
    entities: Entity[];
    relationships: Relationship[];
  };
  sessionHistory: SessionData | null;
  integrationContext?: any;
}

export interface MarathonTransferResult {
  checkpointId: string;
  transferInstructions: string;
  contextSummary: string;
  sessionId: string;
}

export interface PerformanceMetrics {
  totalCommands: number;
  avgResponseTime: number;
  memoryUsage: number;
  cacheHits: number;
  searchOperations: number;
  errorRate: number;
  sessionDuration: number;
}

export interface AnalyticsData {
  performance: PerformanceMetrics;
  usage: {
    commandFrequency: Record<string, number>;
    categoryDistribution: Record<string, number>;
    tagPopularity: Record<string, number>;
    toolUsage: Record<string, number>;
  };
  memory: {
    totalItems: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    averageSize: number;
    growthRate: number;
  };
  integrations: {
    status: Record<string, 'connected' | 'disconnected' | 'error'>;
    activity: Record<string, number>;
    effectiveness: Record<string, number>;
  };
  recommendations: Array<{
    type: 'performance' | 'workflow' | 'cleanup' | 'feature';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action?: string;
  }>;
}

export interface ConfigurationSchema {
  dataDir: string;
  maxContextSize: number;
  autoSaveInterval: number;
  vectorDimension: number;
  maxMemoryItems: number;
  compressionThreshold: number;
  marathonEnabled: boolean;
  contextOverflowThreshold: number;
  checkpointInterval: number;
  nlpSettings: {
    enableStemming: boolean;
    removeStopwords: boolean;
    language: string;
    cacheSize: number;
  };
  integrations: {
    desktopCommander: boolean;
    github: boolean;
    filesystem: boolean;
  };
  performance: {
    monitoring: boolean;
    analytics: boolean;
    recommendations: boolean;
  };
  security: {
    encryptSensitiveData: boolean;
    dataRetentionDays: number;
    auditLogging: boolean;
  };
}

export interface ToolCapability {
  name: string;
  version: string;
  methods: string[];
  parameters?: Record<string, any>;
}

export interface IntegrationEvent {
  id: string;
  type: 'file_change' | 'command_executed' | 'context_update' | 'session_transfer' | 'error';
  source: string;
  timestamp: string;
  data: any;
  sessionId?: string;
  processed: boolean;
}

export interface FileChangeEvent {
  path: string;
  event: 'added' | 'changed' | 'deleted';
  isRelevant: boolean;
  size?: number;
  modifiedTime?: string;
}

export interface CommandEvent {
  tool: string;
  command: string;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  type: 'auto' | 'manual' | 'migration';
  version: string;
  integrity: string; // hash
}

export interface MigrationStep {
  version: string;
  description: string;
  execute: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DatabaseStats {
  memories: { count: number };
  entities: { count: number };
  sessions: { count: number };
  checkpoints: { count: number };
  dbSize: { size: number };
}

export interface NLPStats {
  cacheSize: number;
  totalEmbeddings: number;
  avgEmbeddingTime: number;
  vocabularySize: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  database: 'online' | 'offline' | 'error';
  nlp: 'ready' | 'loading' | 'error';
  integrations: Record<string, 'connected' | 'disconnected' | 'error'>;
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
  };
  lastCheck: string;
}

// Enhanced types for v3.0 features

export interface SemanticCluster {
  id: string;
  centroid: number[];
  members: string[]; // memory IDs
  concepts: string[];
  coherence: number;
}

export interface TopicModel {
  id: string;
  name: string;
  keywords: Array<{ word: string; weight: number }>;
  memories: string[];
  prominence: number;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  commands: string[];
  frequency: number;
  success_rate: number;
  avg_duration: number;
  recommendation?: string;
}

export interface UserBehaviorInsight {
  type: 'pattern' | 'anomaly' | 'trend' | 'optimization';
  category: 'usage' | 'performance' | 'workflow' | 'tool_effectiveness';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'command' | 'workflow' | 'cleanup' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedBenefit: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ContextualRecommendation {
  query: string;
  suggestions: Array<{
    type: 'memory' | 'command' | 'tool' | 'workflow';
    content: string;
    relevance: number;
    reasoning: string;
  }>;
}

export interface QualityMetrics {
  memory_quality: {
    avg_content_length: number;
    tag_coverage: number;
    categorization_accuracy: number;
    duplicate_rate: number;
  };
  search_quality: {
    precision: number;
    recall: number;
    avg_relevance_score: number;
    user_satisfaction: number;
  };
  system_quality: {
    uptime: number;
    error_rate: number;
    response_consistency: number;
    resource_efficiency: number;
  };
}

// Export utility types

export type CategoryType = MemoryItem['category'];
export type PriorityType = MemoryItem['priority'];
export type SessionStatus = SessionData['status'];
export type CheckpointType = Checkpoint['type'];
export type CommandType = CommandExecution['type'];
export type IntegrationType = keyof MCPConfig['integrations'];

// Helper type for partial updates
export type PartialMemoryItem = Partial<MemoryItem> & Pick<MemoryItem, 'content'>;
export type PartialSessionData = Partial<SessionData> & Pick<SessionData, 'id'>;

// Configuration validation schemas
export const VALID_CATEGORIES: CategoryType[] = ['infrastructure', 'projects', 'interactions', 'workflows', 'insights'];
export const VALID_PRIORITIES: PriorityType[] = ['low', 'medium', 'high', 'critical'];
export const VALID_COMMAND_TYPES: CommandType[] = ['load', 'execute', 'save', 'update', 'marathon'];

// Default configurations
export const DEFAULT_NLP_CONFIG = {
  enableStemming: true,
  removeStopwords: true,
  language: 'en',
  cacheSize: 10000
};

export const DEFAULT_PERFORMANCE_CONFIG = {
  monitoring: true,
  analytics: true,
  recommendations: true
};

export const DEFAULT_SECURITY_CONFIG = {
  encryptSensitiveData: false,
  dataRetentionDays: 365,
  auditLogging: true
};
