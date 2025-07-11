# 🚀 Easy Installation Guide - Claude Knowledge Base MCP v3.0

## 🎯 Quick Installation

### Option 1: One-Line Install (Recommended)
```bash
# Automatic installation and setup
npx claude-knowledge-base-setup
```

### Option 2: Manual Installation
```bash
# 1. Clone repository
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# 2. Install dependencies
npm install

# 3. Build project  
npm run build

# 4. Auto-configure Claude Desktop
npm run setup
```

### Option 3: Pre-built Binaries
Download platform-specific binaries from [Releases](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/releases):
- Windows: `claude-kb-win.exe`
- macOS: `claude-kb-darwin`
- Linux: `claude-kb-linux`

## 🔧 Platform-Specific Instructions

### Windows
```powershell
# Option A: Using winget (recommended)
winget install sitechfromgeorgia.claude-knowledge-base-mcp

# Option B: Manual installation
# 1. Install Node.js 18+ from nodejs.org
# 2. Run PowerShell as Administrator
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm install --production
npm run build
npm run setup
```

### macOS
```bash
# Option A: Using Homebrew (recommended)
brew tap sitechfromgeorgia/tools
brew install claude-knowledge-base-mcp

# Option B: Manual installation
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm install
npm run build
npm run setup
```

### Linux
```bash
# Option A: Using snap
snap install claude-knowledge-base-mcp

# Option B: Manual installation
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm install
npm run build
npm run setup
```

## ⚡ Claude Desktop Configuration

The installer automatically configures Claude Desktop, but you can also do it manually:

### Automatic Configuration
```bash
# Run the auto-configurator
npm run setup
# OR
npx claude-kb-config
```

### Manual Configuration
Add to your `claude_desktop_config.json`:

**Location**:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Basic Configuration**:
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["C:/path/to/claude-knowledge-base-mcp/dist/server-v3.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base"
      }
    }
  }
}
```

## 🛠️ Troubleshooting Installation

### Common Issues

**1. Node.js Version**
```bash
# Check Node.js version (requires 18+)
node --version

# Update Node.js if needed
# Windows: Download from nodejs.org
# macOS: brew install node  
# Linux: Follow distro-specific instructions
```

**2. Dependencies Issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. Build Failures**
```bash
# Install build tools
# Windows: npm install -g windows-build-tools
# macOS: xcode-select --install
# Linux: sudo apt install build-essential (Ubuntu/Debian)

# Rebuild native modules
npm rebuild
```

**4. Permissions Issues**
```bash
# Linux/macOS: Fix permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Windows: Run as Administrator
```

### Verification Steps
```bash
# 1. Test installation
npm run test

# 2. Check system status
claude-kb --status

# 3. Verify Claude Desktop integration
# Open Claude Desktop and try: "Test knowledge base connection"
```

## 🔍 Health Check

After installation, run the health check:
```bash
# Comprehensive system check
npm run doctor

# Quick status check
claude-kb --health
```

**Expected Output**:
```
✅ Node.js version: 20.x.x
✅ Dependencies: All installed
✅ Database: Connected
✅ Claude Desktop: Configured
✅ NLP Engine: Ready
✅ Tools Integration: Active
```

## 🚀 First Use

### Quick Test
```bash
# In Claude Desktop, try these commands:
--- "Load any previous context"
/search "test" 
... "Installation successful!"
/stats
```

### Complete Setup
```bash
# 1. Initialize knowledge base
--- "Initialize my personal knowledge base"

# 2. Configure preferences
/config autoSave 5
/config maxMemoryItems 50000

# 3. Enable integrations
kb_tool_integration --action=connect --tool=all

# 4. Test marathon mode
*** "Test marathon mode setup"
```

## 📊 Performance Optimization

### Recommended Settings
```bash
# Configure for your system
/config maxMemoryItems 50000      # Adjust based on RAM
/config compressionThreshold 0.8  # Enable compression
/config autoSave 5                # Auto-save every 5 minutes
```

### Database Optimization
```bash
# Initial database optimization
npm run vacuum
npm run migrate
```

## 🔄 Updating

### Automatic Updates
```bash
# Check for updates
claude-kb --update-check

# Update to latest version
claude-kb --update
```

### Manual Updates
```bash
# Pull latest changes
git pull origin main
npm install
npm run build
npm run migrate  # Run database migrations
```

## 📞 Support

### Getting Help
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/discussions)

### Diagnostic Information
If you need support, please include:
```bash
# Generate diagnostic report
claude-kb --diagnostics > diagnostic-report.txt
```

---

**🇬🇪 Easy installation guide from Batumi, Georgia 🌊**

**Made simple for developers worldwide! 🚀**