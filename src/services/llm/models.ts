/**
 * Centralized model definitions for LLM providers
 */

// OpenAI Models
export const OPENAI_MODELS: {
	GPT35_TURBO: string;
	GPT4: string;
	GPT4_TURBO: string;
	GPT45_PREVIEW: string;
	GPT4O: string;
	GPT4O_MINI: string;
	O1: string;
	O1_MINI: string;
	O3_MINI: string;
} = {
	// GPT-3.5 models
	GPT35_TURBO: "gpt-3.5-turbo",
	// Legacy GPT-4 models
	GPT4: "gpt-4",

	GPT4_TURBO: "gpt-4-turbo",
	// GPT-4.5 Preview
	GPT45_PREVIEW: "gpt-4.5-preview",
	// GPT-4o Family
	GPT4O: "gpt-4o",

	GPT4O_MINI: "gpt-4o-mini",

	// O1 Family (Next-gen models)
	O1: "o1",
	O1_MINI: "o1-mini",

	O3_MINI: "o3-mini",
};

// Anthropic Models
export const ANTHROPIC_MODELS: {
	CLAUDE_3_HAIKU: string;
	CLAUDE_3_OPUS: string;
	CLAUDE_3_SONNET: string;
	CLAUDE_35_HAIKU: string;
	CLAUDE_35_SONNET: string;
	CLAUDE_37_SONNET: string;
	CLAUDE_4_OPUS: string;
	CLAUDE_4_SONNET: string;
} = {
	CLAUDE_3_HAIKU: "claude-3-haiku-latest",

	// Claude 3 Family
	CLAUDE_3_OPUS: "claude-3-opus-latest",
	CLAUDE_3_SONNET: "claude-3-sonnet-latest",
	CLAUDE_35_HAIKU: "claude-3-5-haiku-latest",
	// Claude 3.5 Family
	CLAUDE_35_SONNET: "claude-3-5-sonnet-latest",
	// Claude 3.7 Family
	CLAUDE_37_SONNET: "claude-3-7-sonnet-latest",
	CLAUDE_4_OPUS: "claude-opus-4-20250514",
	// Claude 4 Family
	CLAUDE_4_SONNET: "claude-sonnet-4-20250514",
};

// Model choices for OpenAI UI
export const OPENAI_MODEL_CHOICES: Array<{
	name: string;
	title: string;
	value: string;
}> = [
	{ name: "GPT-4o", title: "GPT-4o", value: OPENAI_MODELS.GPT4O },
	{ name: "GPT-4o Mini", title: "GPT-4o Mini", value: OPENAI_MODELS.GPT4O_MINI },
	{ name: "O1", title: "O1", value: OPENAI_MODELS.O1 },
	{ name: "O1 Mini", title: "O1 Mini", value: OPENAI_MODELS.O1_MINI },
	{ name: "O3 Mini", title: "O3 Mini", value: OPENAI_MODELS.O3_MINI },
	{ name: "GPT-4.5 Preview", title: "GPT-4.5 Preview", value: OPENAI_MODELS.GPT45_PREVIEW },
	{ name: "GPT-4 Turbo", title: "GPT-4 Turbo", value: OPENAI_MODELS.GPT4_TURBO },
	{ name: "GPT-4", title: "GPT-4", value: OPENAI_MODELS.GPT4 },
	{ name: "GPT-3.5 Turbo", title: "GPT-3.5 Turbo", value: OPENAI_MODELS.GPT35_TURBO },
	{ name: "Custom Model...", title: "Custom Model...", value: "custom" },
];

// Model choices for Anthropic UI
export const ANTHROPIC_MODEL_CHOICES: Array<{
	name: string;
	title: string;
	value: string;
}> = [
	{ name: "Claude 4 Sonnet", title: "Claude 4 Sonnet", value: ANTHROPIC_MODELS.CLAUDE_4_SONNET },
	{ name: "Claude 4 Opus", title: "Claude 4 Opus", value: ANTHROPIC_MODELS.CLAUDE_4_OPUS },
	{ name: "Claude 3.7 Sonnet", title: "Claude 3.7 Sonnet", value: ANTHROPIC_MODELS.CLAUDE_37_SONNET },
	{ name: "Claude 3.5 Sonnet", title: "Claude 3.5 Sonnet", value: ANTHROPIC_MODELS.CLAUDE_35_SONNET },
	{ name: "Claude 3.5 Haiku", title: "Claude 3.5 Haiku", value: ANTHROPIC_MODELS.CLAUDE_35_HAIKU },
	{ name: "Claude 3 Opus", title: "Claude 3 Opus", value: ANTHROPIC_MODELS.CLAUDE_3_OPUS },
	{ name: "Claude 3 Sonnet", title: "Claude 3 Sonnet", value: ANTHROPIC_MODELS.CLAUDE_3_SONNET },
	{ name: "Claude 3 Haiku", title: "Claude 3 Haiku", value: ANTHROPIC_MODELS.CLAUDE_3_HAIKU },
	{ name: "Custom Model...", title: "Custom Model...", value: "custom" },
];

export function getAnthropicModels(): Array<string> {
	return Object.values(ANTHROPIC_MODELS);
}

// Functions to get model lists
export function getOpenAIModels(): Array<string> {
	return Object.values(OPENAI_MODELS);
}
