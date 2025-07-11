# 🧠 Claude Knowledge Base MCP v2.0

**Advanced Memory Management | Marathon Mode | Smart Context**

Transform your Claude Desktop into a persistent, intelligent assistant with advanced memory capabilities and automated workflow management.

## ✨ Core Features

### 🧠 **Advanced Memory System**
- **Vector Search**: Semantic similarity search with intelligent ranking
- **Knowledge Graph**: Relationship tracking between concepts and entities  
- **Context Compression**: Efficient storage and retrieval of large contexts
- **Cross-Session Persistence**: Never lose progress between chat sessions

### ⚡ **Marathon Mode Automation**
- **Auto-Save**: Automatic checkpoints every 5 minutes
- **Context Transfer**: Seamless session switching when context fills up
- **Smart Triggers**: Automated "new chat" creation with continuation instructions
- **Error Recovery**: Robust rollback and recovery mechanisms

### 🔧 **Enhanced Command System**
- **`---`** = Smart context loading with relevance filtering
- **`+++`** = Complex task execution with tool chaining and sequential thinking
- **`...`** = Event-driven progress saving with intelligent categorization
- **`***`** = Automated Marathon Mode with session management

### 🔌 **Optional Integrations** 
Choose what fits your infrastructure:
- **Vector DB**: Local, Qdrant, ChromaDB, Pinecone
- **Storage**: Local files, Supabase, S3
- **Workflows**: None, n8n, Zapier integration
- **Monitoring**: Basic, Custom, None

## 🚀 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

**Basic Setup (Local only):**
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base"
      }
    }
  }
}
```

**Advanced Setup with Optional Integrations:**
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node", 
      "args": ["path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base",
        "KB_AUTO_SAVE_INTERVAL": "5",
        "KB_MARATHON_ENABLED": "true",
        "KB_MAX_CONTEXT_SIZE": "100000",
        "KB_VECTOR_DB": "local",
        "KB_STORAGE": "local",
        "KB_WORKFLOWS": "none"
      }
    }
  }
}
```

### 3. First Use
```bash
# In Claude Desktop, try:
--- What do I have in my knowledge base?

# Or start a complex task with Marathon Mode:
+++ *** Deploy a complete production infrastructure with monitoring

# Save important progress:
... Completed database setup, starting API configuration
```

## 💡 Usage Examples

### Basic Memory Operations
```bash
# Load relevant context
--- Show me everything about my server infrastructure

# Execute complex task with tool chaining  
+++ Set up monitoring dashboard for all services

# Save progress with smart categorization
... Infrastructure deployment completed successfully

# Combine multiple operations
--- +++ ... Deploy and document new microservice
```

### Marathon Mode Workflows
```bash
# Start long-running task with Marathon Mode
+++ *** Set up complete CI/CD pipeline from scratch

# When context gets full, automatically transfers to new chat:
# Claude will provide: "Use this in new chat: --- +++ ... *** Continue CI/CD setup from checkpoint abc123"

# In new chat, seamlessly continue:
--- +++ ... *** Continue CI/CD setup from checkpoint abc123
```

### Advanced Memory Search
```bash
# Search with specific tools
kb_search_memory: {
  "query": "database configuration errors",
  "includeGraph": true,
  "threshold": 0.3
}

# Load context with filters
kb_load_context: {
  "query": "production deployment",
  "categories": ["infrastructure", "projects"],
  "limit": 15
}
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Core Settings
KB_DATA_DIR="/path/to/data"                    # Data storage directory
KB_AUTO_SAVE_INTERVAL="5"                     # Auto-save interval (minutes)
KB_MARATHON_ENABLED="true"                    # Enable Marathon Mode
KB_MAX_CONTEXT_SIZE="100000"                  # Context overflow threshold

# Memory Settings  
KB_VECTOR_DIMENSION="100"                     # Vector embedding size
KB_MAX_MEMORY_ITEMS="10000"                   # Maximum stored memories
KB_COMPRESSION_THRESHOLD="0.8"                # Context compression trigger

# Optional Integrations
KB_VECTOR_DB="local"                          # local|qdrant|chroma|pinecone
KB_STORAGE="local"                            # local|supabase|s3
KB_WORKFLOWS="none"                           # none|n8n|zapier
KB_MONITORING="none"                          # none|custom
```

### Advanced Configuration
Create `config.json` in your data directory:
```json
{
  "dataDir": "~/.claude-knowledge-base",
  "maxContextSize": 100000,
  "autoSaveInterval": 5,
  "vectorDimension": 100,
  "maxMemoryItems": 10000,
  "compressionThreshold": 0.8,
  "marathonEnabled": true,
  "contextOverflowThreshold": 80000,
  "checkpointInterval": 5,
  "integrations": {
    "vectorDB": "local",
    "workflows": "none", 
    "storage": "local",
    "monitoring": "none"
  }
}
```

## 🔌 Optional Integrations Setup

### Qdrant Vector Database
```bash
# Install Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Configuration
export KB_VECTOR_DB="qdrant"
export KB_QDRANT_URL="http://localhost:6333"
```

### Supabase Storage
```bash
# Configuration  
export KB_STORAGE="supabase"
export KB_SUPABASE_URL="your-project-url"
export KB_SUPABASE_ANON_KEY="your-anon-key"
```

### n8n Workflow Integration
```bash
# Configuration
export KB_WORKFLOWS="n8n"
export KB_N8N_URL="http://localhost:5678"
export KB_N8N_API_KEY="your-api-key"
```

## 📊 Available Tools

### Core Tools
- **`kb_command`** - Enhanced command processor (---, +++, ..., ***)
- **`kb_load_context`** - Smart context loading with filtering
- **`kb_execute_complex`** - Complex task execution with Marathon Mode
- **`kb_save_progress`** - Intelligent progress saving
- **`kb_marathon_mode`** - Marathon Mode management
- **`kb_search_memory`** - Advanced semantic search

### Memory Operations
```typescript
// Search memories with filters
kb_search_memory({
  query: "server deployment issues",
  includeGraph: true,
  timeRange: { start: "2025-01-01", end: "2025-07-11" },
  threshold: 0.4
})

// Load context for specific categories
kb_load_context({
  query: "infrastructure problems",
  categories: ["infrastructure", "workflows"],
  limit: 20
})
```

## 🏃‍♂️ Marathon Mode Deep Dive

### Automatic Features
- **Context Monitoring**: Tracks context size and triggers transfer automatically
- **Auto-Checkpoints**: Creates checkpoints every 5 minutes during complex tasks
- **Smart Transfer**: Generates continuation instructions for new chat sessions
- **Error Recovery**: Maintains state even if sessions are interrupted

### Manual Control
```bash
# Create manual checkpoint
kb_marathon_mode({ "action": "create_checkpoint" })

# Prepare for transfer
kb_marathon_mode({ "action": "prepare_transfer" })

# Restore from checkpoint
kb_marathon_mode({ 
  "action": "restore_checkpoint",
  "checkpointId": "checkpoint-abc123"
})

# Check status
kb_marathon_mode({ "action": "status" })
```

### Transfer Workflow
1. **Detection**: Context approaching limit (80% threshold)
2. **Checkpoint**: Creates critical checkpoint with full state
3. **Instructions**: Generates transfer command for new chat
4. **Continuation**: New chat loads state and continues seamlessly

## 🎯 Best Practices

### Effective Command Usage
```bash
# For exploration and analysis
--- +++ Analyze current infrastructure and suggest improvements

# For implementation with persistence  
+++ ... Set up new monitoring system and document the process

# For long-running tasks
+++ *** Complete migration project with full documentation

# For continuation after transfer
--- +++ ... *** Continue migration from previous session
```

### Memory Organization
- Use descriptive commands for better categorization
- Add relevant tags in save operations
- Set appropriate priorities (critical, high, medium, low)
- Leverage the knowledge graph for relationship tracking

### Marathon Mode Tips
- Enable for tasks expecting multiple tool calls
- Use clear, descriptive task descriptions
- Monitor checkpoint status regularly
- Keep continuation instructions for reference

## 🛠️ Development

### Building from Source
```bash
npm run build      # Build TypeScript
npm run dev        # Development mode with watch
npm test          # Run tests
npm run lint      # Code linting
```

### Custom Integrations
The system supports pluggable integrations:
- Vector databases (implement VectorStore interface)
- Storage backends (implement StorageAdapter interface)  
- Workflow engines (implement WorkflowAdapter interface)
- Monitoring systems (implement MonitoringAdapter interface)

## 📈 Performance

### Benchmarks
- **Memory Search**: Sub-100ms for 10,000 stored items
- **Context Loading**: 200-500ms depending on complexity
- **Checkpoint Creation**: 50-200ms average
- **Session Transfer**: Near-instantaneous state restoration

### Optimization Tips
- Regular cleanup of old memories (configurable retention)
- Adjust vector dimensions based on content complexity
- Use category filters to narrow search scope
- Monitor context size to prevent overflow

## 🔒 Security & Privacy

### Data Storage
- All data stored locally by default
- Optional cloud integrations require explicit configuration
- No data transmitted without user consent
- Configurable data retention policies

### Access Control
- File system permissions control access
- Optional encryption for sensitive data
- Audit logging for compliance requirements
- GDPR-compliant data handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/wiki)

---

**Transform your Claude Desktop experience from forgetful assistant to persistent AI partner that grows smarter with every interaction!** 🚀
