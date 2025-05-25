import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ILLMPromptContext, ILLMService } from "../interface/llm-service.interface.js";

/**
 * Use case for generating commit messages using LLM
 */
export class GenerateCommitMessageUseCase {
	private readonly llmServices: ILLMService[];

	constructor(llmServices: ILLMService[]) {
		this.llmServices = llmServices;
	}

	/**
	 * Execute the use case to generate a commit message
	 * @param context - The context for generating the commit message
	 * @param configuration - The LLM configuration
	 * @param onRetry - Optional callback for retry notifications
	 * @returns Promise resolving to the generated commit message
	 * @throws Error if no suitable LLM service is found or max retries exceeded
	 */
	async execute(
		context: ILLMPromptContext, 
		configuration: LLMConfiguration,
		onRetry?: (attempt: number, maxRetries: number, error: Error) => void
	): Promise<CommitMessage> {
		// Find a suitable LLM service
		const service = this.llmServices.find((s) => s.supports(configuration));

		if (!service) {
			throw new Error(`No LLM service found for provider: ${configuration.getProvider()}`);
		}

		// Get retry count from configuration
		const maxRetries = configuration.getMaxRetries();
		let lastError: Error | null = null;

		// Attempt to generate with retries
		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				// Generate the commit message
				return await service.generateCommitMessage(context, configuration);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				
				// Call retry callback if provided and not last attempt
				if (attempt < maxRetries - 1) {
					if (onRetry) {
						onRetry(attempt + 1, maxRetries, lastError);
					}
					
					// Add a small delay between retries
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}

		// All retries exhausted
		throw new Error(`Failed to generate commit message after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
	}
} 