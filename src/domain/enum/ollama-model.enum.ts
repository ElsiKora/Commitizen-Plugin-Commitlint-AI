/**
 * Enum representing popular Ollama text models
 * Note: Ollama supports any model available in the Ollama library
 * Users can also specify custom model names
 */
export enum EOllamaModel {
	// Code-focused models
	CODELLAMA = "codellama",
	// Custom model placeholder
	CUSTOM = "custom",
	// Gemma models (Google)
	GEMMA3 = "gemma3",

	// Llama models (Meta)
	LLAMA3_1 = "llama3.1",

	LLAMA3_2 = "llama3.2",

	LLAMA3_3 = "llama3.3",
	LLAMA4 = "llama4",
	// Mistral models
	MIXTRAL = "mixtral",
	// Phi models (Microsoft)
	PHI3 = "phi3",

	PHI4 = "phi4",

	PHI4_MINI = "phi4-mini",
	// Qwen models (Alibaba)
	QWEN2_5 = "qwen2.5",
	QWEN2_5_CODER = "qwen2.5-coder",

	QWEN3 = "qwen3",
	QWEN3_CODER = "qwen3-coder",
}
