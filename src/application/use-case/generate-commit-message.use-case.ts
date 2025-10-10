import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ICommitValidationResult, ICommitValidator } from "../interface/commit-validator.interface.js";
import type { ILlmPromptContext, ILlmService } from "../interface/llm-service.interface.js";

import { RETRY_DELAY_MS } from "../../domain/constant/numeric.constant.js";

/**
 * Use case for generating commit messages with integrated validation
 */
export class GenerateCommitMessageUseCase {
	private readonly LLM_SERVICES: Array<ILlmService>;

	private readonly VALIDATOR: ICommitValidator;

	constructor(llmServices: Array<ILlmService>, validator: ICommitValidator) {
		this.LLM_SERVICES = llmServices;
		this.VALIDATOR = validator;
	}

	/**
	 * Execute the commit message generation with validation loop
	 * @param {ILlmPromptContext} context - The context for generating the commit message
	 * @param {LLMConfiguration} configuration - The LLM configuration
	 * @param {(attempt: number, maxRetries: number, error: Error) => void} onRetry - Callback function called on retry attempts
	 * @returns {Promise<CommitMessage>} Promise resolving to the generated and validated commit message
	 */
	async execute(context: ILlmPromptContext, configuration: LLMConfiguration, onRetry?: (attempt: number, maxRetries: number, error: Error) => void): Promise<CommitMessage> {
		const service: ILlmService | undefined = this.LLM_SERVICES.find((s: ILlmService) => s.supports(configuration));

		if (!service) {
			throw new Error(`No LLM service found for provider: ${configuration.getProvider()}`);
		}

		const maxRetries: number = configuration.getMaxRetries();

		for (let attempt: number = 1; attempt <= maxRetries; attempt++) {
			try {
				const generatedMessage: CommitMessage = await service.generateCommitMessage(context, configuration);

				const validationResult: ICommitValidationResult = await this.VALIDATOR.validate(generatedMessage);

				if (validationResult.isValid) {
					return generatedMessage;
				}

				if (attempt === maxRetries) {
					throw new Error(`Failed to generate valid commit message after ${maxRetries} attempts. Last validation errors: ${validationResult.errors?.join(", ")}`);
				}

				if (onRetry) {
					const validationError: Error = new Error(`Validation failed: ${validationResult.errors?.join(", ")}`);
					onRetry(attempt, maxRetries, validationError);
				}

				const enrichedContext: ILlmPromptContext = {
					...context,
					rules: {
						...(typeof context.rules === "object" && !Array.isArray(context.rules) ? context.rules : {}),
						instructions: "The previous commit message had validation errors. Generate a new commit message that fixes these errors while maintaining the same meaning.",
						previousAttempt: generatedMessage.toString(),
						validationErrors: validationResult.errors ?? [],
					},
				};

				context = enrichedContext;

				await new Promise<void>((resolve: () => void) => setTimeout(resolve, RETRY_DELAY_MS));
			} catch (error) {
				if (attempt === maxRetries) {
					throw new Error(`Failed to generate commit message after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
				}

				if (onRetry) {
					onRetry(attempt, maxRetries, error as Error);
				}

				await new Promise<void>((resolve: () => void) => setTimeout(resolve, RETRY_DELAY_MS));
			}
		}

		throw new Error(`Failed to generate commit message after ${maxRetries} attempts`);
	}
}
