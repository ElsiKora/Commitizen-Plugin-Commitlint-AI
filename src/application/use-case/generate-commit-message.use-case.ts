import type { ILlmPromptContext, ILlmService } from "@application/interface/llm-service.interface";
import type { CommitMessage } from "@domain/entity/commit-message.entity";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";

import { NUMERIC_CONSTANT } from "@domain/constant/numeric.constant";

/**
 * Use case for generating commit messages
 */
export class GenerateCommitMessageUseCase {
	private readonly LLM_SERVICE: ILlmService;

	constructor(llmService: ILlmService) {
		this.LLM_SERVICE = llmService;
	}

	/**
	 * Execute the commit message generation
	 * @param {ILlmPromptContext} context - The context for generating the commit message
	 * @param {LLMConfiguration} configuration - The LLM configuration
	 * @param {(attempt: number, maxRetries: number, error: Error) => void} onRetry - Callback function called on retry attempts
	 * @returns {Promise<CommitMessage>} Promise resolving to the generated commit message
	 */
	async execute(context: ILlmPromptContext, configuration: LLMConfiguration, onRetry?: (attempt: number, maxRetries: number, error: Error) => void): Promise<CommitMessage> {
		const maxRetries: number = configuration.getMaxRetries();

		// Try to generate with retries
		for (let attempt: number = 1; attempt <= maxRetries; attempt++) {
			try {
				return await this.LLM_SERVICE.generateCommitMessage(context, configuration);
			} catch (error) {
				if (attempt === maxRetries) {
					throw new Error(`Failed to generate commit message after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
				}

				// Notify about retry
				if (onRetry) {
					onRetry(attempt, maxRetries, error as Error);
				}

				// Wait before retrying
				await new Promise<void>((resolve: () => void) => setTimeout(resolve, NUMERIC_CONSTANT.RETRY_DELAY_MS));
			}
		}

		// This should never be reached due to the throw in the loop
		throw new Error(`Failed to generate commit message after ${maxRetries} attempts`);
	}
}
