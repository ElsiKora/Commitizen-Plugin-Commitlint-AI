export type AnthropicModel = string;

export type CommitConfig = {
	body?: string;
	breakingBody?: string;
	isBreaking?: boolean;
	issues?: Array<string>;
	references?: Array<string>;
	scope?: string;
	subject: string;
	type: string;
};
export type CommitMode = "auto" | "manual";

export type LLMConfig = {
	apiKey: string;
} & LLMConfigStorage;

export type LLMConfigStorage = {
	mode?: CommitMode; // Default is 'auto' if not specified
	model: LLMModel;
	provider: LLMProvider;
};

export type LLMModel = string; // Any model name

export type LLMPromptContext = {
	body?: {
		description?: string;
		leadingBlank?: boolean;
		maxLength?: number;
		minLength?: number;
	};
	caseFnOptions?: Array<string>;
	diff?: string;
	files?: string;
	headerMaxLength?: number;
	headerMinLength?: number;
	scopeDescription?: string;
	subject: {
		case?: Array<string>;
		description?: string;
		maxLength?: number;
		minLength?: number;
	};
	typeDescription?: string;
	typeDescriptions?: Record<string, { description: string; emoji?: string; title?: string }>;
	typeEnum?: Array<string>;
};

export type LLMProvider = "anthropic" | "openai";

// These are just for type definitions - the actual model lists are defined in models.ts
export type OpenAIModel = string;
