/* eslint-disable @elsikora-typescript/naming-convention */
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

// eslint-disable-next-line @elsikora-sonar/redundant-type-aliases
export type LLMModel = string; // Any model name

export type LLMPromptContext = {
	body?: {
		description?: string;
		fullStop?: {
			required: boolean;
			value: string;
		};
		leadingBlank?: boolean;
		maxLength?: number;
		maxLineLength?: number;
		minLength?: number;
	};
	caseFnOptions?: Array<string>;
	diff?: string;
	files?: string;
	footerLeadingBlank?: boolean;
	footerMaxLineLength?: number;
	headerCase?: Array<string>;
	headerFullStop?: {
		required: boolean;
		value: string;
	};
	headerMaxLength?: number;
	headerMinLength?: number;
	scopeCase?: Array<string>;
	scopeDescription?: string;
	scopeEmpty?: boolean;
	scopeMaxLength?: number;
	subject: {
		case?: Array<string>;
		description?: string;
		empty?: boolean;
		fullStop?: {
			required: boolean;
			value: string;
		};
		maxLength?: number;
		minLength?: number;
	};
	typeCase?: Array<string>;
	typeDescription?: string;
	typeDescriptions?: Record<string, { description: string; emoji?: string; title?: string }>;
	typeEmpty?: boolean;
	typeEnum?: Array<string>;
};

export type LLMProvider = "anthropic" | "openai";
