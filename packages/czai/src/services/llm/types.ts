export type LLMProvider = 'openai' | 'anthropic';

export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4' | 'gpt-4-turbo';
export type AnthropicModel = 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';

export type LLMModel = OpenAIModel | AnthropicModel;

export type LLMConfig = {
  provider: LLMProvider;
  model: LLMModel;
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