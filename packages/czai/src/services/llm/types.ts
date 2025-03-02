export type LLMProvider = 'openai' | 'anthropic';

// These are just for type definitions - the actual model lists are defined in models.ts
export type OpenAIModel = string;
export type AnthropicModel = string;

export type LLMModel = string; // Any model name

export type LLMConfigStorage = {
  provider: LLMProvider;
  model: LLMModel;
};

export type LLMConfig = LLMConfigStorage & {
  apiKey: string;
};

export type CommitConfig = {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  isBreaking?: boolean;
  breakingBody?: string;
  issues?: string[];
  references?: string[];
};

export type LLMPromptContext = {
  typeEnum?: string[];
  typeDescription?: string;
  typeDescriptions?: Record<string, { description: string; emoji?: string; title?: string }>;
  caseFnOptions?: string[];
  headerMaxLength?: number;
  headerMinLength?: number;
  scopeDescription?: string;
  subject: {
    description?: string;
    case?: string[];
    maxLength?: number;
    minLength?: number;
  };
  body?: {
    description?: string;
    maxLength?: number;
    minLength?: number;
    leadingBlank?: boolean;
  };
  files?: string;
  diff?: string;
};