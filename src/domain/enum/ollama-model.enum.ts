/**
 * Enum representing popular Ollama models
 * Note: Ollama supports any model available in the Ollama library
 * Users can also specify custom model names
 */
export enum EOllamaModel {
	CODELLAMA = "codellama",
	// Custom model placeholder
	CUSTOM = "custom",
	DEEPSEEK_CODER = "deepseek-coder",
	GEMMA = "gemma",
	GEMMA2 = "gemma2",
	LLAMA2 = "llama2",
	LLAMA3 = "llama3",
	LLAMA3_1 = "llama3.1",
	// Popular Open-Source Models
	LLAMA3_2 = "llama3.2",
	MISTRAL = "mistral",
	MIXTRAL = "mixtral",
	NEURAL_CHAT = "neural-chat",
	PHI = "phi",
	PHI3 = "phi3",
	QWEN2 = "qwen2",
	QWEN2_5 = "qwen2.5",

	STARLING_LM = "starling-lm",
}
