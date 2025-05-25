import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ValidateCommitMessageUseCase } from "../../../../src/application/use-case/validate-commit-message.use-case";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";
import { createMockLlmPromptContext } from "../../../helpers/test-utils";
import type { ICommitValidator, ICommitValidationResult } from "../../../../src/application/interface/commit-validator.interface";
import type { CommitMessage } from "../../../../src/domain/entity/commit-message.entity";

describe("ValidateCommitMessageUseCase", () => {
	let useCase: ValidateCommitMessageUseCase;
	let mockValidator: ICommitValidator;
	let mockCommitMessage: CommitMessage;
	let consoleWriteSpy: any;

	beforeEach(() => {
		// Mock validator
		mockValidator = {
			validate: vi.fn(),
			fix: vi.fn(),
		};

		// Create use case
		useCase = new ValidateCommitMessageUseCase(mockValidator, 3);

		// Create mock commit message
		mockCommitMessage = createMockCommitMessage({
			type: "feat",
			scope: "auth",
			subject: "add login functionality",
		});

		// Spy on console output
		consoleWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		consoleWriteSpy.mockRestore();
	});

	describe("execute", () => {
		it("should return the message when validation passes", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				isValid: true,
			};
			(mockValidator.validate as any).mockResolvedValue(validationResult);

			// Act
			const result = await useCase.execute(mockCommitMessage);

			// Assert
			expect(result).toBe(mockCommitMessage);
			expect(mockValidator.validate).toHaveBeenCalledWith(mockCommitMessage);
			expect(mockValidator.validate).toHaveBeenCalledTimes(1);
			expect(mockValidator.fix).not.toHaveBeenCalled();
		});

		it("should return null when validation fails and fix is not requested", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Type 'feat' is not allowed", "Subject is too short"],
			};
			(mockValidator.validate as any).mockResolvedValue(validationResult);

			// Act
			const result = await useCase.execute(mockCommitMessage, false);

			// Assert
			expect(result).toBeNull();
			expect(mockValidator.validate).toHaveBeenCalledTimes(1);
			expect(mockValidator.fix).not.toHaveBeenCalled();
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("validation failed"));
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Type 'feat' is not allowed"));
		});

		it("should attempt to fix when validation fails and fix is requested", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Subject is too short"],
			};
			const validResult: ICommitValidationResult = {
				isValid: true,
			};
			const fixedMessage = createMockCommitMessage({
				type: "fix",
				scope: "auth",
				subject: "fix login functionality with proper validation",
			});

			(mockValidator.validate as any).mockResolvedValueOnce(invalidResult).mockResolvedValueOnce(validResult);
			(mockValidator.fix as any).mockResolvedValue(fixedMessage);

			// Act
			const result = await useCase.execute(mockCommitMessage, true);

			// Assert
			expect(result).toBe(fixedMessage);
			expect(mockValidator.validate).toHaveBeenCalledTimes(2);
			expect(mockValidator.fix).toHaveBeenCalledWith(mockCommitMessage, invalidResult, undefined);
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Attempting to fix"));
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Fixed commit message generated"));
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("✓ Commit message fixed after 1 attempt"));
		});

		it("should respect max retries when fixing", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Invalid format"],
			};
			(mockValidator.validate as any).mockResolvedValue(invalidResult);
			(mockValidator.fix as any).mockResolvedValue(mockCommitMessage); // Fix returns same message, so it keeps failing

			// Act
			const result = await useCase.execute(mockCommitMessage, true, 2);

			// Assert
			expect(result).toBeNull();
			expect(mockValidator.validate).toHaveBeenCalledTimes(3); // Initial + 2 retries
			expect(mockValidator.fix).toHaveBeenCalledTimes(2);
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("validation failed after 2 attempts"));
		});

		it("should pass context to fix method when provided", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Invalid format"],
			};
			const context = createMockLlmPromptContext();
			const fixedMessage = createMockCommitMessage();

			(mockValidator.validate as any).mockResolvedValueOnce(invalidResult).mockResolvedValueOnce({ isValid: true });
			(mockValidator.fix as any).mockResolvedValue(fixedMessage);

			// Act
			const result = await useCase.execute(mockCommitMessage, true, 3, context);

			// Assert
			expect(result).toBe(fixedMessage);
			expect(mockValidator.fix).toHaveBeenCalledWith(mockCommitMessage, invalidResult, context);
		});

		it("should return null when fix returns null", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Cannot be fixed"],
			};
			(mockValidator.validate as any).mockResolvedValue(invalidResult);
			(mockValidator.fix as any).mockResolvedValue(null);

			// Act
			const result = await useCase.execute(mockCommitMessage, true);

			// Assert
			expect(result).toBeNull();
			expect(mockValidator.fix).toHaveBeenCalledTimes(1);
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Unable to automatically fix"));
		});

		it("should handle fix errors gracefully", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Invalid format"],
			};
			(mockValidator.validate as any).mockResolvedValue(invalidResult);
			(mockValidator.fix as any).mockRejectedValue(new Error("Fix service unavailable"));

			// Act
			const result = await useCase.execute(mockCommitMessage, true);

			// Assert
			expect(result).toBeNull();
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("Error during fix attempt: Fix service unavailable"));
		});

		it("should fix after multiple attempts", async () => {
			// Arrange
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Invalid format"],
			};
			const validResult: ICommitValidationResult = {
				isValid: true,
			};
			const partiallyFixedMessage = createMockCommitMessage({
				type: "fix",
				subject: "partially fixed",
			});
			const fullyFixedMessage = createMockCommitMessage({
				type: "fix",
				subject: "fully fixed commit message",
			});

			(mockValidator.validate as any)
				.mockResolvedValueOnce(invalidResult) // Initial validation
				.mockResolvedValueOnce(invalidResult) // After first fix
				.mockResolvedValueOnce(validResult); // After second fix

			(mockValidator.fix as any).mockResolvedValueOnce(partiallyFixedMessage).mockResolvedValueOnce(fullyFixedMessage);

			// Act
			const result = await useCase.execute(mockCommitMessage, true);

			// Assert
			expect(result).toBe(fullyFixedMessage);
			expect(mockValidator.validate).toHaveBeenCalledTimes(3);
			expect(mockValidator.fix).toHaveBeenCalledTimes(2);
			expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining("✓ Commit message fixed after 2 attempts"));
		});
	});

	describe("validate", () => {
		it("should delegate to validator", async () => {
			// Arrange
			const validationResult: ICommitValidationResult = {
				isValid: true,
			};
			(mockValidator.validate as any).mockResolvedValue(validationResult);

			// Act
			const result = await useCase.validate(mockCommitMessage);

			// Assert
			expect(result).toBe(validationResult);
			expect(mockValidator.validate).toHaveBeenCalledWith(mockCommitMessage);
		});
	});

	describe("edge cases", () => {
		it("should use default max retries when not specified", async () => {
			// Arrange
			const defaultRetries = 5;
			const customUseCase = new ValidateCommitMessageUseCase(mockValidator, defaultRetries);
			const invalidResult: ICommitValidationResult = {
				isValid: false,
				errors: ["Invalid"],
			};
			(mockValidator.validate as any).mockResolvedValue(invalidResult);
			(mockValidator.fix as any).mockResolvedValue(mockCommitMessage);

			// Act
			const result = await customUseCase.execute(mockCommitMessage, true);

			// Assert
			expect(result).toBeNull();
			expect(mockValidator.validate).toHaveBeenCalledTimes(defaultRetries + 1);
		});
	});
});
