import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

/**
 * Context for generating commit messages
 */
export interface ILLMPromptContext {
	typeEnum?: string[];
	typeDescriptions?: Record<string, { description: string; emoji?: string }>;
	typeDescription?: string;
	scopeDescription?: string;
	subject: {
		description?: string;
		minLength?: number;
		maxLength?: number;
	};
	body?: {
		description?: string;
	};
	rules?: Record<string, any>;
	diff?: string;
	files?: string;
}

/**
 * Interface for LLM services
 */
export interface ILLMService {
	/**
	 * Generate a commit message using the LLM
	 * @param context - The context for generating the commit message
	 * @param configuration - The LLM configuration
	 * @returns Promise resolving to the generated commit message
	 */
	generateCommitMessage(context: ILLMPromptContext, configuration: LLMConfiguration): Promise<CommitMessage>;

	/**
	 * Check if the service supports the given configuration
	 * @param configuration - The LLM configuration to check
	 * @returns True if the service supports the configuration
	 */
	supports(configuration: LLMConfiguration): boolean;
} 