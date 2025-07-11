# 🔧 Installation & Setup Guide

## Prerequisites

1. **Claude Desktop** - Download from [claude.ai/desktop](https://claude.ai/desktop)
2. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
3. **Git** - Download from [git-scm.com](https://git-scm.com/)

## Installation Steps

### 1. Clone and Install
```bash
# Clone the repository
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Configure Claude Desktop

#### Find Configuration File
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

#### Add MCP Server Configuration
Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/full/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base"
      }
    }
  }
}
```

**Important:** Replace `/full/path/to/` with the actual path to your cloned repository.

#### Example Full Configuration
```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/Users/username/Projects/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "/Users/username/.claude-knowledge-base"
      }
    },
    "other-mcp-server": {
      "command": "other-server",
      "args": ["--port", "3000"]
    }
  }
}
```

### 3. Restart Claude Desktop

After adding the configuration:
1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. The MCP server will be automatically loaded

### 4. Verify Installation

Open a new chat in Claude Desktop and try:

```
--- Test knowledge base loading
```

You should see a response indicating the knowledge base system is active.

## Configuration Options

### Environment Variables

- **`KB_DATA_DIR`** - Directory for knowledge base storage (default: `~/.claude-knowledge-base`)

### Data Directory Structure

The knowledge base creates the following structure:

```
~/.claude-knowledge-base/
├── infrastructure.json     # Server details, services, credentials
├── projects.json          # Active tasks, priorities, progress  
├── interactions.json      # Important conversations, solutions
├── workflows.json         # Automation, integrations, processes
├── insights.json          # Analysis, documentation, learnings
├── marathon-state.json    # Marathon Mode continuation state
└── sessions/              # Session-specific data
    ├── session-uuid-1.json
    ├── session-uuid-2.json
    └── ...
```

## Troubleshooting

### Common Issues

#### MCP Server Not Loading
1. Check that the path in `claude_desktop_config.json` is correct
2. Ensure Node.js 18+ is installed: `node --version`
3. Verify the build was successful: `ls dist/server.js`
4. Check Claude Desktop logs for error messages

#### Permission Issues
```bash
# Ensure proper permissions
chmod +x dist/server.js

# Create data directory manually if needed
mkdir -p ~/.claude-knowledge-base
```

#### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Debugging

Enable verbose logging by adding to your configuration:

```json
{
  "mcpServers": {
    "claude-knowledge-base": {
      "command": "node",
      "args": ["/path/to/claude-knowledge-base-mcp/dist/server.js"],
      "env": {
        "KB_DATA_DIR": "~/.claude-knowledge-base",
        "DEBUG": "true"
      }
    }
  }
}
```

### Testing MCP Connection

You can test the MCP server directly:

```bash
# Test the server
node dist/server.js

# Should output: "Claude Knowledge Base MCP Server started"
```

## Updates

To update to the latest version:

```bash
cd claude-knowledge-base-mcp
git pull
npm install
npm run build
```

Then restart Claude Desktop.

## Uninstalling

1. Remove the `claude-knowledge-base` entry from `claude_desktop_config.json`
2. Restart Claude Desktop
3. Optionally delete the data directory: `rm -rf ~/.claude-knowledge-base`
4. Delete the cloned repository

## Support

- **Issues:** [GitHub Issues](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/discussions)
- **Documentation:** [Project Wiki](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/wiki)
