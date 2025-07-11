# 🔧 API Reference - Claude Knowledge Base MCP v3.0

## MCP Tools

### 🧠 Knowledge Management

#### `kb_context_manager`
**Description**: Core context management and persistent memory operations

**Parameters**:
- `action` (required): `load`, `save`, `analyze`, `sync`
- `query` (optional): Search query for loading context
- `data` (optional): Data to save (JSON string)
- `options` (optional): Additional options (JSON string)

**Examples**:
```bash
# Load recent context
kb_context_manager --action=load --query="recent deployments"

# Save progress with metadata
kb_context_manager --action=save --data='{"progress":"API deployed","tags":["deployment","success"]}'

# Analyze context patterns
kb_context_manager --action=analyze
```

#### `kb_semantic_search`
**Description**: Advanced semantic search with NLP processing

**Parameters**:
- `query` (required): Search query
- `options` (optional): Search options (JSON string)
  - `threshold`: Similarity threshold (0.0-1.0)
  - `expandQuery`: Expand query with synonyms
  - `includeAnalysis`: Include semantic analysis

**Examples**:
```bash
# Basic search
kb_semantic_search --query="database connection issues"

# Advanced search with options
kb_semantic_search --query="API performance" --options='{"threshold":0.3,"expandQuery":true}'
```

### ⚡ Command Execution

#### `kb_command_execute`
**Description**: Execute enhanced commands with memory integration

**Parameters**:
- `command` (required): Command to execute
- `syntax` (optional): `symbol` or `slash` (default: auto-detect)
- `options` (optional): Execution options (JSON string)

**Examples**:
```bash
# Symbol syntax
kb_command_execute --command="--- Load deployment context"

# Slash syntax  
kb_command_execute --command="/deploy api --environment=production"
```

### 🏃‍♂️ Marathon Mode

#### `kb_marathon_manager`
**Description**: Marathon Mode management and session continuity

**Parameters**:
- `action` (required): `start`, `checkpoint`, `transfer`, `restore`, `analytics`
- `task` (optional): Task description for start action
- `checkpointId` (optional): Checkpoint ID for restore
- `options` (optional): Additional options (JSON string)

**Examples**:
```bash
# Start marathon mode
kb_marathon_manager --action=start --task="Complete infrastructure setup"

# Create checkpoint
kb_marathon_manager --action=checkpoint --options='{"description":"Database setup complete"}'

# Transfer session
kb_marathon_manager --action=transfer

# View analytics
kb_marathon_manager --action=analytics
```

### 🔌 Tool Integration

#### `kb_tool_integration`
**Description**: Integration with Desktop Commander, GitHub, and Filesystem tools

**Parameters**:
- `action` (required): `status`, `execute`, `connect`, `sync`
- `tool` (optional): `desktop-commander`, `github`, `filesystem`, `all`
- `command` (optional): Command to execute via tool
- `parameters` (optional): Command parameters (JSON string)

**Examples**:
```bash
# Check integration status
kb_tool_integration --action=status

# Execute via Desktop Commander
kb_tool_integration --action=execute --tool=desktop-commander --command="ls -la"

# GitHub operations
kb_tool_integration --action=execute --tool=github --command="commit" --parameters='{"message":"Auto-commit"}'
```

### 📊 Analytics & Monitoring

#### `kb_analytics`
**Description**: System analytics and performance monitoring

**Parameters**:
- `type` (required): `performance`, `memory`, `integrations`, `recommendations`
- `timeRange` (optional): Time range for analysis (e.g., "1d", "1w")
- `detailed` (optional): Include detailed analysis (boolean)

**Examples**:
```bash
# Performance metrics
kb_analytics --type=performance --timeRange=1d

# Memory usage
kb_analytics --type=memory --detailed=true

# Integration effectiveness
kb_analytics --type=integrations --timeRange=1w
```

## Command Syntax Support

### Symbol Commands
- `---` : Load context
- `+++` : Execute task
- `...` : Save progress  
- `***` : Marathon mode

### Slash Commands
- `/search` : Advanced search
- `/deploy` : Deployment operations
- `/save` : Save with metadata
- `/load` : Load with filters
- `/marathon` : Marathon management
- `/execute` : Task execution
- `/config` : Configuration
- `/stats` : Quick statistics
- `/help` : Interactive help

## Response Format

All MCP tools return standardized JSON responses:

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "metadata": {
    "timestamp": string,
    "operation": string,
    "performance": {
      "executionTime": number,
      "memoryUsage": number
    }
  },
  "error": string | null
}
```

## Error Handling

Standard error codes:
- `INVALID_PARAMETERS`: Missing or invalid parameters
- `DATABASE_ERROR`: SQLite database issues
- `NLP_ERROR`: Natural language processing errors
- `TOOL_INTEGRATION_ERROR`: Tool integration failures
- `MARATHON_ERROR`: Marathon mode issues
- `PERFORMANCE_ERROR`: Performance or resource issues

---

**🇬🇪 Detailed API documentation - Built in Batumi, Georgia 🌊**