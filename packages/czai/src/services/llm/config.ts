import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { LLMConfig, LLMConfigStorage } from './types.js';

// Store config in project directory
const CONFIG_DIR = './.elsikora';
const CONFIG_FILE = join(CONFIG_DIR, 'commitlint-ai.config.js');

// In-memory cache
let llmConfig: LLMConfig | null = null;

// Check for API keys in environment variables
const getApiKeyFromEnv = (provider: string): string | null => {
  try {
    if (typeof process === 'undefined' || !process || !process.env) {
      return null;
    }

    if (provider === 'openai') {
      return process.env.OPENAI_API_KEY || null;
    } else if (provider === 'anthropic') {
      return process.env.ANTHROPIC_API_KEY || null;
    }
  } catch (e) {
    console.warn('Error accessing environment variables:', e);
  }
  return null;
};

// Try to load config from file
const loadConfigFromFile = (): LLMConfigStorage | null => {
  try {
    if (existsSync(CONFIG_FILE)) {
      // Check if there's an old JSON file and migrate it
      const oldJsonFile = join(CONFIG_DIR, 'commitlint-ai.json');
      if (existsSync(oldJsonFile)) {
        try {
          const oldConfigStr = readFileSync(oldJsonFile, 'utf-8');
          const oldConfig = JSON.parse(oldConfigStr) as LLMConfigStorage;
          
          // Save to the new JS format
          saveConfigToFile({
            ...oldConfig,
            apiKey: ''
          });
          
          return oldConfig;
        } catch (e) {
          // Ignore errors with old file
        }
      }
      
      // Parse the ESM module format
      const configContent = readFileSync(CONFIG_FILE, 'utf-8');
      
      // Extract the JSON object from the ESM export
      const jsonMatch = configContent.match(/export\s+default\s+({[\s\S]*?});/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]) as LLMConfigStorage;
        } catch (parseError) {
          console.warn('Error parsing config JSON:', parseError);
          return null;
        }
      }
      
      // If we can't parse it properly, return null and let the user reconfigure
      return null;
    }
  } catch (error) {
    console.warn('Error loading LLM config from file:', error);
  }
  return null;
};

// Save config to file (without API key)
const saveConfigToFile = (config: LLMConfig): void => {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Only store provider and model, not the API key
    const storageConfig: LLMConfigStorage = {
      provider: config.provider,
      model: config.model
    };
    
    // Format as an ESM module with proper JS object format (no quotes around keys)
    const jsContent = `export default {
  provider: ${JSON.stringify(storageConfig.provider)},
  model: ${JSON.stringify(storageConfig.model)}
};`;
    
    writeFileSync(CONFIG_FILE, jsContent, 'utf-8');
    
    // Remove old JSON file if it exists
    const oldJsonFile = join(CONFIG_DIR, 'commitlint-ai.json');
    if (existsSync(oldJsonFile)) {
      try {
        // Use fs.unlink to delete the file - but we'll use writeFileSync with empty content instead
        // to avoid needing to import fs.unlink
        writeFileSync(oldJsonFile, '', 'utf-8');
      } catch (e) {
        // Ignore errors with old file deletion
      }
    }
  } catch (error) {
    console.warn('Error saving LLM config to file:', error);
  }
};

export const setLLMConfig = (config: LLMConfig | null): void => {
  llmConfig = config;
  if (config) {
    saveConfigToFile(config);
  }
};

export const getLLMConfig = (): LLMConfig | null => {
  // If we already have a config in memory, return it
  if (llmConfig) {
    return llmConfig;
  }
  
  // Otherwise try to load from file
  const fileConfig = loadConfigFromFile();
  if (fileConfig) {
    // Check if we have API key in environment
    const apiKey = getApiKeyFromEnv(fileConfig.provider);
    
    // We have both the saved config and an API key
    if (apiKey) {
      llmConfig = {
        ...fileConfig,
        apiKey
      };
      return llmConfig;
    }
    
    // Return the partial config (without API key) so we can ask for it
    return {
      ...fileConfig,
      apiKey: '' // Empty string signals that we need to ask for the key
    };
  }
  
  return null;
};