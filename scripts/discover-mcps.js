#!/usr/bin/env node

/**
 * 🏃‍♂️ Marathon MCP Tool - MCP Discovery Script
 * 🇬🇪 Built with Georgian Excellence in Batumi
 * 
 * Automatically discovers and optimizes all installed MCPs
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';

class MCPDiscoveryEngine {
  constructor() {
    this.discoveredMCPs = new Map();
    this.optimizationStrategies = new Map();
    this.configPath = this.findClaudeConfigPath();
  }

  findClaudeConfigPath() {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    const configPaths = {
      'win32': path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
      'darwin': path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      'linux': path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json')
    };
    
    return configPaths[platform] || configPaths['linux'];
  }

  async discoverMCPs() {
    const spinner = ora('🔍 Discovering installed MCPs...').start();
    
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      if (!config.mcpServers) {
        spinner.warn('No MCP servers found in Claude configuration');
        return;
      }

      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        await this.analyzeMCP(name, serverConfig);
      }

      spinner.succeed(`🎯 Discovered ${this.discoveredMCPs.size} MCPs`);
      this.displayDiscoveryResults();
      
    } catch (error) {
      spinner.fail(`Failed to discover MCPs: ${error.message}`);
    }
  }

  async analyzeMCP(name, config) {
    const mcpProfile = {
      name,
      type: this.categorizeByName(name),
      capabilities: this.inferCapabilities(name, config),
      priority: this.calculatePriority(name),
      integrationScore: this.calculateIntegrationScore(name),
      config
    };

    this.discoveredMCPs.set(name, mcpProfile);
    this.generateOptimizationStrategy(mcpProfile);
  }

  categorizeByName(name) {
    const categories = {
      'core': ['claude-knowledge-base', 'memory', 'sequential-thinking'],
      'server': ['acura-server', 'econom-server', 'chrome-puppeteer'],
      'development': ['github', 'filesystem', 'desktop-commander'],
      'business': ['erpnext', 'n8n', 'gmail'],
      'external': ['context7-ai', 'ottomator']
    };

    for (const [category, mcps] of Object.entries(categories)) {
      if (mcps.some(mcp => name.includes(mcp))) {
        return category;
      }
    }
    return 'custom';
  }

  inferCapabilities(name, config) {
    const capabilities = [];
    
    // Common capability patterns
    if (name.includes('server')) capabilities.push('infrastructure', 'monitoring');
    if (name.includes('github')) capabilities.push('version-control', 'collaboration');
    if (name.includes('filesystem')) capabilities.push('file-operations', 'storage');
    if (name.includes('desktop')) capabilities.push('system-control', 'automation');
    if (name.includes('database') || name.includes('sql')) capabilities.push('data-management');
    if (name.includes('ai') || name.includes('context')) capabilities.push('ai-enhancement');
    
    return capabilities;
  }

  calculatePriority(name) {
    const priorityMap = {
      'claude-knowledge-base': 10,
      'memory': 9,
      'sequential-thinking': 8,
      'acura-server': 9,
      'econom-server': 8,
      'github': 7,
      'filesystem': 8,
      'desktop-commander': 7
    };

    return priorityMap[name] || 5;
  }

  calculateIntegrationScore(name) {
    // Georgian excellence boost for our tools! 🇬🇪
    if (name.includes('acura') || name.includes('econom')) {
      return 10; // Georgian excellence!
    }
    
    const coreTools = ['claude-knowledge-base', 'memory', 'github', 'filesystem'];
    return coreTools.includes(name) ? 9 : 7;
  }

  generateOptimizationStrategy(mcpProfile) {
    const strategy = {
      taskCategories: [],
      optimalCombinations: [],
      performanceHints: []
    };

    switch (mcpProfile.type) {
      case 'server':
        strategy.taskCategories = ['infrastructure', 'deployment', 'monitoring'];
        strategy.optimalCombinations = ['desktop-commander', 'filesystem'];
        strategy.performanceHints = ['Use for long-running operations', 'Enable background monitoring'];
        break;
        
      case 'development':
        strategy.taskCategories = ['coding', 'version-control', 'file-operations'];
        strategy.optimalCombinations = ['github', 'filesystem', 'desktop-commander'];
        strategy.performanceHints = ['Combine with filesystem for complete workflows'];
        break;
        
      case 'core':
        strategy.taskCategories = ['memory', 'analysis', 'persistence'];
        strategy.optimalCombinations = ['all-mcps'];
        strategy.performanceHints = ['Use as foundation for all operations'];
        break;
    }

    this.optimizationStrategies.set(mcpProfile.name, strategy);
  }

  displayDiscoveryResults() {
    console.log('\n' + boxen(
      chalk.cyan.bold('🏃‍♂️ Marathon MCP Discovery Results\n') +
      chalk.yellow('🇬🇪 Georgian Excellence Detected!'),
      { 
        padding: 1, 
        margin: 1, 
        borderStyle: 'double',
        borderColor: 'cyan'
      }
    ));

    // Group by category
    const grouped = this.groupByCategory();
    
    for (const [category, mcps] of Object.entries(grouped)) {
      console.log(chalk.bold.green(`\n✅ ${category.toUpperCase()} SYSTEMS:`));
      
      mcps.forEach(mcp => {
        const score = chalk.yellow(`[${mcp.integrationScore}/10]`);
        const capabilities = mcp.capabilities.map(cap => chalk.gray(cap)).join(', ');
        console.log(`  - ${chalk.cyan(mcp.name)} ${score} ${capabilities}`);
      });
    }

    this.displayOptimizationStrategies();
  }

  groupByCategory() {
    const grouped = {};
    
    for (const mcp of this.discoveredMCPs.values()) {
      if (!grouped[mcp.type]) {
        grouped[mcp.type] = [];
      }
      grouped[mcp.type].push(mcp);
    }
    
    return grouped;
  }

  displayOptimizationStrategies() {
    console.log(chalk.bold.blue('\n🎯 OPTIMIZATION STRATEGIES GENERATED:'));
    
    const strategies = {
      'Server Management': this.getStrategyForType('server'),
      'Development Workflows': this.getStrategyForType('development'),
      'AI Enhancement': this.getStrategyForType('core'),
      'Business Processes': this.getStrategyForType('business')
    };

    for (const [strategyName, mcps] of Object.entries(strategies)) {
      if (mcps.length > 0) {
        const mcpNames = mcps.map(mcp => chalk.cyan(mcp.name)).join(' + ');
        console.log(`  - ${chalk.yellow(strategyName)}: ${mcpNames}`);
      }
    }

    this.displayGeorgianExcellence();
  }

  getStrategyForType(type) {
    return Array.from(this.discoveredMCPs.values()).filter(mcp => mcp.type === type);
  }

  displayGeorgianExcellence() {
    const georgianMCPs = Array.from(this.discoveredMCPs.values())
      .filter(mcp => mcp.name.includes('acura') || mcp.name.includes('econom'));

    if (georgianMCPs.length > 0) {
      console.log('\n' + boxen(
        chalk.red.bold('🇬🇪 GEORGIAN EXCELLENCE DETECTED! ❤️\n') +
        chalk.yellow('Special optimization for Georgian-built tools:\n') +
        georgianMCPs.map(mcp => `- ${chalk.cyan(mcp.name)} (Batumi-grade quality!)`).join('\n'),
        { 
          padding: 1, 
          borderStyle: 'round',
          borderColor: 'red'
        }
      ));
    }
  }

  async generateConfigOptimizations() {
    const optimizations = {
      marathon_config: {
        auto_discovery: true,
        optimization_strategies: Object.fromEntries(this.optimizationStrategies),
        mcp_profiles: Object.fromEntries(this.discoveredMCPs),
        georgian_excellence: Array.from(this.discoveredMCPs.values())
          .filter(mcp => mcp.name.includes('acura') || mcp.name.includes('econom'))
          .map(mcp => mcp.name)
      }
    };

    const configDir = path.join(process.cwd(), 'config');
    await fs.mkdir(configDir, { recursive: true });
    
    const configPath = path.join(configDir, 'mcp-discovery.json');
    await fs.writeFile(configPath, JSON.stringify(optimizations, null, 2));
    
    console.log(chalk.green(`\n✅ Optimization config saved to: ${configPath}`));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    list: args.includes('--list'),
    optimize: args.includes('--optimize'),
    debug: args.includes('--debug'),
    verbose: args.includes('--verbose')
  };

  console.log(boxen(
    chalk.blue.bold('🏃‍♂️ Marathon MCP Tool v1.0.1\n') +
    chalk.yellow('🇬🇪 MCP Discovery Engine\n') +
    chalk.gray('Built with Georgian Excellence in Batumi'),
    { 
      padding: 1, 
      margin: 1, 
      borderStyle: 'double' 
    }
  ));

  const discoveryEngine = new MCPDiscoveryEngine();
  
  try {
    await discoveryEngine.discoverMCPs();
    
    if (options.optimize) {
      await discoveryEngine.generateConfigOptimizations();
    }
    
    console.log(chalk.green.bold('\n🎯 MCP Discovery Complete!'));
    console.log(chalk.yellow('Ready for Marathon Mode orchestration! 🏃‍♂️'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Discovery failed: ${error.message}`));
    if (options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPDiscoveryEngine };
