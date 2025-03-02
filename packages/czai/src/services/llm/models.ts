/**
 * Centralized model definitions for LLM providers
 */

// OpenAI Models
export const OPENAI_MODELS = {
  // GPT-4o Family
  GPT4O: 'gpt-4o',
  GPT4O_MINI: 'gpt-4o-mini',
  
  // O1 Family (Next-gen models)
  O1: 'o1',
  O1_MINI: 'o1-mini',
  O3_MINI: 'o3-mini',
  
  // GPT-4.5 Preview
  GPT45_PREVIEW: 'gpt-4.5-preview',
  
  // Legacy GPT-4 models
  GPT4: 'gpt-4',
  GPT4_TURBO: 'gpt-4-turbo',
  
  // GPT-3.5 models
  GPT35_TURBO: 'gpt-3.5-turbo'
};

// Anthropic Models
export const ANTHROPIC_MODELS = {
  // Claude 3.7 Family
  CLAUDE_37_SONNET: 'claude-3-7-sonnet-20250219',
  
  // Claude 3.5 Family
  CLAUDE_35_SONNET_V2: 'claude-3-5-sonnet-20241022',
  CLAUDE_35_SONNET: 'claude-3-5-sonnet-20240620',
  CLAUDE_35_HAIKU: 'claude-3-5-haiku-20241022',
  
  // Claude 3 Family
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307'
};

// Model choices for OpenAI UI
export const OPENAI_MODEL_CHOICES = [
  { name: 'GPT-4o', value: OPENAI_MODELS.GPT4O },
  { name: 'GPT-4o Mini', value: OPENAI_MODELS.GPT4O_MINI },
  { name: 'O1', value: OPENAI_MODELS.O1 },
  { name: 'O1 Mini', value: OPENAI_MODELS.O1_MINI },
  { name: 'O3 Mini', value: OPENAI_MODELS.O3_MINI },
  { name: 'GPT-4.5 Preview', value: OPENAI_MODELS.GPT45_PREVIEW },
  { name: 'GPT-4 Turbo', value: OPENAI_MODELS.GPT4_TURBO },
  { name: 'GPT-4', value: OPENAI_MODELS.GPT4 },
  { name: 'GPT-3.5 Turbo', value: OPENAI_MODELS.GPT35_TURBO },
  { name: 'Custom Model...', value: 'custom' }
];

// Model choices for Anthropic UI
export const ANTHROPIC_MODEL_CHOICES = [
  { name: 'Claude 3.7 Sonnet', value: ANTHROPIC_MODELS.CLAUDE_37_SONNET },
  { name: 'Claude 3.5 Sonnet v2', value: ANTHROPIC_MODELS.CLAUDE_35_SONNET_V2 },
  { name: 'Claude 3.5 Sonnet', value: ANTHROPIC_MODELS.CLAUDE_35_SONNET },
  { name: 'Claude 3.5 Haiku', value: ANTHROPIC_MODELS.CLAUDE_35_HAIKU },
  { name: 'Claude 3 Opus', value: ANTHROPIC_MODELS.CLAUDE_3_OPUS },
  { name: 'Claude 3 Sonnet', value: ANTHROPIC_MODELS.CLAUDE_3_SONNET },
  { name: 'Claude 3 Haiku', value: ANTHROPIC_MODELS.CLAUDE_3_HAIKU },
  { name: 'Custom Model...', value: 'custom' }
];

// Functions to get model lists
export function getOpenAIModels(): string[] {
  return Object.values(OPENAI_MODELS);
}

export function getAnthropicModels(): string[] {
  return Object.values(ANTHROPIC_MODELS);
}