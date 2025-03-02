import { describe, expect, it } from 'vitest';
import { getLLMConfig, setLLMConfig } from './config.js';

describe('LLM Config', () => {
  it('should set and get LLM config', () => {
    const config = {
      provider: 'openai' as const,
      model: 'gpt-4' as const,
      apiKey: 'test-key'
    };

    setLLMConfig(config);
    const retrievedConfig = getLLMConfig();

    expect(retrievedConfig).toEqual(config);
  });

  it('should return null when config is not set', () => {
    // Reset config
    setLLMConfig(null);
    const config = getLLMConfig();
    expect(config).toBeNull();
  });
});