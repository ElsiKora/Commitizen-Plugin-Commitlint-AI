import { describe, expect, it } from 'vitest';
import { extractLLMPromptContext } from './commitlintConfig.js';

describe('Extract LLM Prompt Context', () => {
  it('should extract type enum from rules', () => {
    const rules = {
      'type-enum': [2, 'always', ['feat', 'fix', 'docs']]
    };
    const prompt = {};
    
    const context = extractLLMPromptContext(rules, prompt);
    
    expect(context.typeEnum).toEqual(['feat', 'fix', 'docs']);
  });
  
  it('should extract type descriptions from prompt config', () => {
    const rules = {};
    const prompt = {
      questions: {
        type: {
          enum: {
            feat: {
              description: 'A new feature',
              emoji: '✨',
              title: 'Features'
            }
          }
        }
      }
    };
    
    const context = extractLLMPromptContext(rules, prompt);
    
    expect(context.typeDescriptions).toEqual({
      feat: {
        description: 'A new feature',
        emoji: '✨',
        title: 'Features'
      }
    });
  });
  
  it('should extract subject case options', () => {
    const rules = {
      'subject-case': [2, 'always', ['lower-case', 'sentence-case']]
    };
    const prompt = {};
    
    const context = extractLLMPromptContext(rules, prompt);
    
    expect(context.subject.case).toEqual(['lower-case', 'sentence-case']);
  });
});