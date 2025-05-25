import type { ECommitMode } from "../../domain/enum/commit-mode.enum.js";
import type { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";

/**
 * Main configuration interface
 */
export interface IConfig {
	/**
	 * Number of retries for LLM generation
	 */
	maxRetries?: number;

	/**
	 * Commit mode (auto, manual)
	 */
	mode: ECommitMode;

	/**
	 * Model to use
	 */
	model?: string;

	/**
	 * LLM provider (openai, anthropic)
	 */
	provider: ELLMProvider;

	/**
	 * Number of retries for validation fixes
	 */
	validationMaxRetries?: number;
}
