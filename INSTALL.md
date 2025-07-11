# 🏃‍♂️ Marathon MCP Tool v1.0.1 - Installation Guide

**🇬🇪 WITH LOVE FROM GEORGIA, BATUMI ❤️**

**Complete installation guide for the most powerful AI Project Orchestrator**

---

## 🚀 Quick Installation (5 Minutes)

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher  
- **Claude Desktop** (latest version)
- **Git** for cloning the repository

### 1. Clone and Setup

```bash
# Clone the Marathon MCP Tool
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Install dependencies
npm install

# Run auto-discovery and configuration
npm run discover:mcps
npm run marathon:init

# Build the enhanced system
npm run build
```

### 2. Claude Desktop Configuration

**Basic Setup:**
```json
{
  "mcpServers": {
    "marathon-mcp-tool": {
      "command": "node",
      "args": ["path/to/claude-knowledge-base-mcp/dist/marathon-server-v1.js"],
      "env": {
        "MARATHON_MODE": "foundation",
        "AUTO_DISCOVERY": "true"
      }
    }
  }
}
```

**Enhanced Setup (Recommended):**
```json
{
  "mcpServers": {
    "marathon-mcp-tool": {
      "command": "node",
      "args": ["path/to/claude-knowledge-base-mcp/dist/marathon-server-v1.js"],
      "env": {
        "MARATHON_MODE": "foundation",
        "AUTO_DISCOVERY": "true",
        "SECURITY_LEVEL": "standard",
        "GEORGIAN_EXCELLENCE": "true",
        "CONTEXT_MANAGEMENT": "smart",
        "USER_EXPERIENCE": "guided",
        "INTEGRATION_SYNC": "true",
        "PERFORMANCE_MONITORING": "true",
        "KB_DATA_DIR": "~/.marathon-mcp",
        "KB_AUTO_SAVE_INTERVAL": "5",
        "KB_MARATHON_ENABLED": "true"
      }
    }
  }
}
```

### 3. First Run Verification

```bash
# Test the installation
npm run doctor

# Check MCP discovery
npm run discover:mcps --verbose

# Start your first Marathon session
# Open Claude Desktop and try:
+++ Test Marathon MCP Tool installation and setup
```

---

## 🔧 Advanced Installation Options

### Enterprise Installation

```bash
# Clone with enterprise features
git clone --branch enterprise https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Enterprise setup with advanced security
npm run setup:enterprise

# Configure advanced analytics
npm run analytics:setup

# Setup monitoring dashboard
npm run monitor:setup
```

### Docker Installation (Recommended for Production)

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
```

```bash
# Build and run with Docker
docker build -t marathon-mcp-tool .
docker run -d \
  --name marathon-mcp \
  -v ~/.marathon-mcp:/app/data \
  -p 8080:8080 \
  marathon-mcp-tool
```

### Cross-Platform Installation

**Windows:**
```powershell
# Install via PowerShell
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Windows-specific setup
npm run install-cross-platform -- --platform=windows
npm run setup:windows

# Configure for WSL2 (optional but recommended)
npm run setup:wsl2
```

**Linux:**
```bash
# Ubuntu/Debian installation
curl -fsSL https://raw.githubusercontent.com/sitechfromgeorgia/claude-knowledge-base-mcp/main/scripts/install-linux.sh | bash

# Manual installation
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm run install-cross-platform -- --platform=linux
```

**macOS:**
```bash
# Homebrew installation (coming soon)
# brew install sitechfromgeorgia/tap/marathon-mcp-tool

# Manual installation
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm run install-cross-platform -- --platform=macos
```

---

## 🧠 MCP Discovery & Integration

### Automatic MCP Discovery

Marathon MCP Tool automatically discovers and integrates with your existing MCPs:

```bash
# Run discovery scan
npm run discover:mcps

# View discovered MCPs
npm run discover:mcps -- --list

# Optimize MCP integration
npm run discover:mcps -- --optimize
```

**Discovered MCPs (Example Output):**
```
🔍 MCP Discovery Results:

✅ Core Systems:
  - claude-knowledge-base (persistent memory)
  - memory (knowledge graph)
  - sequential-thinking (AI reasoning)

✅ Development Tools:
  - github (version control)
  - filesystem (file operations)
  - desktop-commander (system control)

✅ Server Management:
  - acura-server (production infrastructure)
  - econom-server (business platform)

✅ External Integrations:
  - context7-ai (advanced AI)
  - chrome-puppeteer (web automation)

🎯 Optimization Strategy Generated:
  - Server tasks: acura-server + desktop-commander
  - Development: github + filesystem + desktop-commander
  - AI enhancement: context7-ai + sequential-thinking
```

### Manual MCP Integration

```bash
# Add specific MCP integration
npm run mcp:add -- --name=custom-mcp --type=development

# Configure MCP settings
npm run mcp:configure -- --name=github --settings='{"auto_commit": true}'

# Test MCP integration
npm run mcp:test -- --name=all
```

---

## ⚙️ Configuration Options

### Basic Configuration

Create `~/.marathon-mcp/config.json`:
```json
{
  "marathon": {
    "version": "1.0.1",
    "mode": "foundation",
    "auto_discovery": true
  },
  "security": {
    "audit_logging": true,
    "command_validation": true,
    "directory_restrictions": true
  },
  "user_experience": {
    "mode": "guided",
    "confirmations": "smart",
    "explanations": "contextual"
  }
}
```

### Advanced Configuration

```json
{
  "marathon": {
    "version": "1.0.1",
    "mode": "enhanced",
    "auto_discovery": true,
    "context_management": {
      "overflow_threshold": 80000,
      "auto_transfer": true,
      "compression_enabled": true
    },
    "project_orchestration": {
      "ai_planning": true,
      "parallel_execution": true,
      "dependency_management": true
    }
  },
  "security": {
    "audit_logging": true,
    "command_validation": true,
    "directory_restrictions": true,
    "encryption": {
      "sensitive_data": true,
      "state_serialization": true
    },
    "access_control": {
      "role_based": true,
      "permission_enforcement": true
    }
  },
  "integrations": {
    "filesystem_enhanced": true,
    "desktop_commander_enhanced": true,
    "server_management": true,
    "real_time_monitoring": true,
    "mcp_auto_sync": true
  },
  "analytics": {
    "performance_tracking": true,
    "usage_analytics": true,
    "optimization_suggestions": true,
    "predictive_analysis": true
  },
  "user_experience": {
    "mode": "adaptive",
    "confirmations": "smart",
    "explanations": "contextual",
    "error_handling": "guided",
    "learning_enabled": true
  }
}
```

---

## 🛡️ Security Setup

### Basic Security Configuration

```bash
# Setup basic security
npm run security:setup

# Generate encryption keys
npm run security:generate-keys

# Configure audit logging
npm run security:audit-setup
```

### Enterprise Security

```bash
# Enterprise security setup
npm run security:enterprise-setup

# Configure role-based access
npm run security:rbac-setup

# Setup compliance monitoring
npm run security:compliance-setup

# Generate security report
npm run security:audit-report
```

### Security Environment Variables

```bash
# Add to your .env file
MARATHON_SECURITY_LEVEL=enterprise
MARATHON_ENCRYPTION_ENABLED=true
MARATHON_AUDIT_LOGGING=comprehensive
MARATHON_ACCESS_CONTROL=strict
MARATHON_COMPLIANCE_MODE=enabled
```

---

## 📊 Monitoring & Analytics Setup

### Basic Monitoring

```bash
# Setup basic monitoring
npm run monitor:setup

# Start monitoring dashboard
npm run monitor:start

# View real-time analytics
npm run analytics:live
```

### Advanced Analytics

```bash
# Setup comprehensive analytics
npm run analytics:setup -- --level=comprehensive

# Configure performance tracking
npm run analytics:performance-setup

# Setup predictive analytics
npm run analytics:predictive-setup
```

### Monitoring Dashboard

Access the monitoring dashboard at: `http://localhost:3000/marathon-dashboard`

Features:
- Real-time project progress
- MCP performance metrics
- Resource utilization graphs
- Error tracking and alerts
- Success rate analytics

---

## 🔧 Troubleshooting Installation

### Common Issues & Solutions

**Issue: Node.js version compatibility**
```bash
# Check Node.js version
node --version

# Install Node.js 18+ if needed
npm install -g n
n 18

# Verify installation
npm run doctor
```

**Issue: Permission errors on Linux/macOS**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Alternative: use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Issue: Claude Desktop configuration**
```bash
# Find Claude Desktop config location
# Windows: %APPDATA%\Claude\claude_desktop_config.json
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json

# Validate configuration
npm run validate:claude-config
```

**Issue: MCP discovery fails**
```bash
# Debug MCP discovery
npm run discover:mcps -- --debug

# Reset MCP configuration
npm run mcp:reset

# Manual MCP verification
npm run mcp:verify-all
```

### Diagnostic Tools

```bash
# Comprehensive system check
npm run doctor -- --comprehensive

# Performance diagnostics
npm run diagnostics:performance

# Security audit
npm run diagnostics:security

# Integration test
npm run diagnostics:integration
```

---

## 🔄 Migration from Previous Versions

### From v3.0.1 to v1.0.1

```bash
# Automatic migration
npm run migrate:from-v3

# Verify migration
npm run migrate:verify

# Backup before migration (recommended)
npm run backup:create -- --name="pre-v1.0.1-migration"
```

### Manual Migration Steps

1. **Backup existing data**
   ```bash
   cp -r ~/.claude-knowledge-base ~/.claude-knowledge-base-backup
   ```

2. **Install Marathon MCP Tool**
   ```bash
   git pull origin main
   npm install
   npm run build
   ```

3. **Run migration script**
   ```bash
   npm run migrate:v3-to-v1
   ```

4. **Verify data integrity**
   ```bash
   npm run verify:migration
   ```

5. **Update Claude Desktop config**
   - Update server path to `marathon-server-v1.js`
   - Add new environment variables
   - Test connection

---

## 🎯 Post-Installation Setup

### Initial Configuration

```bash
# Run initial setup wizard
npm run setup:wizard

# Configure user preferences
npm run config:user-preferences

# Setup project templates
npm run templates:setup

# Configure backup strategy
npm run backup:configure
```

### Performance Optimization

```bash
# Optimize system for your hardware
npm run optimize:system

# Configure cache settings
npm run cache:optimize

# Setup performance monitoring
npm run performance:setup
```

### Testing Installation

```bash
# Run comprehensive tests
npm test

# Test MCP integrations
npm run test:integration

# Performance benchmarks
npm run test:performance

# Security validation
npm run test:security
```

---

## 📚 Learning Resources

### Quick Start Tutorial

```bash
# Interactive tutorial
npm run tutorial:start

# Basic commands tutorial
npm run tutorial:commands

# MCP integration tutorial
npm run tutorial:mcps

# Advanced features tutorial
npm run tutorial:advanced
```

### Documentation

- **User Guide**: `docs/user-guide.md`
- **API Reference**: `docs/api-reference.md`
- **MCP Integration Guide**: `docs/mcp-integration.md`
- **Troubleshooting**: `docs/troubleshooting.md`
- **Security Guide**: `docs/security.md`

### Community Resources

- **GitHub Discussions**: [Community Forum](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/discussions)
- **Issues & Support**: [GitHub Issues](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues)
- **Georgian Community**: Join our Georgian developer community! 🇬🇪
- **Video Tutorials**: Coming soon on our YouTube channel

---

## 🎉 Verification & First Steps

### Verify Installation Success

```bash
# Comprehensive installation check
npm run verify:installation

# Test all features
npm run verify:features

# Performance baseline
npm run verify:performance
```

**Expected Output:**
```
✅ Marathon MCP Tool v1.0.1 Installation Verification

🏃‍♂️ Core System:
  ✅ Database initialized
  ✅ NLP engine ready
  ✅ Security configured
  ✅ Analytics enabled

🔌 MCP Integrations:
  ✅ 8 MCPs discovered
  ✅ Auto-orchestration enabled
  ✅ Context management ready
  ✅ State preservation active

🛡️ Security:
  ✅ Audit logging active
  ✅ Command validation enabled
  ✅ Encryption configured
  ✅ Access control ready

📊 Monitoring:
  ✅ Performance tracking active
  ✅ Analytics dashboard ready
  ✅ Real-time monitoring enabled
  ✅ Optimization suggestions active

🇬🇪 Georgian Excellence: ACTIVATED! ❤️

🎯 Ready for your first Marathon project!
```

### Your First Marathon Project

Open Claude Desktop and try:

```bash
# Simple test
+++ Test my Marathon MCP Tool setup

# Real project example
+++ Setup development environment for my React application with:
- Local database
- Git integration
- Automated testing
- Code quality tools
- Development server
```

### What to Expect

1. **Intelligent Analysis**: Marathon analyzes your project requirements
2. **Smart Planning**: AI creates optimal execution strategy
3. **MCP Orchestration**: Automatically coordinates all necessary tools
4. **Real-time Progress**: Live updates and progress tracking
5. **Context Preservation**: Never lose progress across sessions
6. **Success Metrics**: Performance analytics and optimization suggestions

---

## 🏆 Success Metrics

After successful installation, you should achieve:

- **Setup Time**: <5 minutes total installation
- **First Project**: <30 seconds to start
- **MCP Discovery**: 100% of installed MCPs detected
- **Performance**: >50% productivity improvement
- **Reliability**: >99% uptime and stability

---

## 🆘 Getting Help

### Support Channels

1. **Documentation**: Check `docs/` directory for comprehensive guides
2. **GitHub Issues**: Report bugs and request features
3. **Community Forum**: Ask questions and share experiences
4. **Georgian Support**: We provide special support for Georgian developers! 🇬🇪

### Emergency Support

```bash
# Generate diagnostic report
npm run diagnostics:emergency

# Create support package
npm run support:package

# Reset to safe state
npm run emergency:reset
```

---

## 🇬🇪 **მადლობა from Beautiful Batumi!**

Thank you for choosing Marathon MCP Tool! Built with love from the shores of the Black Sea, this tool represents Georgian innovation at its finest.

**🌊 From Batumi with Love ❤️**
**🏔️ Georgian Mountain Endurance**  
**🚀 Black Sea Innovation**

---

**🏃‍♂️ Ready to start your Marathon? Your AI project orchestration journey begins now!**

```bash
# Let's begin!
npm run marathon:init
```

**Welcome to the future of AI-powered project management!** 🚀✨
