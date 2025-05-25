/**
 * Enum representing the available Google (Vertex AI/Gemini) models
 */
export enum EGoogleModel {
	// Gemini 1.0 Series
	GEMINI_1_0_PRO = "gemini-1.0-pro",

	// Gemini 1.5 Series
	GEMINI_1_5_FLASH = "gemini-1.5-flash",
	GEMINI_1_5_FLASH_8B = "gemini-1.5-flash-8b",
	GEMINI_1_5_PRO = "gemini-1.5-pro",

	// Gemini 2.0 Series
	GEMINI_2_0_FLASH_EXP = "gemini-2.0-flash-exp",

	// Gemini 2.5 Series (Latest 2025)
	GEMINI_2_5_FLASH = "gemini-2.5-flash",
	GEMINI_2_5_PRO = "gemini-2.5-pro",

	GEMMA_3_12B = "gemma-3-12b",
	// Gemma open models (for Vertex AI deployments)
	GEMMA_3_1B = "gemma-3-1b",
	GEMMA_3_27B = "gemma-3-27b",
	GEMMA_3_4B = "gemma-3-4b",
}
