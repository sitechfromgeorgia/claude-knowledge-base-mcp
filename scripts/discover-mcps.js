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
    // General category patterns - adaptable to any MCP
    if (name.includes('knowledge') || name.includes('memory') || name.includes('thinking')) {
      return 'core';
    }
    if (name.includes('server') || name.includes('docker') || name.includes('kubernetes')) {
      return 'infrastructure';
    }
    if (name.includes('github') || name.includes('filesystem') || name.includes('desktop') || name.includes('command')) {
      return 'development';
    }
    if (name.includes('database') || name.includes('sql') || name.includes('postgres') || name.includes('mongo')) {
      return 'database';
    }
    if (name.includes('api') || name.includes('web') || name.includes('http')) {
      return 'integration';
    }
    if (name.includes('ai') || name.includes('ml') || name.includes('context')) {
      return 'ai-enhancement';
    }
    
    return 'custom';
  }

  inferCapabilities(name, config) {
    const capabilities = [];
    
    // Infer capabilities from common patterns
    if (name.includes('server') || name.includes('infrastructure')) {
      capabilities.push('infrastructure', 'monitoring');
    }
    if (name.includes('github') || name.includes('git')) {
      capabilities.push('version-control', 'collaboration');
    }
    if (name.includes('filesystem') || name.includes('file')) {
      capabilities.push('file-operations', 'storage');
    }
    if (name.includes('desktop') || name.includes('command')) {
      capabilities.push('system-control', 'automation');
    }
    if (name.includes('database') || name.includes('sql')) {
      capabilities.push('data-management');
    }
    if (name.includes('ai') || name.includes('context') || name.includes('ml')) {
      capabilities.push('ai-enhancement');
    }
    if (name.includes('api') || name.includes('web')) {
      capabilities.push('integration', 'communication');
    }
    
    return capabilities;
  }

  calculatePriority(name) {
    // Base priority calculation - adaptable
    if (name.includes('knowledge') || name.includes('memory')) {
      return 10; // Core functionality
    }
    if (name.includes('filesystem') || name.includes('github')) {
      return 8; // Essential development tools
    }
    if (name.includes('server') || name.includes('desktop')) {
      return 7; // Infrastructure tools
    }
    
    return 5; // Default priority
  }

  calculateIntegrationScore(name) {
    // Base integration scoring
    const coreTools = ['knowledge', 'memory', 'github', 'filesystem', 'desktop'];
    const hasCore = coreTools.some(tool => name.includes(tool));
    
    return hasCore ? 9 : 7;
  }

  generateOptimizationStrategy(mcpProfile) {
    const strategy = {
      taskCategories: [],
      optimalCombinations: [],
      performanceHints: []
    };

    switch (mcpProfile.type) {
      case 'infrastructure':
        strategy.taskCategories = ['deployment', 'monitoring', 'scaling'];
        strategy.optimalCombinations = ['development-tools', 'database-tools'];
        strategy.performanceHints = ['Use for long-running operations', 'Enable background monitoring'];
        break;
        
      case 'development':
        strategy.taskCategories = ['coding', 'version-control', 'file-operations'];
        strategy.optimalCombinations = ['infrastructure-tools', 'database-tools'];
        strategy.performanceHints = ['Combine with filesystem for complete workflows'];
        break;
        
      case 'core':
        strategy.taskCategories = ['memory', 'analysis', 'persistence'];
        strategy.optimalCombinations = ['all-categories'];
        strategy.performanceHints = ['Use as foundation for all operations'];
        break;
        
      case 'database':
        strategy.taskCategories = ['data-management', 'persistence', 'analytics'];
        strategy.optimalCombinations = ['development-tools', 'infrastructure-tools'];
        strategy.performanceHints = ['Optimize for data-heavy operations'];
        break;
        
      case 'ai-enhancement':
        strategy.taskCategories = ['analysis', 'optimization', 'intelligence'];
        strategy.optimalCombinations = ['core-tools', 'development-tools'];
        strategy.performanceHints = ['Use for complex decision making'];
        break;
    }

    this.optimizationStrategies.set(mcpProfile.name, strategy);
  }

  displayDiscoveryResults() {
    console.log('\n' + boxen(
      chalk.cyan.bold('🏃‍♂️ Marathon MCP Discovery Results\n') +
      chalk.yellow('🇬🇪 Georgian Excellence Activated!'),
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
      console.log(chalk.bold.green(`\n✅ ${category.toUpperCase()} TOOLS:`));
      
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
      'Infrastructure Management': this.getStrategyForType('infrastructure'),
      'Development Workflows': this.getStrategyForType('development'),
      'Data Operations': this.getStrategyForType('database'),
      'AI Enhancement': this.getStrategyForType('ai-enhancement'),
      'Core Operations': this.getStrategyForType('core')
    };

    for (const [strategyName, mcps] of Object.entries(strategies)) {
      if (mcps.length > 0) {
        const mcpNames = mcps.map(mcp => chalk.cyan(mcp.name)).join(' + ');
        console.log(`  - ${chalk.yellow(strategyName)}: ${mcpNames}`);
      }
    }

    this.displayGeorgianMessage();
  }

  getStrategyForType(type) {
    return Array.from(this.discoveredMCPs.values()).filter(mcp => mcp.type === type);
  }

  displayGeorgianMessage() {
    console.log('\n' + boxen(
      chalk.red.bold('🇬🇪 GEORGIAN EXCELLENCE ACTIVATED! ❤️\n') +
      chalk.yellow('Marathon MCP Tool intelligently coordinates all your tools\n') +
      chalk.white('Optimizations tailored to your specific MCP ecosystem\n') +
      chalk.gray('Built with Black Sea determination and mountain endurance'),
      { 
        padding: 1, 
        borderStyle: 'round',
        borderColor: 'red'
      }
    ));
  }

  async generateConfigOptimizations() {
    const optimizations = {
      marathon_config: {
        auto_discovery: true,
        optimization_strategies: Object.fromEntries(this.optimizationStrategies),
        mcp_profiles: Object.fromEntries(this.discoveredMCPs),
        discovered_count: this.discoveredMCPs.size,
        categories_found: [...new Set(Array.from(this.discoveredMCPs.values()).map(mcp => mcp.type))]
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
    chalk.yellow('🇬🇪 Universal MCP Discovery Engine\n') +
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
    console.log(chalk.yellow('Ready for intelligent Marathon orchestration! 🏃‍♂️'));
    
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
