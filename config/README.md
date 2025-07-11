# Claude Desktop Configuration Examples

This directory contains configuration examples for different use cases.

## Basic Configuration

**File: `~/.config/claude_desktop_config.json` (Linux/Mac)**  
**File: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)**

### Minimal Setup (Local Only)
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base"
      }
    }
  }
}
```

### Standard Setup with Marathon Mode
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base",
        "KB_AUTO_SAVE_INTERVAL": "5",
        "KB_MARATHON_ENABLED": "true",
        "KB_MAX_CONTEXT_SIZE": "100000",
        "KB_CONTEXT_OVERFLOW_THRESHOLD": "80000"
      }
    }
  }
}
```

### Advanced Setup with Optional Integrations
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base",
        "KB_AUTO_SAVE_INTERVAL": "3",
        "KB_MARATHON_ENABLED": "true",
        "KB_MAX_CONTEXT_SIZE": "150000",
        "KB_VECTOR_DIMENSION": "384",
        "KB_MAX_MEMORY_ITEMS": "20000",
        "KB_COMPRESSION_THRESHOLD": "0.7",
        "KB_VECTOR_DB": "qdrant",
        "KB_QDRANT_URL": "http://localhost:6333",
        "KB_STORAGE": "supabase",
        "KB_SUPABASE_URL": "https://your-project.supabase.co",
        "KB_SUPABASE_ANON_KEY": "your-anon-key",
        "KB_WORKFLOWS": "n8n",
        "KB_N8N_URL": "http://localhost:5678",
        "KB_N8N_API_KEY": "your-n8n-api-key"
      }
    }
  }
}
```

## Environment Variables Reference

### Core Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `KB_DATA_DIR` | `~/.claude-knowledge-base` | Data storage directory |
| `KB_AUTO_SAVE_INTERVAL` | `5` | Auto-save interval in minutes |
| `KB_MARATHON_ENABLED` | `true` | Enable Marathon Mode |
| `KB_MAX_CONTEXT_SIZE` | `100000` | Maximum context size before overflow |
| `KB_CONTEXT_OVERFLOW_THRESHOLD` | `80000` | Context size to trigger transfer |

### Memory Settings
| Variable | Default | Description |
|----------|---------|-------------|
| `KB_VECTOR_DIMENSION` | `100` | Vector embedding dimensions |
| `KB_MAX_MEMORY_ITEMS` | `10000` | Maximum stored memory items |
| `KB_COMPRESSION_THRESHOLD` | `0.8` | Context compression trigger |

### Optional Integrations

#### Vector Database
| Variable | Options | Description |
|----------|---------|-------------|
| `KB_VECTOR_DB` | `local`, `qdrant`, `chroma`, `pinecone` | Vector database type |
| `KB_QDRANT_URL` | - | Qdrant server URL |
| `KB_QDRANT_API_KEY` | - | Qdrant API key (if required) |
| `KB_CHROMA_URL` | - | ChromaDB server URL |
| `KB_PINECONE_API_KEY` | - | Pinecone API key |
| `KB_PINECONE_ENVIRONMENT` | - | Pinecone environment |

#### Storage Backend
| Variable | Options | Description |
|----------|---------|-------------|
| `KB_STORAGE` | `local`, `supabase`, `s3` | Storage backend |
| `KB_SUPABASE_URL` | - | Supabase project URL |
| `KB_SUPABASE_ANON_KEY` | - | Supabase anonymous key |
| `KB_AWS_ACCESS_KEY_ID` | - | AWS access key |
| `KB_AWS_SECRET_ACCESS_KEY` | - | AWS secret key |
| `KB_AWS_REGION` | - | AWS region |
| `KB_S3_BUCKET` | - | S3 bucket name |

#### Workflow Integration
| Variable | Options | Description |
|----------|---------|-------------|
| `KB_WORKFLOWS` | `none`, `n8n`, `zapier` | Workflow engine |
| `KB_N8N_URL` | - | n8n server URL |
| `KB_N8N_API_KEY` | - | n8n API key |
| `KB_ZAPIER_API_KEY` | - | Zapier API key |

## Platform-Specific Setup

### macOS
```bash
# Claude Desktop config location
~/.config/claude_desktop_config.json

# Example installation path
/Applications/Claude.app/Contents/Resources/claude_desktop_config.json
```

### Windows
```powershell
# Claude Desktop config location
%APPDATA%\Claude\claude_desktop_config.json

# Example with Windows paths
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["C:\\Users\\Username\\claude-knowledge-base-mcp\\dist\\server.js"],
      "env": {
        "KB_DATA_DIR": "C:\\Users\\Username\\.claude-knowledge-base"
      }
    }
  }
}
```

### Linux
```bash
# Claude Desktop config location
~/.config/claude_desktop_config.json

# Set proper permissions
chmod 600 ~/.config/claude_desktop_config.json
```

## Development Configuration

### With tsx for Development
```json
{
  "mcpServers": {
    "claude-knowledge-base-dev": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "cwd": "/path/to/claude-knowledge-base-mcp",
      "env": {
        "NODE_ENV": "development",
        "KB_DATA_DIR": "./dev-data",
        "KB_AUTO_SAVE_INTERVAL": "1",
        "KB_MARATHON_ENABLED": "true"
      }
    }
  }
}
```

### Multiple Instances
```json
{
  "mcpServers": {
    "claude-kb-personal": {
      "command": "node",
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-kb-personal"
      }
    },
    "claude-kb-work": {
      "command": "node", 
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/work/.claude-kb-work",
        "KB_MAX_MEMORY_ITEMS": "50000"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

**1. Permission Denied**
```bash
# Fix file permissions
chmod +x /path/to/claude-knowledge-base-mcp/dist/server.js
```

**2. Node.js Path Issues**
```json
{
  "command": "/usr/local/bin/node",
  "args": ["/absolute/path/to/dist/server.js"]
}
```

**3. Data Directory Creation**
```bash
# Ensure directory exists
mkdir -p ~/.claude-knowledge-base
chmod 755 ~/.claude-knowledge-base
```

### Debug Configuration
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["--inspect", "/path/to/dist/server.js"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "claude-kb:*",
        "KB_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Performance Tuning

### High-Performance Setup
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["--max-old-space-size=4096", "/path/to/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "/fast-ssd/.claude-knowledge-base",
        "KB_MAX_MEMORY_ITEMS": "100000",
        "KB_VECTOR_DIMENSION": "384",
        "KB_AUTO_SAVE_INTERVAL": "2",
        "KB_COMPRESSION_THRESHOLD": "0.6"
      }
    }
  }
}
```

### Low-Resource Setup
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["--max-old-space-size=512", "/path/to/dist/server.js"],
      "env": {
        "KB_MAX_MEMORY_ITEMS": "1000",
        "KB_VECTOR_DIMENSION": "50",
        "KB_AUTO_SAVE_INTERVAL": "10",
        "KB_COMPRESSION_THRESHOLD": "0.9"
      }
    }
  }
}
```

## Security Considerations

### Secure Configuration
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/path/to/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base",
        "KB_ENABLE_ENCRYPTION": "true",
        "KB_ENCRYPTION_KEY": "your-32-character-encryption-key",
        "KB_AUDIT_LOG": "true",
        "KB_MAX_SESSIONS": "10"
      }
    }
  }
}
```

### File Permissions
```bash
# Secure data directory
chmod 700 ~/.claude-knowledge-base
chmod 600 ~/.claude-knowledge-base/*

# Secure config file
chmod 600 ~/.config/claude_desktop_config.json
```
