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

	// Gemini 2.0 Series (Experimental)
	GEMINI_2_0_FLASH_EXP = "gemini-2.0-flash-exp",

	// Gemma open models (for Vertex AI deployments)
	GEMMA_2_27B = "gemma-2-27b",
	GEMMA_2_2B = "gemma-2-2b",
	GEMMA_2_9B = "gemma-2-9b",
}
