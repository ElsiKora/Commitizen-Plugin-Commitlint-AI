import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitValidationResult, ICommitValidator } from "../interface/commit-validator.interface.js";
import type { ILlmPromptContext } from "../interface/llm-service.interface.js";

import { DEFAULT_VALIDATION_MAX_RETRIES } from "../../domain/constant/numeric.constant.js";

/**
 * Use case for validating and fixing commit messages
 */
export class ValidateCommitMessageUseCase {
	private readonly DEFAULT_MAX_RETRIES: number = DEFAULT_VALIDATION_MAX_RETRIES;

	private readonly VALIDATOR: ICommitValidator;

	constructor(validator: ICommitValidator, defaultMaxRetries: number = DEFAULT_VALIDATION_MAX_RETRIES) {
		this.VALIDATOR = validator;
		this.DEFAULT_MAX_RETRIES = defaultMaxRetries;
	}

	/**
	 * Execute the validation use case
	 * @param {CommitMessage} message - The commit message to validate
	 * @param {boolean} shouldAttemptFix - Whether to attempt fixing validation errors
	 * @param {number | undefined} maxRetries - Maximum number of retry attempts (optional, defaults to DEFAULT_MAX_RETRIES)
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @returns {Promise<CommitMessage | null>} Promise resolving to the validated message or null if validation fails
	 */
	async execute(message: CommitMessage, shouldAttemptFix: boolean = false, maxRetries?: number, context?: ILlmPromptContext): Promise<CommitMessage | null> {
		const retryLimit: number = maxRetries ?? this.DEFAULT_MAX_RETRIES;
		let currentMessage: CommitMessage = message;
		let attempts: number = 0;

		while (attempts <= retryLimit) {
			const validationResult: ICommitValidationResult = await this.validate(currentMessage);

			if (validationResult.isValid) {
				if (attempts > 0) {
					process.stdout.write(`✓ Commit message fixed after ${attempts} attempt${attempts > 1 ? "s" : ""}\n`);
				}

				return currentMessage;
			}

			// If we shouldn't attempt fix or we've exhausted all retries
			if (!shouldAttemptFix || attempts >= retryLimit) {
				if (validationResult.errors && validationResult.errors.length > 0) {
					process.stdout.write(`✗ Commit message validation failed after ${attempts} attempts:\n`);

					for (const error of validationResult.errors) {
						process.stdout.write(`  - ${error}\n`);
					}
				}

				return null;
			}

			// Attempt to fix
			attempts++;
			process.stdout.write(`Attempting to fix commit message (attempt ${attempts}/${retryLimit})...\n`);

			try {
				const fixedMessage: CommitMessage | null = await this.VALIDATOR.fix(currentMessage, validationResult, context);

				if (!fixedMessage) {
					process.stdout.write("Unable to automatically fix the commit message\n");

					return null;
				}

				process.stdout.write("Fixed commit message generated\n");
				currentMessage = fixedMessage;
			} catch (error) {
				process.stdout.write(`Error during fix attempt: ${error instanceof Error ? error.message : String(error)}\n`);

				return null;
			}
		}

		process.stdout.write(`Unable to generate valid commit message after ${retryLimit} attempts\n`);

		return null;
	}

	/**
	 * Validate a commit message
	 * @param {CommitMessage} message - The commit message to validate
	 * @returns {Promise<ICommitValidationResult>} Promise resolving to the validation result
	 */
	async validate(message: CommitMessage): Promise<ICommitValidationResult> {
		return this.VALIDATOR.validate(message);
	}
}
