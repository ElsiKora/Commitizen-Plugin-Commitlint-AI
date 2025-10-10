import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICommitValidationResult, ICommitValidator } from "../../../../src/application/interface/commit-validator.interface.js";

import { GenerateCommitMessageUseCase } from "../../../../src/application/use-case/generate-commit-message.use-case.js";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock.js";
import { MockLlmService } from "../../../mocks/llm-service.mock.js";
import { createMockLLMConfiguration, createMockLlmPromptContext } from "../../../helpers/test-utils.js";

describe("GenerateCommitMessageUseCase", () => {
	let mockAnthropicService: MockLlmService;
	let mockConfiguration: unknown;
	let mockContext: ReturnType<typeof createMockLlmPromptContext>;
	let mockOpenAiService: MockLlmService;
	let mockValidator: ICommitValidator;
	let useCase: GenerateCommitMessageUseCase;

	beforeEach(() => {
		// Create mock services
		mockOpenAiService = new MockLlmService("openai");
		mockAnthropicService = new MockLlmService("anthropic");

		// Create mock validator
		mockValidator = {
			fix: vi.fn(),
			validate: vi.fn(),
		};

		// Create use case with mock services and validator
		useCase = new GenerateCommitMessageUseCase([mockOpenAiService, mockAnthropicService], mockValidator);

		// Create mock configuration and context
		mockConfiguration = createMockLLMConfiguration();
		mockContext = createMockLlmPromptContext();

		// Reset all mocks
		vi.clearAllMocks();
	});

	describe("execute", () => {
		it("should generate and validate a commit message using the appropriate service", async () => {
			// Arrange
			const expectedCommitMessage = createMockCommitMessage({
				scope: "auth",
				subject: "add OAuth2 authentication",
				type: "feat",
			});
			mockOpenAiService.generateCommitMessage.mockResolvedValue(expectedCommitMessage);
			(mockValidator.validate as unknown).mockResolvedValue({ isValid: true } as ICommitValidationResult);

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(mockOpenAiService.supports).toHaveBeenCalledWith(mockConfiguration);
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledWith(mockContext, mockConfiguration);
			expect(mockValidator.validate).toHaveBeenCalledWith(expectedCommitMessage);
			expect(result).toBe(expectedCommitMessage);
		});

		it("should throw error when no service supports the provider", async () => {
			// Arrange
			mockConfiguration.getProvider.mockReturnValue("unsupported-provider");

			// Act & Assert
			await expect(useCase.execute(mockContext, mockConfiguration)).rejects.toThrow("No LLM service found for provider: unsupported-provider");
		});

		it("should retry on validation failure and regenerate", async () => {
			// Arrange
			const maxRetries = 3;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			const invalidMessage = createMockCommitMessage({ subject: "invalid" });
			const validMessage = createMockCommitMessage({ subject: "valid message" });

			// First attempt: invalid, second attempt: valid
			mockOpenAiService.generateCommitMessage.mockResolvedValueOnce(invalidMessage).mockResolvedValueOnce(validMessage);

			(mockValidator.validate as unknown).mockResolvedValueOnce({ errors: ["Subject too short"], isValid: false } as ICommitValidationResult).mockResolvedValueOnce({ isValid: true } as ICommitValidationResult);

			const onRetry = vi.fn();

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration, onRetry);

			// Assert
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(2);
			expect(mockValidator.validate).toHaveBeenCalledTimes(2);
			expect(onRetry).toHaveBeenCalledTimes(1);
			expect(onRetry).toHaveBeenCalledWith(1, 3, expect.any(Error));
			expect(result).toBe(validMessage);
		});

		it("should throw error after max retries with validation errors", async () => {
			// Arrange
			const maxRetries = 2;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			const invalidMessage = createMockCommitMessage({ subject: "invalid" });
			mockOpenAiService.generateCommitMessage.mockResolvedValue(invalidMessage);
			(mockValidator.validate as unknown).mockResolvedValue({ errors: ["Subject too short"], isValid: false } as ICommitValidationResult);

			// Act & Assert
			await expect(useCase.execute(mockContext, mockConfiguration)).rejects.toThrow("Failed to generate valid commit message after 2 attempts");

			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(maxRetries);
			expect(mockValidator.validate).toHaveBeenCalledTimes(maxRetries);
		});

		it("should retry on API failure", async () => {
			// Arrange
			const maxRetries = 3;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			const validMessage = createMockCommitMessage();

			// Fail once, then succeed
			mockOpenAiService.generateCommitMessage.mockRejectedValueOnce(new Error("API Error")).mockResolvedValueOnce(validMessage);

			(mockValidator.validate as unknown).mockResolvedValue({ isValid: true } as ICommitValidationResult);

			const onRetry = vi.fn();

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration, onRetry);

			// Assert
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(2);
			expect(onRetry).toHaveBeenCalledTimes(1);
			expect(result).toBe(validMessage);
		});

		it("should use anthropic service when provider is anthropic", async () => {
			// Arrange
			mockConfiguration.getProvider.mockReturnValue("anthropic");
			const expectedCommitMessage = createMockCommitMessage({
				subject: "resolve memory leak in cache service",
				type: "fix",
			});
			mockAnthropicService.generateCommitMessage.mockResolvedValue(expectedCommitMessage);
			(mockValidator.validate as unknown).mockResolvedValue({ isValid: true } as ICommitValidationResult);

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(mockAnthropicService.supports).toHaveBeenCalledWith(mockConfiguration);
			expect(mockAnthropicService.generateCommitMessage).toHaveBeenCalledWith(mockContext, mockConfiguration);
			expect(mockOpenAiService.generateCommitMessage).not.toHaveBeenCalled();
			expect(result).toBe(expectedCommitMessage);
		});

		it("should enrich context with validation errors on retry", async () => {
			// Arrange
			const maxRetries = 2;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			const invalidMessage = createMockCommitMessage({ subject: "bad" });
			const validMessage = createMockCommitMessage({ subject: "good message" });

			mockOpenAiService.generateCommitMessage.mockResolvedValueOnce(invalidMessage).mockResolvedValueOnce(validMessage);

			(mockValidator.validate as unknown).mockResolvedValueOnce({ errors: ["Subject too short", "Missing scope"], isValid: false } as ICommitValidationResult).mockResolvedValueOnce({ isValid: true } as ICommitValidationResult);

			// Act
			await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(2);

			// Check second call had enriched context
			const secondCallContext = mockOpenAiService.generateCommitMessage.mock.calls[1][0];
			expect(secondCallContext.rules.validationErrors).toEqual(["Subject too short", "Missing scope"]);
			expect(secondCallContext.rules.previousAttempt).toBe(invalidMessage.toString());
		});
	});

	describe("edge cases", () => {
		it("should handle empty service list", async () => {
			// Arrange
			const emptyUseCase = new GenerateCommitMessageUseCase([], mockValidator);

			// Act & Assert
			await expect(emptyUseCase.execute(mockContext, mockConfiguration)).rejects.toThrow("No LLM service found for provider: openai");
		});

		it("should handle undefined onRetry callback", async () => {
			// Arrange
			const validMessage = createMockCommitMessage();
			mockOpenAiService.generateCommitMessage.mockResolvedValue(validMessage);
			(mockValidator.validate as unknown).mockResolvedValue({ isValid: true } as ICommitValidationResult);

			// Act - should not throw
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(result).toBe(validMessage);
		});
	});
});
