/**
 * Enum representing popular Ollama models
 * Note: Ollama supports any model available in the Ollama library
 * Users can also specify custom model names
 */
export enum EOllamaModel {
	CODELLAMA = "codellama",

	// Custom model placeholder
	CUSTOM = "custom",
	// Coding models
	DEEPSEEK_CODER = "deepseek-coder",
	GEMMA = "gemma",
	// Google Gemma
	GEMMA2 = "gemma2",

	LLAMA2 = "llama2",
	LLAMA3 = "llama3",

	LLAMA3_1 = "llama3.1",
	// Llama series
	LLAMA3_2 = "llama3.2",

	MISTRAL = "mistral",
	// Mistral series
	MIXTRAL = "mixtral",

	NEURAL_CHAT = "neural-chat",
	PHI = "phi",

	// Other models
	PHI3 = "phi3",
	QWEN2 = "qwen2",
	// Qwen series
	QWEN2_5 = "qwen2.5",
	STARLING_LM = "starling-lm",
}
