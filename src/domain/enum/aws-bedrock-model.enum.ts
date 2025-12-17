/**
 * Enum representing the available AWS Bedrock models
 */
export enum EAWSBedrockModel {
	// Anthropic Claude 3.5 Models
	CLAUDE_3_5_HAIKU = "anthropic.claude-3-5-haiku-20241022-v1:0",
	CLAUDE_3_5_SONNET = "anthropic.claude-3-5-sonnet-20240620-v1:0",
	CLAUDE_3_5_SONNET_V2 = "anthropic.claude-3-5-sonnet-20241022-v2:0",

	// Anthropic Claude 3 Models (Legacy)
	CLAUDE_3_HAIKU = "anthropic.claude-3-haiku-20240307-v1:0",
	CLAUDE_3_OPUS = "anthropic.claude-3-opus-20240229-v1:0",

	CLAUDE_3_SONNET = "anthropic.claude-3-sonnet-20240229-v1:0",
	// Anthropic Claude 4.5 Models
	CLAUDE_HAIKU_4_5 = "anthropic.claude-haiku-4-5-20251001-v1:0",
	// Anthropic Claude 4 Models
	CLAUDE_OPUS_4 = "anthropic.claude-opus-4-20250514-v1:0",

	CLAUDE_OPUS_4_5 = "anthropic.claude-opus-4-5-20251101-v1:0",
	CLAUDE_SONNET_4 = "anthropic.claude-sonnet-4-20250514-v1:0",
	CLAUDE_SONNET_4_5 = "anthropic.claude-sonnet-4-5-20250929-v1:0",

	// Cohere Models
	COMMAND_R = "cohere.command-r-v1:0",
	COMMAND_R_PLUS = "cohere.command-r-plus-v1:0",

	// DeepSeek Models
	DEEPSEEK_R1 = "us.deepseek.deepseek-r1:0",

	// Meta Llama 3.1 Models
	LLAMA_3_1_405B = "us.meta.llama3-1-405b-instruct-v1:0",
	LLAMA_3_1_70B = "us.meta.llama3-1-70b-instruct-v1:0",
	LLAMA_3_1_8B = "us.meta.llama3-1-8b-instruct-v1:0",
	// Meta Llama 3.2 Models
	LLAMA_3_2_11B = "us.meta.llama3-2-11b-instruct-v1:0",

	LLAMA_3_2_1B = "us.meta.llama3-2-1b-instruct-v1:0",
	LLAMA_3_2_3B = "us.meta.llama3-2-3b-instruct-v1:0",
	LLAMA_3_2_90B = "us.meta.llama3-2-90b-instruct-v1:0",

	// Mistral Models
	MISTRAL_LARGE_2_24_07 = "mistral.mistral-large-2407-v1:0",
	MISTRAL_LARGE_2_24_11 = "mistral.mistral-large-2411-v1:0",
	MISTRAL_SMALL = "mistral.mistral-small-2410-v1:0",

	// Amazon Nova Models
	NOVA_LITE = "us.amazon.nova-lite-v1:0",
	NOVA_MICRO = "us.amazon.nova-micro-v1:0",
	NOVA_PRO = "us.amazon.nova-pro-v1:0",

	// Amazon Titan Models
	TITAN_TEXT_EXPRESS = "amazon.titan-text-express-v1:0",
	TITAN_TEXT_LITE = "amazon.titan-text-lite-v1:0",
	TITAN_TEXT_PREMIER = "amazon.titan-text-premier-v1:0",
}
