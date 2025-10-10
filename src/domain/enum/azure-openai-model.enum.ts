/**
 * Enum representing the available Azure OpenAI deployment models
 */
export enum EAzureOpenAIModel {
	// GPT-3.5 Series
	GPT_35_TURBO = "gpt-35-turbo",
	GPT_35_TURBO_16K = "gpt-35-turbo-16k",
	GPT_4_1_MINI_2024_12_17 = "gpt-4.1-mini-2024-12-17",

	GPT_4_1_PREVIEW_2024_12_17 = "gpt-4.1-preview-2024-12-17",
	// GPT-4.1 Series (Latest 2025)
	GPT_4_1_TURBO_2024_12_17 = "gpt-4.1-turbo-2024-12-17",

	// GPT-4 Turbo Series
	GPT_4_TURBO = "gpt-4-turbo",
	GPT_4_TURBO_2024_04_09 = "gpt-4-turbo-2024-04-09",
	GPT_4O_2024_08_06 = "gpt-4o-2024-08-06",

	// GPT-4o Series
	GPT_4O_2024_11_20 = "gpt-4o-2024-11-20",
	GPT_4O_MINI_2024_07_18 = "gpt-4o-mini-2024-07-18",

	O3_2024_12_17 = "o3-2024-12-17",
	// O-series reasoning models
	O4_MINI_2024_12_17 = "o4-mini-2024-12-17",
}
