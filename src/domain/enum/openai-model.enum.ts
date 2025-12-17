/**
 * Enum representing available OpenAI text models
 */
export enum EOpenAIModel {
	// GPT-3.5 Turbo (Legacy)
	GPT_35_TURBO = "gpt-3.5-turbo",
	// GPT-4 Turbo
	GPT_4_TURBO = "gpt-4-turbo",

	GPT_4_TURBO_PREVIEW = "gpt-4-turbo-preview",
	// GPT-4o series
	GPT_4O = "gpt-4o",
	GPT_4O_MINI = "gpt-4o-mini",
	// GPT-5 series
	GPT_5 = "gpt-5",

	// GPT-5.1 series
	GPT_5_1 = "gpt-5.1",
	GPT_5_1_CODEX = "gpt-5.1-codex",
	GPT_5_1_CODEX_MAX = "gpt-5.1-codex-max",
	GPT_5_1_CODEX_MINI = "gpt-5.1-codex-mini",
	// GPT-5.2 series (Latest flagship models)
	GPT_5_2 = "gpt-5.2",

	GPT_5_2_PRO = "gpt-5.2-pro",

	GPT_5_CODEX = "gpt-5-codex",
	GPT_5_MINI = "gpt-5-mini",
	GPT_5_NANO = "gpt-5-nano",

	GPT_5_PRO = "gpt-5-pro",
	// O1 series (Legacy reasoning models)
	O1 = "o1",
	O1_MINI = "o1-mini",
	O1_PREVIEW = "o1-preview",

	O1_PRO = "o1-pro",
	// O3 series (Reasoning models)
	O3 = "o3",

	O3_MINI = "o3-mini",
	O3_PRO = "o3-pro",

	// O4 series (Reasoning models)
	O4_MINI = "o4-mini",
}
