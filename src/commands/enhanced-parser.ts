import { z } from 'zod';

export interface ParsedCommand {
  type: 'symbol' | 'slash';
  originalCommand: string;
  
  // For symbol commands (---, +++, ..., ***)
  symbols?: {
    load: boolean;
    execute: boolean;
    save: boolean;
    marathon: boolean;
  };
  
  // For slash commands (/deploy, /search, etc.)
  slashCommand?: {
    name: string;
    parameters: Record<string, any>;
    flags: string[];
  };
  
  // Common
  cleanText: string;
  context?: any;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CommandConfig {
  name: string;
  description: string;
  aliases?: string[];
  parameters?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array';
    required?: boolean;
    default?: any;
    description?: string;
  }>;
  flags?: Record<string, {
    short?: string;
    description?: string;
    default?: any;
  }>;
  examples?: string[];
}

export class EnhancedCommandParser {
  private commands: Map<string, CommandConfig> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.initializeBuiltInCommands();
  }

  private initializeBuiltInCommands(): void {
    const builtInCommands: CommandConfig[] = [
      {
        name: 'deploy',
        description: 'Deploy infrastructure or applications with memory tracking',
        aliases: ['d'],
        parameters: {
          target: { type: 'string', required: true, description: 'Deployment target' },
          environment: { type: 'string', default: 'development', description: 'Target environment' },
          version: { type: 'string', description: 'Version to deploy' }
        },
        flags: {
          'with-memory': { short: 'm', description: 'Enable memory tracking', default: false },
          'marathon': { short: 'M', description: 'Enable Marathon Mode', default: false },
          'force': { short: 'f', description: 'Force deployment', default: false },
          'dry-run': { short: 'n', description: 'Show what would be deployed', default: false }
        },
        examples: [
          '/deploy api --environment=production --with-memory',
          '/deploy --marathon "Complete infrastructure setup"'
        ]
      },
      {
        name: 'search',
        description: 'Search through memory and knowledge base',
        aliases: ['s', 'find'],
        parameters: {
          query: { type: 'string', required: true, description: 'Search query' },
          limit: { type: 'number', default: 10, description: 'Maximum results' }
        },
        flags: {
          'semantic': { short: 's', description: 'Use semantic search', default: true },
          'exact': { short: 'e', description: 'Exact match only', default: false },
          'include-graph': { short: 'g', description: 'Include graph context', default: true },
          'recent': { short: 'r', description: 'Recent items only', default: false }
        },
        examples: [
          '/search "database configuration" --limit=20',
          '/search --exact "error code 500"'
        ]
      },
      {
        name: 'save',
        description: 'Save current progress or specific data',
        aliases: ['store'],
        parameters: {
          data: { type: 'string', required: true, description: 'Data to save' },
          category: { type: 'string', default: 'interactions', description: 'Memory category' }
        },
        flags: {
          'priority': { description: 'Priority level (low|medium|high|critical)', default: 'medium' },
          'tags': { short: 't', description: 'Comma-separated tags' },
          'checkpoint': { short: 'c', description: 'Create checkpoint', default: false }
        },
        examples: [
          '/save "Completed API setup" --category=projects --tags=api,setup',
          '/save --checkpoint "Major milestone reached"'
        ]
      },
      {
        name: 'load',
        description: 'Load context and relevant memories',
        aliases: ['context', 'recall'],
        parameters: {
          query: { type: 'string', description: 'Context query' }
        },
        flags: {
          'categories': { short: 'c', description: 'Filter by categories' },
          'session': { short: 's', description: 'Load specific session' },
          'timeframe': { short: 't', description: 'Time range (1h, 1d, 1w)' },
          'full': { short: 'f', description: 'Load full context', default: false }
        },
        examples: [
          '/load --categories=infrastructure,projects',
          '/load "server setup" --timeframe=1w'
        ]
      },
      {
        name: 'marathon',
        description: 'Marathon Mode operations',
        aliases: ['m'],
        parameters: {
          action: { type: 'string', required: true, description: 'Action: start|stop|status|checkpoint|transfer' }
        },
        flags: {
          'auto-save': { short: 'a', description: 'Auto-save interval in minutes', default: 5 },
          'checkpoint-id': { description: 'Checkpoint ID for restore' },
          'task': { short: 't', description: 'Task description for Marathon Mode' }
        },
        examples: [
          '/marathon start --task="Deploy complete system"',
          '/marathon checkpoint',
          '/marathon transfer'
        ]
      },
      {
        name: 'execute',
        description: 'Execute complex tasks with tool chaining',
        aliases: ['exec', 'run'],
        parameters: {
          task: { type: 'string', required: true, description: 'Task to execute' }
        },
        flags: {
          'marathon': { short: 'M', description: 'Enable Marathon Mode', default: false },
          'steps': { description: 'Predefined steps (comma-separated)' },
          'tools': { short: 't', description: 'Specific tools to use' },
          'parallel': { short: 'p', description: 'Execute in parallel where possible', default: false }
        },
        examples: [
          '/execute "Set up monitoring dashboard" --marathon',
          '/execute --tools=github,filesystem "Create new project structure"'
        ]
      },
      {
        name: 'config',
        description: 'Configuration management',
        aliases: ['cfg'],
        parameters: {
          key: { type: 'string', description: 'Configuration key' },
          value: { type: 'string', description: 'Configuration value' }
        },
        flags: {
          'list': { short: 'l', description: 'List all configurations', default: false },
          'reset': { short: 'r', description: 'Reset to defaults', default: false },
          'export': { short: 'e', description: 'Export configuration', default: false }
        },
        examples: [
          '/config --list',
          '/config autoSaveInterval 10',
          '/config --export'
        ]
      },
      {
        name: 'stats',
        description: 'Show system statistics and analytics',
        aliases: ['status', 'info'],
        flags: {
          'memory': { short: 'm', description: 'Memory statistics', default: false },
          'sessions': { short: 's', description: 'Session statistics', default: false },
          'performance': { short: 'p', description: 'Performance metrics', default: false },
          'all': { short: 'a', description: 'All statistics', default: true }
        },
        examples: [
          '/stats',
          '/stats --memory --performance'
        ]
      },
      {
        name: 'help',
        description: 'Show help information',
        aliases: ['h', '?'],
        parameters: {
          command: { type: 'string', description: 'Specific command help' }
        },
        flags: {
          'examples': { short: 'e', description: 'Show examples', default: false },
          'verbose': { short: 'v', description: 'Verbose help', default: false }
        },
        examples: [
          '/help',
          '/help deploy --examples',
          '/help --verbose'
        ]
      }
    ];

    builtInCommands.forEach(cmd => {
      this.commands.set(cmd.name, cmd);
      cmd.aliases?.forEach(alias => {
        this.aliases.set(alias, cmd.name);
      });
    });
  }

  /**
   * Parse command input - supports both symbol and slash syntax
   */
  parseCommand(input: string): ParsedCommand {
    const trimmedInput = input.trim();
    
    // Detect command type
    if (this.isSlashCommand(trimmedInput)) {
      return this.parseSlashCommand(trimmedInput);
    } else if (this.isSymbolCommand(trimmedInput)) {
      return this.parseSymbolCommand(trimmedInput);
    } else {
      // Default to symbol command parsing for backward compatibility
      return this.parseSymbolCommand(trimmedInput);
    }
  }

  private isSlashCommand(input: string): boolean {
    return input.startsWith('/');
  }

  private isSymbolCommand(input: string): boolean {
    return /---|\+\+\+|\.\.\.|\*\*\*/.test(input);
  }

  private parseSlashCommand(input: string): ParsedCommand {
    // Remove leading slash
    const commandLine = input.slice(1);
    
    // Parse using shell-like syntax
    const tokens = this.tokenizeCommand(commandLine);
    if (tokens.length === 0) {
      throw new Error('Empty command');
    }

    const commandName = tokens[0];
    const resolvedCommand = this.aliases.get(commandName) || commandName;
    
    if (!this.commands.has(resolvedCommand)) {
      throw new Error(`Unknown command: ${commandName}`);
    }

    const config = this.commands.get(resolvedCommand)!;
    const parsed = this.parseTokens(tokens.slice(1), config);

    return {
      type: 'slash',
      originalCommand: input,
      slashCommand: {
        name: resolvedCommand,
        parameters: parsed.parameters,
        flags: parsed.flags
      },
      cleanText: parsed.cleanText,
      priority: this.determinePriority(parsed.flags)
    };
  }

  private parseSymbolCommand(input: string): ParsedCommand {
    const symbols = {
      load: input.includes('---'),
      execute: input.includes('+++'),
      save: input.includes('...'),
      marathon: input.includes('***')
    };

    const cleanText = input
      .replace(/---/g, '')
      .replace(/\+\+\+/g, '')
      .replace(/\.\.\./g, '')
      .replace(/\*\*\*/g, '')
      .trim();

    return {
      type: 'symbol',
      originalCommand: input,
      symbols,
      cleanText,
      priority: this.determinePriorityFromSymbols(symbols)
    };
  }

  private tokenizeCommand(input: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  private parseTokens(tokens: string[], config: CommandConfig): {
    parameters: Record<string, any>;
    flags: string[];
    cleanText: string;
  } {
    const parameters: Record<string, any> = {};
    const flags: string[] = [];
    const cleanTextParts: string[] = [];

    // Set defaults
    Object.entries(config.parameters || {}).forEach(([key, param]) => {
      if (param.default !== undefined) {
        parameters[key] = param.default;
      }
    });

    Object.entries(config.flags || {}).forEach(([key, flag]) => {
      if (flag.default !== undefined) {
        parameters[key] = flag.default;
      }
    });

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.startsWith('--')) {
        // Long flag
        const flagName = token.slice(2);
        const [key, value] = flagName.split('=', 2);
        
        if (value !== undefined) {
          parameters[key] = this.parseValue(value);
        } else if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
          parameters[key] = this.parseValue(tokens[i + 1]);
          i++;
        } else {
          parameters[key] = true;
        }
        flags.push(key);
      } else if (token.startsWith('-') && token.length > 1) {
        // Short flag(s)
        const shortFlags = token.slice(1);
        for (const shortFlag of shortFlags) {
          const longFlag = this.findLongFlag(shortFlag, config);
          if (longFlag) {
            if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-') && shortFlags.length === 1) {
              parameters[longFlag] = this.parseValue(tokens[i + 1]);
              i++;
            } else {
              parameters[longFlag] = true;
            }
            flags.push(longFlag);
          }
        }
      } else {
        // Positional parameter or clean text
        const paramNames = Object.keys(config.parameters || {});
        const unsetParams = paramNames.filter(name => 
          parameters[name] === undefined || 
          parameters[name] === (config.parameters![name].default)
        );

        if (unsetParams.length > 0) {
          parameters[unsetParams[0]] = token;
        } else {
          cleanTextParts.push(token);
        }
      }
      
      i++;
    }

    // Validate required parameters
    Object.entries(config.parameters || {}).forEach(([key, param]) => {
      if (param.required && parameters[key] === undefined) {
        throw new Error(`Required parameter '${key}' is missing`);
      }
    });

    return {
      parameters,
      flags,
      cleanText: cleanTextParts.join(' ')
    };
  }

  private findLongFlag(shortFlag: string, config: CommandConfig): string | null {
    for (const [longFlag, flagConfig] of Object.entries(config.flags || {})) {
      if (flagConfig.short === shortFlag) {
        return longFlag;
      }
    }
    return null;
  }

  private parseValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // Fall back to string
      return value;
    }
  }

  private determinePriority(flags: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (flags.includes('critical') || flags.includes('urgent')) return 'critical';
    if (flags.includes('high') || flags.includes('important')) return 'high';
    if (flags.includes('low') || flags.includes('minor')) return 'low';
    return 'medium';
  }

  private determinePriorityFromSymbols(symbols: any): 'low' | 'medium' | 'high' | 'critical' {
    if (symbols.marathon) return 'high';
    if (symbols.execute && symbols.save) return 'high';
    if (symbols.save) return 'medium';
    return 'medium';
  }

  /**
   * Register a new command
   */
  registerCommand(config: CommandConfig): void {
    this.commands.set(config.name, config);
    config.aliases?.forEach(alias => {
      this.aliases.set(alias, config.name);
    });
  }

  /**
   * Get command configuration
   */
  getCommand(name: string): CommandConfig | null {
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.get(resolvedName) || null;
  }

  /**
   * Get all available commands
   */
  getAllCommands(): CommandConfig[] {
    return Array.from(this.commands.values());
  }

  /**
   * Generate help text for a command
   */
  generateHelp(commandName?: string, showExamples: boolean = false): string {
    if (commandName) {
      const config = this.getCommand(commandName);
      if (!config) {
        return `Unknown command: ${commandName}`;
      }

      return this.generateCommandHelp(config, showExamples);
    } else {
      return this.generateGeneralHelp(showExamples);
    }
  }

  private generateCommandHelp(config: CommandConfig, showExamples: boolean): string {
    let help = `\n🔧 **${config.name}** - ${config.description}\n\n`;

    if (config.aliases && config.aliases.length > 0) {
      help += `**Aliases:** ${config.aliases.map(a => `/${a}`).join(', ')}\n\n`;
    }

    // Parameters
    if (config.parameters && Object.keys(config.parameters).length > 0) {
      help += `**Parameters:**\n`;
      Object.entries(config.parameters).forEach(([name, param]) => {
        const required = param.required ? ' (required)' : '';
        const defaultVal = param.default !== undefined ? ` [default: ${param.default}]` : '';
        help += `  • ${name}: ${param.description}${required}${defaultVal}\n`;
      });
      help += '\n';
    }

    // Flags
    if (config.flags && Object.keys(config.flags).length > 0) {
      help += `**Flags:**\n`;
      Object.entries(config.flags).forEach(([name, flag]) => {
        const short = flag.short ? `-${flag.short}, ` : '';
        const defaultVal = flag.default !== undefined ? ` [default: ${flag.default}]` : '';
        help += `  • ${short}--${name}: ${flag.description}${defaultVal}\n`;
      });
      help += '\n';
    }

    // Examples
    if (showExamples && config.examples && config.examples.length > 0) {
      help += `**Examples:**\n`;
      config.examples.forEach(example => {
        help += `  ${example}\n`;
      });
    }

    return help;
  }

  private generateGeneralHelp(showExamples: boolean): string {
    let help = `\n🚀 **Claude Knowledge Base MCP v3.0 - Command Reference**\n\n`;
    
    help += `**Dual Command Syntax:**\n`;
    help += `• **Symbol Commands:** \`--- +++ ... ***\` (original syntax)\n`;
    help += `• **Slash Commands:** \`/command --flags parameters\` (new syntax)\n\n`;

    help += `**Symbol Quick Reference:**\n`;
    help += `• \`---\` Load context and memories\n`;
    help += `• \`+++\` Execute complex tasks\n`;
    help += `• \`...\` Save progress\n`;
    help += `• \`***\` Marathon Mode\n\n`;

    help += `**Available Commands:**\n`;
    const commands = this.getAllCommands();
    commands.forEach(cmd => {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      help += `• **/${cmd.name}${aliases}** - ${cmd.description}\n`;
    });

    if (showExamples) {
      help += `\n**Example Combinations:**\n`;
      help += `• \`--- +++ /deploy api --marathon\` - Load context, execute deployment with Marathon Mode\n`;
      help += `• \`/search "database errors" ... /save --checkpoint\` - Search and save with checkpoint\n`;
      help += `• \`*** /execute "Complete CI/CD setup"\` - Long-running task with Marathon Mode\n`;
    }

    help += `\n**Get specific help:** \`/help <command> --examples\`\n`;

    return help;
  }

  /**
   * Validate command syntax without executing
   */
  validateCommand(input: string): { valid: boolean; errors: string[] } {
    try {
      this.parseCommand(input);
      return { valid: true, errors: [] };
    } catch (error) {
      return { 
        valid: false, 
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get command suggestions based on partial input
   */
  getSuggestions(partial: string): string[] {
    if (!partial.startsWith('/')) {
      return [];
    }

    const commandPart = partial.slice(1).toLowerCase();
    const suggestions: string[] = [];

    // Match command names
    for (const [name, config] of this.commands.entries()) {
      if (name.toLowerCase().startsWith(commandPart)) {
        suggestions.push(`/${name} - ${config.description}`);
      }
    }

    // Match aliases
    for (const [alias, realName] of this.aliases.entries()) {
      if (alias.toLowerCase().startsWith(commandPart)) {
        const config = this.commands.get(realName);
        suggestions.push(`/${alias} - ${config?.description || 'Alias for ' + realName}`);
      }
    }

    return suggestions.slice(0, 10);
  }
}
