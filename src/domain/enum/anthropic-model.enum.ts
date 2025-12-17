/**
 * Enum representing available Anthropic Claude models
 */
export enum EAnthropicModel {
	// Claude 3.5 series
	CLAUDE_3_5_HAIKU = "claude-3-5-haiku-latest",
	CLAUDE_3_5_HAIKU_DATED = "claude-3-5-haiku-20241022",
	CLAUDE_3_5_SONNET = "claude-3-5-sonnet-latest",
	CLAUDE_3_5_SONNET_V1 = "claude-3-5-sonnet-20240620",
	CLAUDE_3_5_SONNET_V2 = "claude-3-5-sonnet-20241022",
	// Claude 3.7 series
	CLAUDE_3_7_SONNET = "claude-3-7-sonnet-latest",

	CLAUDE_3_7_SONNET_DATED = "claude-3-7-sonnet-20250219",
	// Claude 3 series (Legacy)
	CLAUDE_3_HAIKU = "claude-3-haiku-20240307",

	CLAUDE_3_OPUS = "claude-3-opus-latest",
	CLAUDE_3_OPUS_DATED = "claude-3-opus-20240229",

	CLAUDE_3_SONNET = "claude-3-sonnet-20240229",
	// Claude 4.5 series (Latest models)
	CLAUDE_HAIKU_4_5 = "claude-haiku-4-5",
	CLAUDE_HAIKU_4_5_DATED = "claude-haiku-4-5-20251001",
	// Claude 4 series
	CLAUDE_OPUS_4 = "claude-opus-4-20250514",
	CLAUDE_OPUS_4_5 = "claude-opus-4-5",

	CLAUDE_OPUS_4_5_DATED = "claude-opus-4-5-20251101",
	CLAUDE_SONNET_4 = "claude-sonnet-4-20250514",
	CLAUDE_SONNET_4_5 = "claude-sonnet-4-5",
	CLAUDE_SONNET_4_5_DATED = "claude-sonnet-4-5-20250929",
}
