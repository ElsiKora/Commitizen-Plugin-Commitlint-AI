import type { ECommitMode } from "../../domain/enum/commit-mode.enum.js";
import type { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";

/**
 * Main configuration interface
 */
export interface IConfig {
	/**
	 * LLM provider (openai, anthropic)
	 */
	provider: ELLMProvider;
	
	/**
	 * Commit mode (auto, manual)
	 */
	mode: ECommitMode;
	
	/**
	 * Model to use
	 */
	model?: string;
	
	/**
	 * Number of retries for LLM generation
	 */
	maxRetries?: number;
	
	/**
	 * Number of retries for validation fixes
	 */
	validationMaxRetries?: number;
} 