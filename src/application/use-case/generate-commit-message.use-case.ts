import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ILlmPromptContext, ILlmService } from "../interface/llm-service.interface.js";

import { RETRY_DELAY_MS } from "../../domain/constant/numeric.constant.js";

/**
 * Use case for generating commit messages
 */
export class GenerateCommitMessageUseCase {
	private readonly LLM_SERVICES: Array<ILlmService>;

	constructor(llmServices: Array<ILlmService>) {
		this.LLM_SERVICES = llmServices;
	}

	/**
	 * Execute the commit message generation
	 * @param {ILlmPromptContext} context - The context for generating the commit message
	 * @param {LLMConfiguration} configuration - The LLM configuration
	 * @param {(attempt: number, maxRetries: number, error: Error) => void} onRetry - Callback function called on retry attempts
	 * @returns {Promise<CommitMessage>} Promise resolving to the generated commit message
	 */
	async execute(context: ILlmPromptContext, configuration: LLMConfiguration, onRetry?: (attempt: number, maxRetries: number, error: Error) => void): Promise<CommitMessage> {
		const service: ILlmService | undefined = this.LLM_SERVICES.find((s: ILlmService) => s.supports(configuration));

		if (!service) {
			throw new Error(`No LLM service found for provider: ${configuration.getProvider()}`);
		}

		const maxRetries: number = configuration.getMaxRetries();

		// Try to generate with retries
		for (let attempt: number = 1; attempt <= maxRetries; attempt++) {
			try {
				return await service.generateCommitMessage(context, configuration);
			} catch (error) {
				if (attempt === maxRetries) {
					throw new Error(`Failed to generate commit message after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
				}

				// Notify about retry
				if (onRetry) {
					onRetry(attempt, maxRetries, error as Error);
				}

				// Wait before retrying
				await new Promise<void>((resolve: () => void) => setTimeout(resolve, RETRY_DELAY_MS));
			}
		}

		// This should never be reached due to the throw in the loop
		throw new Error(`Failed to generate commit message after ${maxRetries} attempts`);
	}
}
