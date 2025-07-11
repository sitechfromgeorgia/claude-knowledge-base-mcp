# Claude Knowledge Base MCP v3.0 - Example Configurations

This directory contains example configurations for different use cases and environments.

## Configuration Files

### 1. Basic Configuration (`basic-config.json`)
Minimal setup for personal use with local storage only.

### 2. Development Configuration (`development-config.json`)
Enhanced setup for development work with full tool integration and debugging.

### 3. Production Configuration (`production-config.json`)
Optimized setup for production environments with performance monitoring.

### 4. Claude Desktop Configurations
- `claude-desktop-basic.json` - Basic Claude Desktop setup
- `claude-desktop-advanced.json` - Advanced setup with all features
- `claude-desktop-development.json` - Development-specific setup

## Environment Variables

### Core Settings
```bash
KB_DATA_DIR="/path/to/data"                    # Data storage directory
KB_AUTO_SAVE_INTERVAL="5"                     # Auto-save interval (minutes)
KB_MARATHON_ENABLED="true"                    # Enable Marathon Mode
KB_MAX_CONTEXT_SIZE="100000"                  # Context overflow threshold
```

### NLP Settings
```bash
KB_VECTOR_DIMENSION="300"                     # Embedding dimensions (100-500)
KB_ENABLE_STEMMING="true"                     # Enable word stemming
KB_REMOVE_STOPWORDS="true"                    # Remove stopwords
KB_CACHE_SIZE="10000"                         # NLP cache size
KB_NLP_LANGUAGE="en"                          # Language (en, es, fr, de, etc.)
```

### Performance Settings
```bash
KB_MAX_MEMORY_ITEMS="50000"                   # Maximum stored memories
KB_COMPRESSION_THRESHOLD="0.8"                # Context compression trigger
KB_PERFORMANCE_MONITORING="true"              # Enable performance tracking
KB_ANALYTICS_ENABLED="true"                   # Enable analytics
```

### Tool Integration
```bash
KB_TOOL_INTEGRATION="true"                    # Enable tool integration
KB_FILE_WATCHING="true"                       # Enable file watching
KB_INTEGRATION_SYNC_INTERVAL="30"             # Sync interval (seconds)
KB_DESKTOP_COMMANDER_ENABLED="true"           # Enable Desktop Commander integration
KB_GITHUB_INTEGRATION="true"                  # Enable GitHub integration
KB_FILESYSTEM_INTEGRATION="true"              # Enable Filesystem integration
```

### Security & Privacy
```bash
KB_ENCRYPT_SENSITIVE_DATA="false"             # Encrypt sensitive data
KB_DATA_RETENTION_DAYS="365"                  # Data retention (days)
KB_AUDIT_LOGGING="true"                       # Enable audit logging
KB_BACKUP_ENABLED="true"                      # Enable automatic backups
KB_BACKUP_INTERVAL="24"                       # Backup interval (hours)
```

### Development & Debugging
```bash
KB_LOG_LEVEL="info"                           # Log level (debug, info, warn, error)
KB_DEBUG_MODE="false"                         # Enable debug mode
KB_ENABLE_BENCHMARKING="false"                # Enable performance benchmarking
KB_VERBOSE_LOGGING="false"                    # Enable verbose logging
```

## Configuration Examples by Use Case

### Personal Knowledge Management
```json
{
  "dataDir": "~/.claude-knowledge-base",
  "maxContextSize": 50000,
  "autoSaveInterval": 10,
  "vectorDimension": 200,
  "maxMemoryItems": 10000,
  "marathonEnabled": true,
  "integrations": {
    "desktopCommander": false,
    "github": false,
    "filesystem": true
  },
  "performance": {
    "monitoring": false,
    "analytics": true,
    "recommendations": true
  }
}
```

### Software Development
```json
{
  "dataDir": "~/dev/.claude-knowledge-base",
  "maxContextSize": 100000,
  "autoSaveInterval": 3,
  "vectorDimension": 300,
  "maxMemoryItems": 50000,
  "marathonEnabled": true,
  "integrations": {
    "desktopCommander": true,
    "github": true,
    "filesystem": true
  },
  "performance": {
    "monitoring": true,
    "analytics": true,
    "recommendations": true
  }
}
```

### Research & Analysis
```json
{
  "dataDir": "~/research/.claude-knowledge-base",
  "maxContextSize": 150000,
  "autoSaveInterval": 5,
  "vectorDimension": 400,
  "maxMemoryItems": 100000,
  "marathonEnabled": true,
  "nlpSettings": {
    "enableStemming": true,
    "removeStopwords": true,
    "language": "en",
    "cacheSize": 20000
  },
  "integrations": {
    "desktopCommander": true,
    "github": false,
    "filesystem": true
  }
}
```

### Team Collaboration
```json
{
  "dataDir": "/shared/.claude-knowledge-base",
  "maxContextSize": 200000,
  "autoSaveInterval": 2,
  "vectorDimension": 300,
  "maxMemoryItems": 200000,
  "marathonEnabled": true,
  "security": {
    "encryptSensitiveData": true,
    "dataRetentionDays": 90,
    "auditLogging": true
  },
  "performance": {
    "monitoring": true,
    "analytics": true,
    "recommendations": true
  }
}
```

## Quick Setup Commands

### Basic Setup
```bash
npm install
npm run build
npm run setup
```

### Development Setup
```bash
npm install
npm run build
KB_DEBUG_MODE=true KB_VERBOSE_LOGGING=true npm run setup
```

### Custom Data Directory
```bash
KB_DATA_DIR="/custom/path" npm run setup
```

### Environment-Specific Setup
```bash
# Development
NODE_ENV=development npm run setup

# Production
NODE_ENV=production npm run setup
```

## Troubleshooting Configuration

### Common Issues

1. **Permission Errors**
   ```bash
   sudo chown -R $USER:$USER ~/.claude-knowledge-base
   chmod 755 ~/.claude-knowledge-base
   ```

2. **SQLite Errors**
   ```bash
   # Clear and reinitialize database
   rm ~/.claude-knowledge-base/knowledge-base.db
   npm run setup
   ```

3. **NLP Performance Issues**
   ```bash
   # Reduce vector dimensions for better performance
   KB_VECTOR_DIMENSION=100 npm run setup
   ```

4. **Memory Issues**
   ```bash
   # Reduce cache size and memory limits
   KB_CACHE_SIZE=5000 KB_MAX_MEMORY_ITEMS=10000 npm run setup
   ```

### Performance Optimization

1. **For Low-End Systems**
   ```json
   {
     "vectorDimension": 100,
     "maxMemoryItems": 5000,
     "nlpSettings": {
       "cacheSize": 2000
     },
     "performance": {
       "monitoring": false
     }
   }
   ```

2. **For High-End Systems**
   ```json
   {
     "vectorDimension": 500,
     "maxMemoryItems": 100000,
     "nlpSettings": {
       "cacheSize": 50000
     },
     "performance": {
       "monitoring": true,
       "analytics": true
     }
   }
   ```

## Migration from Previous Versions

### From v2.0 to v3.0
```bash
# Backup existing data
cp -r ~/.claude-knowledge-base ~/.claude-knowledge-base-v2-backup

# Run migration
npm run migrate

# Verify migration
npm run stats
```

### Configuration Migration
v3.0 introduces new configuration options. The migration script will:
1. Preserve all existing memories and sessions
2. Convert old configuration format to new format
3. Add new default settings for v3.0 features
4. Create backup of old configuration

## Support

For configuration help:
1. Check the logs: `tail -f ~/.claude-knowledge-base/logs/application.log`
2. Run diagnostics: `npm run test:integration`
3. Reset configuration: `npm run setup` (with backup)
4. GitHub Issues: https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues
