import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";

import type { ILlmPromptContext } from "./llm-service.interface.js";

/**
 * Validation result for a commit message
 */
export interface ICommitValidationResult {
	errors?: Array<string>;
	isValid: boolean;
	warnings?: Array<string>;
}

/**
 * Interface for commit message validators
 */
export interface ICommitValidator {
	/**
	 * Attempt to fix a commit message based on validation errors
	 * @param message - The commit message to fix
	 * @param validationResult - The validation result containing errors
	 * @param context - Optional original context (diff, files, etc.) for better fixing
	 * @returns Promise resolving to the fixed commit message or null if unfixable
	 */
	fix(message: CommitMessage, validationResult: ICommitValidationResult, context?: ILlmPromptContext): Promise<CommitMessage | null>;

	/**
	 * Validate a commit message
	 * @param message - The commit message to validate
	 * @returns Promise resolving to the validation result
	 */
	validate(message: CommitMessage): Promise<ICommitValidationResult>;
}
