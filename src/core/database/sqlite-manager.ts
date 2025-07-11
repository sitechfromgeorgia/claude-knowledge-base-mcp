import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MemoryItem, Entity, Relationship, Checkpoint, SessionData } from '../types.js';

export class SQLiteManager {
  private db: Database.Database;
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.ensureDataDirectory();
    this.db = new Database(join(dataDir, 'knowledge-base.db'));
    this.initializeSchema();
    this.enableFTS();
  }

  private ensureDataDirectory(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initializeSchema(): void {
    // Memories table with FTS5 support
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT DEFAULT 'medium',
        session_id TEXT,
        timestamp TEXT NOT NULL,
        tags TEXT, -- JSON array
        metadata TEXT, -- JSON object
        embedding BLOB -- Vector embedding
      );

      -- FTS5 virtual table for full-text search
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        category,
        tags,
        content=memories,
        content_rowid=rowid
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories
      BEGIN
        INSERT INTO memories_fts(rowid, content, category, tags)
        VALUES (new.rowid, new.content, new.category, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories
      BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, category, tags)
        VALUES ('delete', old.rowid, old.content, old.category, old.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories
      BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, content, category, tags)
        VALUES ('delete', old.rowid, old.content, old.category, old.tags);
        INSERT INTO memories_fts(rowid, content, category, tags)
        VALUES (new.rowid, new.content, new.category, new.tags);
      END;
    `);

    // Entities table for knowledge graph
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        properties TEXT, -- JSON object
        connections TEXT, -- JSON array
        last_updated TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
    `);

    // Relationships table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        properties TEXT, -- JSON object
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_id);
      CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_id);
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        end_time TEXT,
        marathon_mode INTEGER DEFAULT 0,
        context_size INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        metadata TEXT -- JSON object
      );
    `);

    // Commands table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        command TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        duration INTEGER,
        success INTEGER,
        result TEXT, -- JSON object
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_commands_session ON commands(session_id);
    `);

    // Checkpoints table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL, -- auto, manual, critical
        timestamp TEXT NOT NULL,
        context_snapshot TEXT, -- JSON object
        memory_state TEXT, -- JSON array
        next_actions TEXT, -- JSON array
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);

    // Vector similarity index (simplified approach)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vector_index (
        memory_id TEXT PRIMARY KEY,
        vector_hash TEXT NOT NULL, -- Hash of vector for similarity grouping
        magnitude REAL NOT NULL, -- Vector magnitude for normalization
        FOREIGN KEY (memory_id) REFERENCES memories(id)
      );

      CREATE INDEX IF NOT EXISTS idx_vector_hash ON vector_index(vector_hash);
    `);
  }

  private enableFTS(): void {
    // Enable FTS5 extensions if available
    try {
      this.db.pragma('table_info(memories_fts)');
    } catch (error) {
      console.warn('FTS5 not available, falling back to regular search');
    }
  }

  // === MEMORY OPERATIONS ===

  saveMemory(memory: MemoryItem): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memories (
        id, content, category, priority, session_id, timestamp, tags, metadata, embedding
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      memory.id,
      memory.content,
      memory.category,
      memory.priority,
      memory.sessionId,
      memory.timestamp,
      JSON.stringify(memory.tags || []),
      JSON.stringify(memory.metadata || {}),
      memory.embedding ? Buffer.from(new Float32Array(memory.embedding).buffer) : null
    );

    // Update vector index
    if (memory.embedding) {
      this.updateVectorIndex(memory.id, memory.embedding);
    }
  }

  searchMemories(query: string, options: {
    limit?: number;
    categories?: string[];
    timeRange?: { start: string; end: string };
    threshold?: number;
  } = {}): MemoryItem[] {
    const { limit = 10, categories, timeRange } = options;

    let sql = `
      SELECT m.*, 
             snippet(memories_fts, 0, '<mark>', '</mark>', '...', 20) as snippet,
             rank
      FROM memories_fts 
      INNER JOIN memories m ON memories_fts.rowid = m.rowid
      WHERE memories_fts MATCH ?
    `;

    const params: any[] = [query];

    if (categories && categories.length > 0) {
      sql += ` AND m.category IN (${categories.map(() => '?').join(',')})`;
      params.push(...categories);
    }

    if (timeRange) {
      sql += ` AND m.timestamp BETWEEN ? AND ?`;
      params.push(timeRange.start, timeRange.end);
    }

    sql += ` ORDER BY rank LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params);

    return rows.map(row => this.rowToMemory(row));
  }

  getMemoriesByEmbedding(embedding: number[], threshold: number = 0.3, limit: number = 10): MemoryItem[] {
    // Find similar vectors using simplified cosine similarity
    const vectorHash = this.calculateVectorHash(embedding);
    const magnitude = this.calculateMagnitude(embedding);

    const stmt = this.db.prepare(`
      SELECT m.*, v.magnitude, v.vector_hash
      FROM memories m
      INNER JOIN vector_index v ON m.id = v.memory_id
      WHERE v.vector_hash = ? OR abs(v.magnitude - ?) < 0.5
      ORDER BY m.timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(vectorHash, magnitude, limit * 2);

    // Calculate actual similarity for the candidates
    const candidates = rows.map(row => {
      const memory = this.rowToMemory(row);
      const similarity = memory.embedding 
        ? this.cosineSimilarity(embedding, memory.embedding)
        : 0;
      return { memory, similarity };
    });

    return candidates
      .filter(c => c.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(c => c.memory);
  }

  getMemory(id: string): MemoryItem | null {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToMemory(row) : null;
  }

  deleteMemory(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    const result = stmt.run(id);
    
    // Clean up vector index
    const vectorStmt = this.db.prepare('DELETE FROM vector_index WHERE memory_id = ?');
    vectorStmt.run(id);
    
    return result.changes > 0;
  }

  // === ENTITY OPERATIONS ===

  saveEntity(entity: Entity): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO entities (
        id, name, type, properties, connections, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entity.id,
      entity.name,
      entity.type,
      JSON.stringify(entity.properties),
      JSON.stringify(entity.connections),
      entity.lastUpdated
    );
  }

  getEntity(id: string): Entity | null {
    const stmt = this.db.prepare('SELECT * FROM entities WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToEntity(row) : null;
  }

  searchEntities(query: string, limit: number = 10): Entity[] {
    const stmt = this.db.prepare(`
      SELECT * FROM entities 
      WHERE name LIKE ? OR type LIKE ?
      ORDER BY last_updated DESC 
      LIMIT ?
    `);
    
    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm, limit);
    return rows.map(row => this.rowToEntity(row));
  }

  // === SESSION OPERATIONS ===

  saveSession(session: SessionData): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO sessions (
        id, start_time, end_time, marathon_mode, context_size, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.startTime,
      session.endTime || null,
      session.marathonMode ? 1 : 0,
      session.contextSize,
      session.status,
      JSON.stringify({
        checkpoints: session.checkpoints?.length || 0,
        commands: session.commands?.length || 0
      })
    );

    // Save commands
    if (session.commands) {
      session.commands.forEach(command => {
        this.saveCommand(session.id, command);
      });
    }
  }

  getSession(id: string): SessionData | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;

    // Load commands
    const commandsStmt = this.db.prepare('SELECT * FROM commands WHERE session_id = ? ORDER BY timestamp');
    const commandRows = commandsStmt.all(id);

    return {
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      marathonMode: row.marathon_mode === 1,
      contextSize: row.context_size,
      status: row.status,
      commands: commandRows.map(cmdRow => ({
        command: cmdRow.command,
        type: cmdRow.type,
        timestamp: cmdRow.timestamp,
        duration: cmdRow.duration,
        success: cmdRow.success === 1,
        result: cmdRow.result ? JSON.parse(cmdRow.result) : null
      })),
      checkpoints: [] // Load separately if needed
    };
  }

  private saveCommand(sessionId: string, command: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO commands (
        id, session_id, command, type, timestamp, duration, success, result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      command.id || `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      command.command,
      command.type,
      command.timestamp,
      command.duration || 0,
      command.success ? 1 : 0,
      command.result ? JSON.stringify(command.result) : null
    );
  }

  // === CHECKPOINT OPERATIONS ===

  saveCheckpoint(checkpoint: Checkpoint): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO checkpoints (
        id, session_id, type, timestamp, context_snapshot, memory_state, next_actions
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      checkpoint.id,
      checkpoint.sessionId,
      checkpoint.type,
      checkpoint.timestamp,
      checkpoint.contextSnapshot,
      JSON.stringify(checkpoint.memoryState),
      JSON.stringify(checkpoint.nextActions)
    );
  }

  getCheckpoint(id: string): Checkpoint | null {
    const stmt = this.db.prepare('SELECT * FROM checkpoints WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToCheckpoint(row) : null;
  }

  // === UTILITY METHODS ===

  private updateVectorIndex(memoryId: string, embedding: number[]): void {
    const vectorHash = this.calculateVectorHash(embedding);
    const magnitude = this.calculateMagnitude(embedding);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO vector_index (memory_id, vector_hash, magnitude)
      VALUES (?, ?, ?)
    `);

    stmt.run(memoryId, vectorHash, magnitude);
  }

  private calculateVectorHash(vector: number[]): string {
    // Simple hash based on vector quartiles
    const sorted = [...vector].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    
    return `${Math.round(q1 * 100)}_${Math.round(median * 100)}_${Math.round(q3 * 100)}`;
  }

  private calculateMagnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // === ROW CONVERTERS ===

  private rowToMemory(row: any): MemoryItem {
    return {
      id: row.id,
      content: row.content,
      category: row.category,
      priority: row.priority,
      sessionId: row.session_id,
      timestamp: row.timestamp,
      tags: row.tags ? JSON.parse(row.tags) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      embedding: row.embedding 
        ? Array.from(new Float32Array(row.embedding.buffer))
        : undefined
    };
  }

  private rowToEntity(row: any): Entity {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      properties: JSON.parse(row.properties),
      connections: JSON.parse(row.connections),
      lastUpdated: row.last_updated
    };
  }

  private rowToCheckpoint(row: any): Checkpoint {
    return {
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      timestamp: row.timestamp,
      contextSnapshot: row.context_snapshot,
      memoryState: JSON.parse(row.memory_state),
      nextActions: JSON.parse(row.next_actions)
    };
  }

  // === MAINTENANCE ===

  vacuum(): void {
    this.db.pragma('vacuum');
  }

  close(): void {
    this.db.close();
  }

  getStats(): any {
    const stats = {
      memories: this.db.prepare('SELECT COUNT(*) as count FROM memories').get(),
      entities: this.db.prepare('SELECT COUNT(*) as count FROM entities').get(),
      sessions: this.db.prepare('SELECT COUNT(*) as count FROM sessions').get(),
      checkpoints: this.db.prepare('SELECT COUNT(*) as count FROM checkpoints').get(),
      dbSize: this.db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get()
    };

    return stats;
  }
}
