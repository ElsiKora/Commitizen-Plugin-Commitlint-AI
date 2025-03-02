import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { generateCommitWithAnthropic } from './anthropic.js';
import { getLLMConfig, setLLMConfig } from './config.js';
import { generateCommitWithOpenAI } from './openai.js';
import type { CommitConfig, LLMConfig, LLMPromptContext } from './types.js';

const execAsync = promisify(exec);

export * from './types.js';
export { getLLMConfig, setLLMConfig } from './config.js';

export async function selectLLMProvider(inquirer: any): Promise<void> {
  // Check if we already have a config
  const existingConfig = getLLMConfig();
  
  if (existingConfig) {
    const { useExisting } = await inquirer.prompt([
      {
        type: 'list',
        name: 'useExisting',
        message: `Use existing ${existingConfig.provider === 'openai' ? 'OpenAI' : 'Anthropic'} configuration?`,
        choices: [
          { name: `Yes, use ${existingConfig.provider === 'openai' ? 'OpenAI' : 'Anthropic'} (${existingConfig.model})`, value: true },
          { name: 'No, configure a different provider', value: false }
        ]
      }
    ]);
    
    if (useExisting) {
      return;
    }
  }
  
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select an LLM provider:',
      choices: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic', value: 'anthropic' }
      ]
    }
  ]);
  
  let model;
  if (provider === 'openai') {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select an OpenAI model:',
        choices: [
          { name: 'GPT-4o', value: 'gpt-4o' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-4', value: 'gpt-4' },
          { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
        ]
      }
    ]);
    model = response.model;
  } else {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select an Anthropic model:',
        choices: [
          { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { name: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
        ]
      }
    ]);
    model = response.model;
  }
  
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key:`,
      validate: (input: string) => {
        if (!input) return 'API key is required';
        if (provider === 'openai' && !input.startsWith('sk-')) {
          return 'OpenAI API keys typically start with "sk-"';
        }
        return true;
      }
    }
  ]);
  
  const config: LLMConfig = { provider, model, apiKey };
  setLLMConfig(config);
  
  console.log(chalk.green(`✅ ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} configured successfully!`));
}

export async function generateCommitMessage(context: LLMPromptContext): Promise<CommitConfig> {
  const config = getLLMConfig();
  if (!config) {
    throw new Error('LLM not configured. Please run selectLLMProvider first.');
  }
  
  // Get git diff for better context
  try {
    // Get staged files for scope inference
    const { stdout: stagedFiles } = await execAsync('git diff --name-only --cached');
    context.files = stagedFiles;
    
    // Get directory structure for better scope inference
    if (stagedFiles.trim()) {
      const directories = stagedFiles
        .split('\n')
        .filter(Boolean)
        .map(file => {
          const parts = file.split('/');
          return parts.length > 1 ? parts[0] : 'root';
        })
        .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
        .join(', ');
      
      context.files += `\n\nModified directories: ${directories}`;
    }
    
    // Get the diff for content analysis
    const { stdout: diff } = await execAsync('git diff --cached');
    context.diff = diff;
  } catch (error) {
    console.warn('Failed to get git diff information, continuing without it');
  }
  
  // Generate commit with selected provider
  if (config.provider === 'openai') {
    return generateCommitWithOpenAI(config.apiKey, config.model, context);
  } else {
    return generateCommitWithAnthropic(config.apiKey, config.model, context);
  }
}