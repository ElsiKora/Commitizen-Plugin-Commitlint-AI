/**
 * Enum representing the available Azure OpenAI deployment models
 * Note: Azure OpenAI model names follow Azure's deployment naming convention
 */
export enum EAzureOpenAIModel {
	// GPT-3.5 Series (Legacy)
	GPT_35_TURBO = "gpt-35-turbo",
	GPT_35_TURBO_16K = "gpt-35-turbo-16k",

	// GPT-4 Turbo Series
	GPT_4_TURBO = "gpt-4-turbo",
	GPT_4_TURBO_2024_04_09 = "gpt-4-turbo-2024-04-09",

	// GPT-4o Series
	GPT_4O = "gpt-4o",
	GPT_4O_2024_08_06 = "gpt-4o-2024-08-06",
	GPT_4O_2024_11_20 = "gpt-4o-2024-11-20",

	GPT_4O_MINI = "gpt-4o-mini",

	GPT_4O_MINI_2024_07_18 = "gpt-4o-mini-2024-07-18",
	// GPT-5 Series
	GPT_5 = "gpt-5",

	// GPT-5.1 Series
	GPT_5_1 = "gpt-5.1",
	GPT_5_1_CODEX = "gpt-5.1-codex",

	// GPT-5.2 Series
	GPT_5_2 = "gpt-5.2",
	GPT_5_2_PRO = "gpt-5.2-pro",
	GPT_5_MINI = "gpt-5-mini",
	GPT_5_NANO = "gpt-5-nano",
	// O1 Series (Legacy reasoning models)
	O1 = "o1",

	O1_MINI = "o1-mini",
	// O3 Series (Reasoning models)
	O3 = "o3",

	O3_MINI = "o3-mini",
	// O4 Series (Reasoning models)
	O4_MINI = "o4-mini",
}
