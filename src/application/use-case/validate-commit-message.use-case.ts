import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitValidator, ICommitValidationResult } from "../interface/commit-validator.interface.js";
import type { ILLMPromptContext } from "../interface/llm-service.interface.js";

/**
 * Use case for validating and fixing commit messages
 */
export class ValidateCommitMessageUseCase {
	private readonly validator: ICommitValidator;
	private readonly defaultMaxRetries: number;

	constructor(validator: ICommitValidator, defaultMaxRetries: number = 3) {
		this.validator = validator;
		this.defaultMaxRetries = defaultMaxRetries;
	}

	/**
	 * Execute the use case to validate and optionally fix a commit message
	 * @param message - The commit message to validate
	 * @param attemptFix - Whether to attempt fixing validation errors
	 * @param maxRetries - Override for max retry attempts (uses default if not provided)
	 * @param context - Optional original context (diff, files, etc.) for better fixing
	 * @returns Promise resolving to the validated/fixed message or null if unfixable
	 */
	async execute(
		message: CommitMessage, 
		attemptFix: boolean = true,
		maxRetries?: number,
		context?: ILLMPromptContext
	): Promise<CommitMessage | null> {
		const retryLimit = maxRetries ?? this.defaultMaxRetries;
		let currentMessage = message;
		let attempts = 0;

		while (attempts < retryLimit) {
			const validationResult = await this.validator.validate(currentMessage);

			if (validationResult.isValid) {
				if (attempts > 0) {
					console.log(`Validation passed after ${attempts} fix attempts`);
				}
				return currentMessage;
			}

			// Log validation errors
			if (attempts === 0) {
				console.log(`Initial validation failed with ${validationResult.errors?.length || 0} errors:`);
				validationResult.errors?.forEach(error => console.log(`  - ${error}`));
			}

			if (!attemptFix) {
				return null;
			}

			attempts++;

			// If we've exhausted all attempts, return null
			if (attempts >= retryLimit) {
				console.log(`Validation failed after ${attempts} attempts`);
				return null;
			}

			// Attempt to fix the message with context
			console.log(`Attempting to fix validation errors (attempt ${attempts}/${retryLimit})...`);
			const fixedMessage = await this.validator.fix(currentMessage, validationResult, context);

			if (!fixedMessage) {
				console.log(`Fix attempt ${attempts} failed, ${attempts < retryLimit - 1 ? 'retrying...' : 'no more retries left'}`);
				// Continue to next iteration to try again
				continue;
			}

			console.log(`Fix attempt ${attempts} produced a new message, validating...`);
			// Update current message for next validation attempt
			currentMessage = fixedMessage;
		}

		return null;
	}

	/**
	 * Validate a commit message without attempting to fix it
	 * @param message - The commit message to validate
	 * @returns Promise resolving to the validation result
	 */
	async validate(message: CommitMessage): Promise<ICommitValidationResult> {
		return await this.validator.validate(message);
	}
} 