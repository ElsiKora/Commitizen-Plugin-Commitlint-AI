/**
 * Enum representing available Anthropic Claude models
 */
export enum EAnthropicModel {
	// Claude 4 series (Latest 2025 models)
	CLAUDE_OPUS_4 = "claude-opus-4-20250514", // Most capable and intelligent model
	CLAUDE_SONNET_4 = "claude-sonnet-4-20250514", // High-performance model
	
	// Claude 3.7 series
	CLAUDE_3_7_SONNET = "claude-3-7-sonnet-latest", // High-performance with extended thinking
	CLAUDE_3_7_SONNET_DATED = "claude-3-7-sonnet-20250219",
	
	// Claude 3.5 series
	CLAUDE_3_5_SONNET = "claude-3-5-sonnet-latest", // Previous intelligent model
	CLAUDE_3_5_SONNET_V2 = "claude-3-5-sonnet-20241022", // Upgraded version
	CLAUDE_3_5_SONNET_V1 = "claude-3-5-sonnet-20240620", // Previous version
	CLAUDE_3_5_HAIKU = "claude-3-5-haiku-latest", // Fastest model
	CLAUDE_3_5_HAIKU_DATED = "claude-3-5-haiku-20241022",
	
	// Claude 3 series
	CLAUDE_3_OPUS = "claude-3-opus-latest", // Powerful model for complex tasks
	CLAUDE_3_OPUS_DATED = "claude-3-opus-20240229",
	CLAUDE_3_SONNET = "claude-3-sonnet-20240229",
	CLAUDE_3_HAIKU = "claude-3-haiku-20240307", // Fast and compact
} 