import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitValidationResult, ICommitValidator } from "../interface/commit-validator.interface.js";
import type { ILlmPromptContext } from "../interface/llm-service.interface.js";

import { NUMERIC_CONSTANT } from "../../domain/constant/numeric.constant.js";

/**
 * Use case for validating and fixing commit messages
 */
export class ValidateCommitMessageUseCase {
	private readonly DEFAULT_MAX_RETRIES: number = NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES;

	private readonly STATUS_REPORTER: ((message: string) => void) | undefined;

	private readonly VALIDATOR: ICommitValidator;

	constructor(validator: ICommitValidator, defaultMaxRetries: number = NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES, statusReporter?: (message: string) => void) {
		this.VALIDATOR = validator;
		this.DEFAULT_MAX_RETRIES = defaultMaxRetries;
		this.STATUS_REPORTER = statusReporter;
	}

	/**
	 * Execute the validation use case
	 * @param {CommitMessage} message - The commit message to validate
	 * @param {boolean} shouldAttemptFix - Whether to attempt fixing validation errors
	 * @param {number | undefined} maxRetries - Maximum number of retry attempts (optional, defaults to DEFAULT_MAX_RETRIES)
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {(attempt: number) => void} onValidationAttempt - Optional callback fired before each validation attempt
	 * @returns {Promise<CommitMessage | null>} Promise resolving to the validated message or null if validation fails
	 */
	async execute(message: CommitMessage, shouldAttemptFix: boolean = false, maxRetries?: number, context?: ILlmPromptContext, onValidationAttempt?: (attempt: number) => void): Promise<CommitMessage | null> {
		const retryLimit: number = maxRetries ?? this.DEFAULT_MAX_RETRIES;
		let currentMessage: CommitMessage = message;
		let attempts: number = 0;

		while (attempts <= retryLimit) {
			const currentAttemptNumber: number = attempts + 1;
			onValidationAttempt?.(currentAttemptNumber);

			const validationResult: ICommitValidationResult = await this.validate(currentMessage);

			if (validationResult.isValid) {
				if (attempts > 0) {
					this.reportStatus(`✓ Commit message fixed after ${attempts} attempt${attempts > 1 ? "s" : ""}`);
				}

				return currentMessage;
			}

			// If we shouldn't attempt fix or we've exhausted all retries
			if (!shouldAttemptFix || attempts >= retryLimit) {
				if (validationResult.errors && validationResult.errors.length > 0) {
					this.reportStatus(`✗ Commit message validation failed after ${attempts} attempts:`);

					for (const error of validationResult.errors) {
						this.reportStatus(`  - ${error}`);
					}
				}

				return null;
			}

			// Attempt to fix
			attempts++;
			this.reportStatus(`Attempting to fix commit message (attempt ${attempts}/${retryLimit})...`);

			try {
				const fixedMessage: CommitMessage | null = await this.VALIDATOR.fix(currentMessage, validationResult, context);

				if (!fixedMessage) {
					this.reportStatus("Unable to automatically fix the commit message");

					return null;
				}

				this.reportStatus("Fixed commit message generated");
				currentMessage = fixedMessage;
			} catch (error) {
				this.reportStatus(`Error during fix attempt: ${error instanceof Error ? error.message : String(error)}`);

				return null;
			}
		}

		this.reportStatus(`Unable to generate valid commit message after ${retryLimit} attempts`);

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

	private reportStatus(message: string): void {
		this.STATUS_REPORTER?.(message);
	}
}
