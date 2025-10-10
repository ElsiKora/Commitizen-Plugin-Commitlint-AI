import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitValidationResult, ICommitValidator } from "../interface/commit-validator.interface.js";

/**
 * Use case for validating commit messages
 */
export class ValidateCommitMessageUseCase {
	private readonly VALIDATOR: ICommitValidator;

	constructor(validator: ICommitValidator) {
		this.VALIDATOR = validator;
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
