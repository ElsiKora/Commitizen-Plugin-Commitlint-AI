import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

/**
 * Context for generating commit messages
 */
export interface ILlmPromptContext {
	body?: {
		description?: string;
	};
	diff?: string;
	files?: string;
	rules?: Record<string, unknown>;
	scopeDescription?: string;
	subject: {
		description?: string;
		maxLength?: number;
		minLength?: number;
	};
	typeDescription?: string;
	typeDescriptions?: Record<string, { description: string; emoji?: string }>;
	typeEnum?: Array<string>;
}

/**
 * Interface for LLM services
 */
export interface ILlmService {
	/**
	 * Generate a commit message using the LLM
	 * @param context - The context for generating the commit message
	 * @param configuration - The LLM configuration
	 * @returns Promise resolving to the generated commit message
	 */
	generateCommitMessage(context: ILlmPromptContext, configuration: LLMConfiguration): Promise<CommitMessage>;

	/**
	 * Check if the service supports the given configuration
	 * @param configuration - The LLM configuration to check
	 * @returns True if the service supports the configuration
	 */
	supports(configuration: LLMConfiguration): boolean;
}
