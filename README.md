# 🧠 Claude Knowledge Base MCP

**Advanced Knowledge Management System for Claude Desktop**

A sophisticated MCP (Model Context Protocol) server that provides persistent memory, cross-session continuity, and Marathon Mode for complex tasks. Perfect for infrastructure management, development projects, and long-running deployments.

## ✨ Features

### 🎯 **Advanced Command Syntax**
- **`---`** = Load Knowledge Base (context loading)
- **`+++`** = Complex Task Execution (comprehensive workflow)  
- **`...`** = Update Knowledge Base (save results)
- **`***`** = Marathon Mode (save & switch for performance)

### 🔄 **Marathon Mode**
Perfect for complex deployments and long-running tasks:
- **Save & Switch**: `*** +++` saves progress and switches to fresh session
- **Seamless Continuation**: Resume exactly where you left off
- **Context Management**: Prevents context window overflow
- **Performance Optimization**: Fresh sessions for complex work

### 📊 **Persistent Memory**
- **Cross-Session Continuity**: Never lose progress between chats
- **Project Tracking**: Infrastructure, tasks, interactions
- **Automatic Updates**: Progress saved continuously
- **Smart Context**: Relevant information always available

### 🚀 **Use Cases**
- **Infrastructure Deployments**: Supabase, Docker, Kubernetes setups
- **Complex Configurations**: Multi-service integrations  
- **Development Projects**: Long-term coding tasks
- **System Administration**: Server management workflows
- **Learning & Research**: Knowledge accumulation over time

## 🔧 Installation

### Prerequisites
- [Claude Desktop](https://claude.ai/desktop)
- [Node.js](https://nodejs.org/) 18+ 
- [Git](https://git-scm.com/)

### Quick Install
```bash
# Clone the repository
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp

# Install dependencies
npm install

# Build the server
npm run build

# Add to Claude Desktop configuration
```

### Claude Desktop Configuration
Add to your `claude_desktop_config.json`:

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

## 🎯 Usage

### Basic Commands

#### Load Context
```
--- What's the current status of my infrastructure?
```
Loads all relevant knowledge and provides context-aware response.

#### Complex Task Execution
```
+++ Deploy complete production Supabase stack with monitoring
```
Executes complex tasks with sequential thinking and all available tools.

#### Update Knowledge Base
```
...
```
Saves current session progress and updates knowledge base.

### Marathon Mode (Perfect for Complex Deployments)

#### Save & Switch
```
*** +++
```
When context window gets full or you need fresh performance:
- Saves all current progress
- Provides instructions for new chat
- Optimizes for long-running tasks

#### Continue in New Chat
```
--- +++ ... *** Continue Supabase deployment from previous session
```
Seamlessly resumes work with full context and state.

### Combined Workflows

#### Complete Workflow
```
--- +++ ... Deploy enterprise infrastructure with full monitoring
```
Loads context + Executes + Saves results in one command.

#### Marathon Complete Workflow  
```
--- +++ ... *** Set up production environment from scratch
```
Full workflow with Marathon Mode for complex, long-running tasks.

## 🏗️ Architecture

### Knowledge Base Structure
```
~/.claude-knowledge-base/
├── infrastructure.json     # Server details, services, credentials
├── projects.json          # Active tasks, priorities, progress  
├── interactions.json      # Important conversations, solutions
├── workflows.json         # Automation, integrations, processes
├── insights.json          # Analysis, documentation, learnings
└── sessions/              # Session-specific data
    ├── session-1.json
    ├── session-2.json
    └── ...
```

### MCP Server Functions
- **`kb_load`**: Load knowledge base context
- **`kb_execute`**: Complex task execution with tools
- **`kb_update`**: Update knowledge base with results
- **`kb_marathon`**: Marathon mode management
- **`kb_query`**: Search and retrieve specific information
- **`kb_analyze`**: Analyze patterns and generate insights

## 🤝 Integration

Works seamlessly with other MCP servers:
- **Docker Management**: Container orchestration
- **GitHub Integration**: Code and repository management  
- **Cloud Services**: AWS, Azure, GCP operations
- **Monitoring Tools**: Infrastructure health checks
- **Database Operations**: Backup, optimization, queries

## 📖 Examples

### Infrastructure Deployment
```bash
# Start complex deployment
--- +++ ... *** Deploy complete Supabase production stack

# When context gets full
*** +++

# Continue in new chat  
--- +++ ... *** Continue Supabase deployment from previous session
```

### Project Management
```bash
# Load current project status
--- What are my current priorities?

# Update progress
... Completed database migration, starting API integration

# Complex multi-step task
+++ Set up CI/CD pipeline with monitoring and alerting
```

### Learning & Research
```bash
# Research new technology
+++ Research Kubernetes best practices for production deployment

# Save findings
... Documented security considerations and scaling strategies

# Continue research later
--- +++ ... *** Deep dive into Kubernetes networking from previous research
```

## 🚀 Advanced Features

### Smart Context Loading
Automatically determines relevant context based on:
- Current conversation topic
- Recent project activity  
- Infrastructure status
- Active tasks and priorities

### Progress Tracking
- Automatic milestone detection
- Success/failure analysis
- Performance metrics
- Resource usage tracking

### Cross-Session Intelligence
- Maintains conversation continuity
- Preserves decision context
- Tracks problem resolution patterns
- Builds cumulative expertise

## 🛠️ Development

### Building from Source
```bash
git clone https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp.git
cd claude-knowledge-base-mcp
npm install
npm run dev
```

### Testing
```bash
npm test
npm run test:integration
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/discussions)
- **Documentation**: [Wiki](https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/wiki)

## 🎉 Why Claude Knowledge Base MCP?

**Traditional Approach Problems:**
- ❌ Lose context between sessions
- ❌ Repeat explanations constantly  
- ❌ No memory of previous work
- ❌ Context window limitations
- ❌ Manual progress tracking

**With Claude Knowledge Base MCP:**
- ✅ Persistent memory across all sessions
- ✅ Automatic context loading
- ✅ Marathon Mode for complex tasks
- ✅ Professional workflow management
- ✅ Seamless tool integration

Transform your Claude Desktop experience from forgetful assistant to persistent AI partner that remembers everything and grows smarter with every interaction.

---

**Created by:** [Acura Group](https://github.com/sitechfromgeorgia)  
**For:** Advanced AI-assisted development and infrastructure management  
**Status:** Production Ready 🚀
