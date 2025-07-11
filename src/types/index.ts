/**
 * Core TypeScript interfaces for Claude Knowledge Base MCP
 */

export interface KnowledgeBase {
  infrastructure: InfrastructureData;
  projects: ProjectData;
  interactions: InteractionData[];
  workflows: WorkflowData;
  insights: InsightData;
  currentSession: string;
  lastUpdated: string;
}

export interface InfrastructureData {
  servers: Record<string, ServerInfo>;
  services: Record<string, ServiceInfo>;
  databases: Record<string, DatabaseInfo>;
  monitoring: MonitoringInfo;
}

export interface ServerInfo {
  id: string;
  name: string;
  host: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  services: string[];
  lastChecked: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  url: string;
  type: 'web' | 'api' | 'database' | 'automation' | 'tool';
  status: 'running' | 'stopped' | 'error' | 'restarting';
  healthEndpoint?: string;
  credentials?: {
    username?: string;
    token?: string;
    apiKey?: string;
  };
  integration: {
    n8n?: boolean;
    supabase?: boolean;
    chrome?: boolean;
    erpnext?: boolean;
  };
}

export interface DatabaseInfo {
  id: string;
  name: string;
  type: 'postgresql' | 'mariadb' | 'redis' | 'vector';
  host: string;
  port: number;
  database: string;
  size: number;
  lastBackup?: string;
}

export interface MonitoringInfo {
  uptime: number;
  alerts: AlertInfo[];
  metrics: MetricInfo[];
}

export interface AlertInfo {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface MetricInfo {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface ProjectData {
  active: Record<string, ProjectInfo>;
  completed: Record<string, ProjectInfo>;
  archived: Record<string, ProjectInfo>;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate?: string;
  tasks: TaskInfo[];
  technologies: string[];
  stakeholders: string[];
  progress: number; // 0-100
}

export interface TaskInfo {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
}

export interface InteractionData {
  id: string;
  type: 'command' | 'query' | 'execution' | 'marathon' | 'integration';
  timestamp: string;
  sessionId: string;
  command?: string;
  result?: any;
  duration?: number;
  success: boolean;
  context: ContextInfo;
  metadata: Record<string, any>;
}

export interface ContextInfo {
  command: string;
  symbols: CommandSymbol[];
  taskDescription: string;
  relevantData: any;
  executionPath: string[];
  toolsUsed: string[];
}

export type CommandSymbol = '---' | '+++' | '...' | '***';

export interface WorkflowData {
  n8n: N8nWorkflowInfo[];
  automation: AutomationInfo[];
  integrations: IntegrationInfo[];
  schedules: ScheduleInfo[];
}

export interface N8nWorkflowInfo {
  id: string;
  name: string;
  description: string;
  active: boolean;
  lastExecution?: string;
  executionCount: number;
  successRate: number;
  nodes: WorkflowNode[];
  triggers: WorkflowTrigger[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  parameters: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'webhook' | 'schedule' | 'manual' | 'event';
  configuration: Record<string, any>;
}

export interface AutomationInfo {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  enabled: boolean;
  lastRun?: string;
  successCount: number;
  errorCount: number;
}

export interface IntegrationInfo {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authentication: 'none' | 'basic' | 'bearer' | 'api_key';
  lastUsed?: string;
  usageCount: number;
}

export interface ScheduleInfo {
  id: string;
  name: string;
  cronExpression: string;
  action: string;
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
}

export interface InsightData {
  analytics: AnalyticsInfo;
  patterns: PatternInfo[];
  recommendations: RecommendationInfo[];
  learnings: LearningInfo[];
}

export interface AnalyticsInfo {
  commandUsage: Record<string, number>;
  sessionDuration: {
    average: number;
    longest: number;
    shortest: number;
  };
  marathonModeUsage: {
    activations: number;
    averageDuration: number;
    successRate: number;
  };
  toolIntegrations: Record<string, {
    usage: number;
    successRate: number;
    averageResponseTime: number;
  }>;
}

export interface PatternInfo {
  id: string;
  name: string;
  description: string;
  frequency: number;
  confidence: number;
  examples: string[];
  actionable: boolean;
}

export interface RecommendationInfo {
  id: string;
  category: 'performance' | 'workflow' | 'integration' | 'automation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  actionItems: string[];
}

export interface LearningInfo {
  id: string;
  topic: string;
  concept: string;
  context: string;
  timestamp: string;
  relevance: number;
  tags: string[];
}

export interface SessionData {
  id: string;
  startTime: string;
  endTime?: string;
  commands: CommandExecution[];
  results: ExecutionResult[];
  marathonMode: boolean;
  context: SessionContext;
  metadata: SessionMetadata;
}

export interface CommandExecution {
  command: string;
  timestamp: string;
  symbols: CommandSymbol[];
  taskDescription: string;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface ExecutionResult {
  id: string;
  commandId: string;
  type: 'load' | 'execute' | 'update' | 'marathon';
  data: any;
  timestamp: string;
  success: boolean;
  duration: number;
}

export interface SessionContext {
  knowledgeLoaded: boolean;
  marathonActive: boolean;
  toolsAvailable: string[];
  integrationStatus: Record<string, boolean>;
  recentInteractions: string[];
}

export interface SessionMetadata {
  userAgent?: string;
  clientVersion?: string;
  features: string[];
  preferences: Record<string, any>;
}

export interface MarathonState {
  sessionId: string;
  previousSessionId?: string;
  taskDescription: string;
  timestamp: string;
  context: any;
  commands: CommandExecution[];
  checkpoints: CheckpointInfo[];
  status: 'active' | 'paused' | 'ready_for_continuation' | 'completed';
  estimatedTimeRemaining?: number;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export interface CheckpointInfo {
  id: string;
  timestamp: string;
  description: string;
  data: any;
  automatic: boolean;
  critical: boolean;
}

export interface MCPConfig {
  server: {
    name: string;
    version: string;
    dataDirectory: string;
  };
  marathon: {
    autoSaveInterval: number; // minutes
    maxSessionDuration: number; // minutes
    checkpointThreshold: number; // commands
    compressionEnabled: boolean;
  };
  memory: {
    vectorDimensions: number;
    maxMemorySize: number; // MB
    retentionDays: number;
    embeddingModel: string;
  };
  integrations: {
    n8n: {
      enabled: boolean;
      baseUrl: string;
      apiKey?: string;
    };
    supabase: {
      enabled: boolean;
      url: string;
      apiKey?: string;
      serviceKey?: string;
    };
    chrome: {
      enabled: boolean;
      baseUrl: string;
      apiToken?: string;
    };
    erpnext: {
      enabled: boolean;
      baseUrl: string;
      username?: string;
      password?: string;
    };
  };
  monitoring: {
    enabled: boolean;
    interval: number; // seconds
    healthChecks: boolean;
    metricsCollection: boolean;
  };
  security: {
    encryptionKey?: string;
    rateLimiting: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
    authentication: {
      required: boolean;
      type: 'none' | 'token' | 'oauth';
    };
  };
}

export interface MemorySearchResult {
  items: MemoryItem[];
  totalCount: number;
  query: string;
  executionTime: number;
}

export interface MemoryItem {
  id: string;
  content: string;
  category: keyof KnowledgeBase;
  embedding?: number[];
  metadata: Record<string, any>;
  relevanceScore: number;
  timestamp: string;
}

export interface ToolIntegration {
  name: string;
  type: 'mcp' | 'api' | 'webhook';
  enabled: boolean;
  configuration: Record<string, any>;
  lastUsed?: string;
  usageCount: number;
  successRate: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: Record<string, ComponentHealth>;
  lastCheck: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  message?: string;
}

export interface ErrorInfo {
  id: string;
  timestamp: string;
  type: 'system' | 'integration' | 'user' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, any>;
  resolved: boolean;
  resolution?: string;
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    commandsPerMinute: number;
  };
  memory: {
    used: number;
    available: number;
    percentage: number;
  };
  storage: {
    knowledgeBase: number;
    sessions: number;
    total: number;
  };
}

// Event types for Marathon Mode
export interface MarathonEvent {
  type: 'checkpoint' | 'save' | 'switch' | 'continue' | 'error';
  timestamp: string;
  sessionId: string;
  data: any;
  metadata?: Record<string, any>;
}

// Command parsing types
export interface ParsedCommand {
  symbols: CommandSymbol[];
  taskDescription: string;
  hasLoad: boolean;
  hasExecute: boolean;
  hasUpdate: boolean;
  hasMarathon: boolean;
  isValid: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration?: number;
}

// Integration response types
export interface IntegrationResponse {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
  service: string;
}

// Vector database types
export interface VectorSearchQuery {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}