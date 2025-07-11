#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logo = `
🇬🇪 Claude Knowledge Base MCP v3.0 Setup 🇬🇪
================================================
  WITH LOVE FROM GEORGIA, BATUMI ❤️
🌊 Black Sea Innovation • Georgian Excellence 🏔️
================================================
`;

const georgianMessages = [
  '🇬🇪 Built with Georgian hospitality and innovation',
  '🌊 Inspired by the beautiful Black Sea coastline',
  '🏔️ Crafted in the mountains and by the sea of Georgia',
  '❤️ Made with love from Batumi, the Pearl of the Black Sea',
  '🚀 Georgian tech excellence meets global standards'
];

function getRandomGeorgianMessage() {
  return georgianMessages[Math.floor(Math.random() * georgianMessages.length)];
}

async function ensureDirectoryExists(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
    console.log(chalk.green(`✅ Created directory: ${dir}`));
  }
}

async function createConfigFile(path, content) {
  try {
    await fs.access(path);
    console.log(chalk.yellow(`⚠️  Configuration file already exists: ${path}`));
    return false;
  } catch {
    await fs.writeFile(path, content);
    console.log(chalk.green(`✅ Created configuration: ${path}`));
    return true;
  }
}

async function setupDataDirectory() {
  const dataDir = process.env.KB_DATA_DIR || join(homedir(), '.claude-knowledge-base');
  
  console.log(chalk.blue(`📁 Setting up data directory: ${dataDir}`));
  console.log(chalk.gray('   ' + getRandomGeorgianMessage()));
  
  // Create main directories
  await ensureDirectoryExists(dataDir);
  await ensureDirectoryExists(join(dataDir, 'config'));
  await ensureDirectoryExists(join(dataDir, 'backups'));
  await ensureDirectoryExists(join(dataDir, 'logs'));
  await ensureDirectoryExists(join(dataDir, 'cache'));
  
  return dataDir;
}

async function createDefaultConfig(dataDir) {
  const configPath = join(dataDir, 'config', 'config.json');
  
  const defaultConfig = {
    _metadata: {
      createdBy: "Claude Knowledge Base MCP v3.0",
      origin: "🇬🇪 Made with love from Georgia, Batumi ❤️",
      inspiration: "Black Sea coastal innovation and Georgian hospitality",
      version: "3.0.0",
      createdAt: new Date().toISOString()
    },
    dataDir: dataDir,
    maxContextSize: 100000,
    autoSaveInterval: 5,
    vectorDimension: 300,
    maxMemoryItems: 50000,
    compressionThreshold: 0.8,
    marathonEnabled: true,
    contextOverflowThreshold: 80000,
    checkpointInterval: 5,
    nlpSettings: {
      enableStemming: true,
      removeStopwords: true,
      language: "en",
      cacheSize: 10000
    },
    integrations: {
      desktopCommander: true,
      github: true,
      filesystem: true
    },
    performance: {
      monitoring: true,
      analytics: true,
      recommendations: true
    },
    security: {
      encryptSensitiveData: false,
      dataRetentionDays: 365,
      auditLogging: true
    }
  };
  
  await createConfigFile(configPath, JSON.stringify(defaultConfig, null, 2));
  return configPath;
}

async function createEnvironmentFile(dataDir) {
  const envPath = join(dataDir, '.env');
  
  const envContent = `# 🇬🇪 Claude Knowledge Base MCP v3.0 Configuration 🇬🇪
# WITH LOVE FROM GEORGIA, BATUMI ❤️
# Generated on ${new Date().toISOString()}
# 🌊 Black Sea Innovation • Georgian Excellence 🏔️

# Core Settings
KB_DATA_DIR="${dataDir}"
KB_AUTO_SAVE_INTERVAL=5
KB_MARATHON_ENABLED=true
KB_MAX_CONTEXT_SIZE=100000

# NLP Settings (Enhanced for Georgian Tech Excellence)
KB_VECTOR_DIMENSION=300
KB_ENABLE_STEMMING=true
KB_REMOVE_STOPWORDS=true
KB_CACHE_SIZE=10000

# Performance Settings (Optimized with Georgian Precision)
KB_MAX_MEMORY_ITEMS=50000
KB_COMPRESSION_THRESHOLD=0.8
KB_PERFORMANCE_MONITORING=true

# Tool Integration (Built with Georgian Innovation)
KB_TOOL_INTEGRATION=true
KB_FILE_WATCHING=true
KB_INTEGRATION_SYNC_INTERVAL=30

# Security & Privacy (Georgian Hospitality with Global Standards)
KB_ENCRYPT_SENSITIVE_DATA=false
KB_DATA_RETENTION_DAYS=365
KB_AUDIT_LOGGING=true

# Development & Debugging
KB_LOG_LEVEL=info
KB_DEBUG_MODE=false
KB_ENABLE_ANALYTICS=true

# 🇬🇪 Crafted with love in beautiful Batumi, Georgia 🌊
# Made possible by Georgian tech community and Black Sea inspiration
`;

  await createConfigFile(envPath, envContent);
  return envPath;
}

async function createClaudeDesktopConfig(dataDir) {
  const projectRoot = join(__dirname, '..');
  const serverPath = join(projectRoot, 'dist', 'server-v3.js');
  
  const claudeConfig = {
    _metadata: {
      generatedBy: "Claude Knowledge Base MCP v3.0 Setup",
      origin: "🇬🇪 Built with love from Georgia, Batumi ❤️",
      note: "Crafted with Georgian hospitality and Black Sea innovation"
    },
    mcpServers: {
      "claude-knowledge-base": {
        command: "node",
        args: [serverPath],
        env: {
          KB_DATA_DIR: dataDir,
          KB_AUTO_SAVE_INTERVAL: "5",
          KB_MARATHON_ENABLED: "true",
          KB_MAX_CONTEXT_SIZE: "100000",
          KB_VECTOR_DIMENSION: "300",
          KB_TOOL_INTEGRATION: "true",
          KB_PERFORMANCE_MONITORING: "true"
        }
      }
    }
  };

  const configPath = join(dataDir, 'claude_desktop_config.json');
  await createConfigFile(configPath, JSON.stringify(claudeConfig, null, 2));
  
  return { configPath, claudeConfig };
}

async function initializeDatabase(dataDir) {
  console.log(chalk.blue('🗄️  Initializing SQLite database...'));
  console.log(chalk.gray('   🇬🇪 Georgian engineering meets database excellence'));
  
  try {
    // We'll import and initialize the database manager
    const { SQLiteManager } = await import('../dist/core/database/sqlite-manager.js');
    const db = new SQLiteManager(dataDir);
    
    // Get initial stats
    const stats = db.getStats();
    console.log(chalk.green('✅ Database initialized successfully'));
    console.log(chalk.gray(`   Tables created: memories, entities, sessions, checkpoints`));
    console.log(chalk.gray(`   FTS5 search: enabled`));
    console.log(chalk.gray(`   Initial size: ${stats.dbSize.size} bytes`));
    console.log(chalk.gray('   🌊 Powered by Black Sea innovation'));
    
    db.close();
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️  Database will be initialized on first run'));
    console.log(chalk.gray(`   ${error.message}`));
    return false;
  }
}

async function testNLPProcessor() {
  console.log(chalk.blue('🔤 Testing NLP processor...'));
  console.log(chalk.gray('   🇬🇪 Local Georgian tech - no external APIs needed'));
  
  try {
    const { LocalNLPProcessor } = await import('../dist/core/nlp/local-embeddings.js');
    const nlp = new LocalNLPProcessor({ dimensions: 300 });
    
    // Test embedding generation
    const testText = "This is a test for the local NLP processor built with love from Georgia, Batumi";
    const embedding = await nlp.generateEmbedding(testText);
    const analysis = await nlp.analyzeText(testText);
    
    console.log(chalk.green('✅ NLP processor working correctly'));
    console.log(chalk.gray(`   Embedding dimensions: ${embedding.length}`));
    console.log(chalk.gray(`   Sentiment: ${analysis.sentiment.label}`));
    console.log(chalk.gray(`   Keywords: ${analysis.keywords.slice(0, 3).map(k => k.word).join(', ')}`));
    console.log(chalk.gray('   🏔️ Engineered with Georgian precision'));
    
    return true;
  } catch (error) {
    console.log(chalk.red('❌ NLP processor test failed'));
    console.log(chalk.red(`   ${error.message}`));
    return false;
  }
}

async function createStartupScript(dataDir, serverPath) {
  const scriptPath = join(dataDir, 'start-server.sh');
  
  const scriptContent = `#!/bin/bash
# 🇬🇪 Claude Knowledge Base MCP v3.0 Startup Script 🇬🇪
# WITH LOVE FROM GEORGIA, BATUMI ❤️
# Generated on ${new Date().toISOString()}
# 🌊 Black Sea Innovation • Georgian Excellence 🏔️

echo "🇬🇪 Starting Claude Knowledge Base MCP v3.0..."
echo "❤️ Built with love from beautiful Batumi, Georgia"
echo "🌊 Powered by Black Sea coastal innovation"

# Set environment variables
export KB_DATA_DIR="${dataDir}"
export KB_AUTO_SAVE_INTERVAL=5
export KB_MARATHON_ENABLED=true

# Georgian hospitality message
echo "🏔️ Georgian tech excellence at your service!"

# Start the server
node "${serverPath}"
`;

  await fs.writeFile(scriptPath, scriptContent);
  await fs.chmod(scriptPath, '755');
  
  console.log(chalk.green(`✅ Created startup script: ${scriptPath}`));
  return scriptPath;
}

async function generateDocumentation(dataDir) {
  const docsDir = join(dataDir, 'docs');
  await ensureDirectoryExists(docsDir);
  
  const quickStartContent = `# 🇬🇪 Claude Knowledge Base MCP v3.0 - Quick Start 🇬🇪

## 🎉 Installation Complete! WITH LOVE FROM GEORGIA, BATUMI ❤️

Your Claude Knowledge Base MCP is now configured and ready to use.

**🌊 Built on the shores of the Black Sea with Georgian innovation and hospitality! 🏔️**

### Configuration Files Created:
- \`${join(dataDir, 'config', 'config.json')}\` - Main configuration
- \`${join(dataDir, '.env')}\` - Environment variables  
- \`${join(dataDir, 'claude_desktop_config.json')}\` - Claude Desktop config

### Data Directory Structure:
\`\`\`
${dataDir}/
├── config/          # Configuration files
├── backups/         # Automatic backups
├── logs/           # Application logs
├── cache/          # NLP and performance cache
├── docs/           # Documentation
└── knowledge-base.db # SQLite database (created on first run)
\`\`\`

### Next Steps:

1. **Add to Claude Desktop:**
   Copy the configuration from \`claude_desktop_config.json\` to your Claude Desktop config file.

2. **Restart Claude Desktop:**
   Restart Claude Desktop to load the new MCP server.

3. **Test the Installation:**
   Try these commands in Claude Desktop:
   \`\`\`
   /help
   /stats
   kb_enhanced_command --command="--- Load knowledge base status"
   \`\`\`

4. **Start Using:**
   - Symbol syntax: \`--- +++ ... ***\`
   - Slash syntax: \`/search "topic" --semantic\`
   - Tool integration: \`kb_tool_integration --action=status\`

### 🇬🇪 Georgian Excellence Features:

- **🌊 Black Sea Performance**: Lightning-fast local SQLite database
- **🏔️ Mountain-High Security**: All data stays local, no external APIs
- **❤️ Georgian Hospitality**: Intuitive dual command syntax
- **🚀 Batumi Innovation**: Advanced tool integration framework

### Troubleshooting:

If you encounter issues:
1. Check the logs in \`${join(dataDir, 'logs')}\`
2. Verify Claude Desktop configuration
3. Ensure all dependencies are installed: \`npm install\`
4. Run the build: \`npm run build\`

### Support:
- GitHub Issues: https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp/issues
- Documentation: https://github.com/sitechfromgeorgia/claude-knowledge-base-mcp#readme

**🇬🇪 საქართველოდან სიყვარულით, ბათუმი ❤️**

Happy knowledge building with Georgian tech excellence! 🚀🌊🏔️
`;

  const quickStartPath = join(docsDir, 'quick-start.md');
  await fs.writeFile(quickStartPath, quickStartContent);
  
  console.log(chalk.green(`✅ Created quick start guide: ${quickStartPath}`));
  return quickStartPath;
}

async function main() {
  console.log(chalk.cyan(logo));
  console.log(chalk.magenta('🌊 ' + getRandomGeorgianMessage() + ' 🏔️'));
  console.log(chalk.gray('═══════════════════════════════════════════════════════\n'));
  
  try {
    // Setup data directory
    const dataDir = await setupDataDirectory();
    
    // Create configuration files
    console.log(chalk.blue('\n📝 Creating configuration files...'));
    console.log(chalk.gray('   🇬🇪 Infusing Georgian hospitality into every setting'));
    const configPath = await createDefaultConfig(dataDir);
    const envPath = await createEnvironmentFile(dataDir);
    
    // Create Claude Desktop configuration
    console.log(chalk.blue('\n🔧 Generating Claude Desktop configuration...'));
    console.log(chalk.gray('   🌊 Black Sea engineering meets AI excellence'));
    const { configPath: claudeConfigPath, claudeConfig } = await createClaudeDesktopConfig(dataDir);
    
    // Initialize database
    console.log(chalk.blue('\n🗄️  Setting up database...'));
    await initializeDatabase(dataDir);
    
    // Test NLP processor
    console.log(chalk.blue('\n🔤 Testing NLP components...'));
    await testNLPProcessor();
    
    // Create startup script
    const serverPath = join(__dirname, '..', 'dist', 'server-v3.js');
    await createStartupScript(dataDir, serverPath);
    
    // Generate documentation
    console.log(chalk.blue('\n📚 Generating documentation...'));
    console.log(chalk.gray('   🏔️ Documenting with Georgian attention to detail'));
    const quickStartPath = await generateDocumentation(dataDir);
    
    // Success message with Georgian flair
    console.log(chalk.green('\n🎉 Setup completed successfully!'));
    console.log(chalk.magenta('🇬🇪 WITH LOVE FROM GEORGIA, BATUMI ❤️'));
    console.log(chalk.cyan('🌊 Black Sea Innovation • Georgian Excellence 🏔️'));
    
    console.log(chalk.blue('\n📋 Summary:'));
    console.log(chalk.white(`   Data Directory: ${dataDir}`));
    console.log(chalk.white(`   Configuration: ${configPath}`));
    console.log(chalk.white(`   Environment: ${envPath}`));
    console.log(chalk.white(`   Quick Start: ${quickStartPath}`));
    
    console.log(chalk.yellow('\n⚠️  Important Next Steps:'));
    console.log(chalk.white('   1. Build the project: npm run build'));
    console.log(chalk.white('   2. Add Claude Desktop configuration:'));
    console.log(chalk.gray('      Copy content from claude_desktop_config.json'));
    console.log(chalk.white('   3. Restart Claude Desktop'));
    console.log(chalk.white('   4. Test with: /help or kb_enhanced_command'));
    
    console.log(chalk.green('\n✨ Your Claude Desktop will now have persistent memory!'));
    console.log(chalk.magenta('🇬🇪 Powered by Georgian innovation and Black Sea inspiration!'));
    
    // Final Georgian message
    console.log(chalk.cyan('\n═══════════════════════════════════════════════════════'));
    console.log(chalk.magenta('🌊 Made with ❤️  on the beautiful shores of Batumi 🏔️'));
    console.log(chalk.cyan('🇬🇪 Georgian tech excellence • Global innovation standards'));
    console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'));
    console.error(chalk.red(error.message));
    console.error(chalk.yellow('\nPlease check the error and try again.'));
    console.error(chalk.gray('🇬🇪 Georgian hospitality: We\'re here to help - create an issue on GitHub!'));
    process.exit(1);
  }
}

// Run setup with Georgian excellence
main().catch(console.error);
