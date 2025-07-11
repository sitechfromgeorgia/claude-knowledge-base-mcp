# 💡 Usage Examples - Claude Knowledge Base MCP v3.0

## 🚀 Quick Start Examples

### Basic Memory Operations

**Save and Load Context**:
```bash
# Save current progress
... "Completed API authentication system"

# Load recent work context
--- "recent API development"

# Search for specific topics
/search "authentication issues" --recent
```

**Enhanced Search**:
```bash
# Semantic search with options
kb_semantic_search --query="database connection problems" --options='{"threshold":0.3,"expandQuery":true}'

# Search with categories
/search "deployment" --categories=projects,infrastructure --timeframe=1w
```

## 🏃‍♂️ Marathon Mode Workflows

### Starting a Long Task
```bash
# Start marathon mode with task description
/marathon start --task="Setup complete CI/CD pipeline" --auto-save=3

# Alternative symbol syntax
*** "Setting up monitoring infrastructure"
```

### Working with Checkpoints
```bash
# Manual checkpoint during work
/marathon checkpoint --description="Database schema complete"

# Save critical progress
... "Fixed critical security vulnerability" --priority=high --checkpoint
```

### Session Transfer
```bash
# Check if transfer needed
/marathon status

# Transfer to new session
/marathon transfer

# Resume from specific checkpoint
/marathon restore --checkpoint-id="cp_20250711_1200"
```

## 🔌 Tool Integration Examples

### Desktop Commander Integration
```bash
# Check integration status
kb_tool_integration --action=status --tool=desktop-commander

# Execute system commands
kb_tool_integration --action=execute --tool=desktop-commander --command="ls -la /var/log"

# Monitor processes
+++ "Check API server status" --tools=desktop-commander
```

### GitHub Integration
```bash
# Repository operations
kb_tool_integration --action=execute --tool=github --command="status"

# Create commit from context
kb_tool_integration --action=execute --tool=github --command="commit" --parameters='{"message":"Implement user authentication based on saved context"}'

# Track deployment
+++ /deploy api --environment=production --tools=github
```

### Filesystem Integration
```bash
# File monitoring
kb_tool_integration --action=execute --tool=filesystem --command="watch" --parameters='{"path":"/project/src","pattern":"*.ts"}'

# Analyze project structure
+++ "Analyze codebase changes" --tools=filesystem,desktop-commander
```

## 📊 Analytics and Monitoring

### Performance Monitoring
```bash
# System performance overview
/stats --memory --performance

# Detailed analytics
kb_analytics --type=performance --timeRange=1d --detailed=true

# Integration effectiveness
kb_analytics --type=integrations --timeRange=1w
```

### Usage Patterns
```bash
# Command usage statistics
kb_analytics --type=recommendations

# Memory growth analysis
kb_analytics --type=memory --detailed=true
```

## 🚀 Real-World Workflows

### Complete Deployment Workflow
```bash
# 1. Load previous deployment context
--- "last production deployment"

# 2. Start marathon mode for complex task
*** /deploy api --environment=production --marathon

# 3. Execute with tool integration
+++ "Run pre-deployment checks" --tools=desktop-commander,github

# 4. Save checkpoint before critical step
... "Pre-deployment checks passed" --checkpoint --tags=deployment,verified

# 5. Execute deployment
+++ /execute "Deploy to production" --tools=all

# 6. Monitor and save results
... "Production deployment successful" --priority=high --tags=deployment,success

# 7. Final marathon checkpoint
/marathon checkpoint --description="Production deployment complete - all systems green"
```

### Research and Development Workflow
```bash
# 1. Load research context
/load "machine learning optimization" --categories=research,projects

# 2. Start research session
*** "Research and implement performance optimizations"

# 3. Search for related work
/search "ML model optimization techniques" --semantic --expandQuery

# 4. Execute experiments
+++ "Test optimization approach #1" --tools=desktop-commander

# 5. Save findings
... "Optimization approach #1 improved performance by 15%" --tags=research,success,ML

# 6. Continue with next approach
+++ "Test optimization approach #2"

# 7. Analyze results
kb_analytics --type=recommendations --timeRange=current-session
```

### Bug Investigation Workflow
```bash
# 1. Search for related issues
/search "error 500 API" --recent --include-context

# 2. Load error context
--- "recent API errors and debugging sessions"

# 3. Start debugging marathon
*** "Investigate and fix critical API error"

# 4. Check system status
+++ "Analyze logs and system status" --tools=desktop-commander

# 5. Save findings
... "Error source identified: database connection timeout" --priority=critical --tags=bugfix,database

# 6. Test fix
+++ "Implement and test database connection fix" --tools=desktop-commander,github

# 7. Verify solution
... "Bug fixed and verified - API response time improved" --tags=bugfix,success,verified
```

### Team Collaboration Setup
```bash
# 1. Initialize team knowledge base
kb_context_manager --action=load --query="team onboarding and project structure"

# 2. Document project setup
... "Team project structure and development guidelines" --tags=team,documentation

# 3. Setup shared tools integration
kb_tool_integration --action=connect --tool=github --parameters='{"repository":"team/project","branch":"main"}'

# 4. Create team workflow templates
... "Standard deployment workflow template created" --tags=team,templates,workflow

# 5. Setup monitoring
/config monitoring enabled --team-analytics=true
```

## 🔧 Advanced Configuration Examples

### Custom NLP Settings
```bash
# Configure semantic search thresholds
/config semanticThreshold 0.4

# Enable advanced NLP features
/config nlp --stemming=true --stopwords=true --expandQueries=true
```

### Performance Optimization
```bash
# Configure auto-save intervals
/config autoSave 3  # Every 3 minutes

# Set memory limits
/config maxMemoryItems 100000

# Enable compression
/config compression --threshold=0.8 --algorithm=lz4
```

### Tool Integration Configuration
```bash
# Configure file watching
/config filesystem --watch=true --patterns="*.ts,*.js,*.json" --excludes="node_modules"

# Setup GitHub integration
/config github --auto-commit=false --track-issues=true

# Desktop Commander settings
/config desktop-commander --timeout=30s --retry=3
```

## 🎯 Pro Tips

### Command Chaining
```bash
# Chain multiple operations
--- +++ "Load context and execute deployment" --tools=all

# Save with immediate search
... "New feature complete" --tags=feature,api && /search "similar features"
```

### Context Optimization
```bash
# Smart context loading
/load --smart --categories=current-project --exclude-archived

# Compressed savings for large context
... "Large system analysis complete" --compress --priority=high
```

### Integration Workflows
```bash
# Multi-tool operations
+++ "Full system check" --tools=desktop-commander,github,filesystem --parallel

# Conditional execution
/execute "Deploy if tests pass" --condition="test-results==success" --tools=github
```

---

**🇬🇪 Practical examples from Georgian developers in Batumi 🌊**

These examples represent real-world usage patterns developed by the Georgian tech community!