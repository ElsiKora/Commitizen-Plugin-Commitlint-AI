import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICommitValidationResult, ICommitValidator } from "../../../../src/application/interface/commit-validator.interface.js";
import type { CommitMessage } from "../../../../src/domain/entity/commit-message.entity.js";

import { ValidateCommitMessageUseCase } from "../../../../src/application/use-case/validate-commit-message.use-case.js";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock.js";

describe("ValidateCommitMessageUseCase", () => {
	let mockCommitMessage: CommitMessage;
	let mockValidator: ICommitValidator;
	let useCase: ValidateCommitMessageUseCase;

	beforeEach(() => {
		// Mock validator
		mockValidator = {
			fix: vi.fn(),
			validate: vi.fn(),
		};

		// Create use case
		useCase = new ValidateCommitMessageUseCase(mockValidator);

		// Create mock commit message
		mockCommitMessage = createMockCommitMessage({
			scope: "auth",
			subject: "add login functionality",
			type: "feat",
		});

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("validate", () => {
		it("should delegate validation to validator", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				isValid: true,
			};
			(mockValidator.validate as unknown).mockResolvedValue(validationResult);

			// Act
			const result: ICommitValidationResult = await useCase.validate(mockCommitMessage);

			// Assert
			expect(result).toBe(validationResult);
			expect(mockValidator.validate).toHaveBeenCalledWith(mockCommitMessage);
			expect(mockValidator.validate).toHaveBeenCalledTimes(1);
		});

		it("should return validation result when message is valid", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				isValid: true,
			};
			(mockValidator.validate as unknown).mockResolvedValue(validationResult);

			// Act
			const result: ICommitValidationResult = await useCase.validate(mockCommitMessage);

			// Assert
			expect(result.isValid).toBe(true);
		});

		it("should return validation result with errors when message is invalid", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				errors: ["Type 'feat' is not allowed", "Subject is too short"],
				isValid: false,
			};
			(mockValidator.validate as unknown).mockResolvedValue(validationResult);

			// Act
			const result: ICommitValidationResult = await useCase.validate(mockCommitMessage);

			// Assert
			expect(result.isValid).toBe(false);
			expect(result.errors).toEqual(["Type 'feat' is not allowed", "Subject is too short"]);
		});
	});
});
