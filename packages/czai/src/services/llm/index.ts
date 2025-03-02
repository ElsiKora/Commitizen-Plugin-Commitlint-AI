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

// Valid models for each provider
const VALID_OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo'
];

const VALID_ANTHROPIC_MODELS = [
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
];

// Validate model based on provider
function isValidModel(provider: string, model: string): boolean {
  if (provider === 'openai') {
    return VALID_OPENAI_MODELS.includes(model);
  } else if (provider === 'anthropic') {
    return VALID_ANTHROPIC_MODELS.includes(model);
  }
  return false;
}

// Validate provider
function isValidProvider(provider: string): boolean {
  return provider === 'openai' || provider === 'anthropic';
}

export async function selectLLMProvider(inquirer: any): Promise<void> {
  // Check if we have a partial config
  const existingConfig = getLLMConfig();
  
  let provider: string;
  let model: string;
  
  if (existingConfig) {
    // We have a saved config, check if it's valid
    provider = existingConfig.provider;
    model = existingConfig.model;
    
    // Validate provider and model
    if (!isValidProvider(provider)) {
      console.log(chalk.red(`Invalid provider "${provider}" in saved configuration. Using default setup...`));
      // Fall through to setup
    } else if (!isValidModel(provider, model)) {
      console.log(chalk.yellow(`Warning: Invalid model "${model}" for ${provider} in saved configuration.`));
      console.log(chalk.blue(`Using default setup to select a valid model...`));
      // Fall through to setup
    } else {
      // First check if we want to use the existing config at all
      const { useExisting } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useExisting',
          message: `Use saved ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} (${model}) configuration?`,
          default: true
        }
      ]);
      
      if (!useExisting) {
        // User wants to change the config, fall through to the setup section
      } else {
        // User wants to use existing config, check if we need an API key
        if (!existingConfig.apiKey) {
          // Double-check environment variables again
          const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
          let envApiKey = null;
          
          try {
            if (typeof process !== 'undefined' && process && process.env) {
              envApiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
            }
          } catch (e) {
            // Ignore error
          }
          
          if (envApiKey) {
            // Found API key in environment variable
            console.log(chalk.green(`✅ Found ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in environment variable ${envVarName}`));
            existingConfig.apiKey = envApiKey;
            setLLMConfig(existingConfig);
            return;
          }
          
          console.log(chalk.yellow(`No ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key found in environment.`));
          console.log(chalk.blue(`Tip: Set the ${envVarName} environment variable to avoid entering your API key each time.`));
          console.log(chalk.blue(`You can create a .env file in your project root with ${envVarName}=your-key-here`));
          
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
          
          // Update the config with the API key for this session only
          const config: LLMConfig = { provider, model, apiKey };
          setLLMConfig(config);
          
          return;
        } else {
          // We have a complete config with API key
          return;
        }
      }
    }
  }
  
  // No config or user wants to change it, run the full setup
  const providerResponse = await inquirer.prompt([
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
  
  provider = providerResponse.provider;
  
  if (provider === 'openai') {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select an OpenAI model:',
        choices: [
          { name: 'GPT-4o', value: VALID_OPENAI_MODELS[0] },
          { name: 'GPT-4 Turbo', value: VALID_OPENAI_MODELS[1] },
          { name: 'GPT-4', value: VALID_OPENAI_MODELS[2] },
          { name: 'GPT-3.5 Turbo', value: VALID_OPENAI_MODELS[3] }
        ]
      }
    ]);
    model = response.model;
  } else if (provider === 'anthropic') {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select an Anthropic model:',
        choices: [
          { name: 'Claude 3 Opus', value: VALID_ANTHROPIC_MODELS[0] },
          { name: 'Claude 3 Sonnet', value: VALID_ANTHROPIC_MODELS[1] },
          { name: 'Claude 3 Haiku', value: VALID_ANTHROPIC_MODELS[2] }
        ]
      }
    ]);
    model = response.model;
  } else {
    throw new Error(`Invalid provider: ${provider}`);
  }
  
  // Check if API key is in environment variables
  let envApiKey: string | null = null;
  const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
  
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      envApiKey = provider === 'openai' ? process.env.OPENAI_API_KEY || null : process.env.ANTHROPIC_API_KEY || null;
    }
  } catch (e) {
    console.warn('Error accessing environment variables:', e);
  }
  
  let apiKey: string;
  
  if (envApiKey) {
    console.log(chalk.green(`✅ Found ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in environment variable ${envVarName}`));
    apiKey = envApiKey;
  } else {
    console.log(chalk.yellow(`No ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key found in environment.`));
    console.log(chalk.blue(`Tip: Set the ${envVarName} environment variable to avoid entering your API key each time.`));
    
    const response = await inquirer.prompt([
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
    
    apiKey = response.apiKey;
  }
  
  // Save the config (API key won't be saved to file)
  const config: LLMConfig = { provider, model, apiKey };
  setLLMConfig(config);
  
  console.log(chalk.green(`✅ ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} configured successfully!`));
}

export async function generateCommitMessage(context: LLMPromptContext): Promise<CommitConfig> {
  const config = getLLMConfig();
  if (!config) {
    throw new Error('LLM not configured. Please run selectLLMProvider first.');
  }
  
  // Validate provider and model
  if (!isValidProvider(config.provider)) {
    throw new Error(`Invalid LLM provider: ${config.provider}. Please reconfigure with a valid provider.`);
  }
  
  if (!isValidModel(config.provider, config.model)) {
    throw new Error(`Invalid model ${config.model} for provider ${config.provider}. Please reconfigure with a valid model.`);
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
  } else if (config.provider === 'anthropic') {
    return generateCommitWithAnthropic(config.apiKey, config.model, context);
  } else {
    // This shouldn't happen due to the validation above, but just in case
    throw new Error(`Unsupported provider: ${config.provider}`);
  }
}