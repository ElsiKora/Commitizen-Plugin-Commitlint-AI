import { homedir } from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { LLMConfig } from './types.js';

// Store config in user's home directory
const CONFIG_DIR = join(homedir(), '.commitizen-ai');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// In-memory cache
let llmConfig: LLMConfig | null = null;

// Try to load config from file
const loadConfigFromFile = (): LLMConfig | null => {
  try {
    if (existsSync(CONFIG_FILE)) {
      const configStr = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(configStr) as LLMConfig;
    }
  } catch (error) {
    console.warn('Error loading LLM config from file:', error);
  }
  return null;
};

// Save config to file
const saveConfigToFile = (config: LLMConfig): void => {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
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
    llmConfig = fileConfig;
  }
  
  return llmConfig;
};