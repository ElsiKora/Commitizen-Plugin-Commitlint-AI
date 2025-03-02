import type { LLMConfig } from './types.js';

let llmConfig: LLMConfig | null = null;

export const setLLMConfig = (config: LLMConfig): void => {
  llmConfig = config;
};

export const getLLMConfig = (): LLMConfig | null => {
  return llmConfig;
};