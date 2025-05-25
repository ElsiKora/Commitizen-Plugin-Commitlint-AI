import { describe, it, expect, beforeEach, vi } from "vitest";
import { GenerateCommitMessageUseCase } from "../../../../src/application/use-case/generate-commit-message.use-case";
import { MockLlmService } from "../../../mocks/llm-service.mock";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";
import { createMockLLMConfiguration, createMockLlmPromptContext } from "../../../helpers/test-utils";

describe("GenerateCommitMessageUseCase", () => {
	let useCase: GenerateCommitMessageUseCase;
	let mockOpenAiService: MockLlmService;
	let mockAnthropicService: MockLlmService;
	let mockConfiguration: any;
	let mockContext: ReturnType<typeof createMockLlmPromptContext>;

	beforeEach(() => {
		// Create mock services
		mockOpenAiService = new MockLlmService("openai");
		mockAnthropicService = new MockLlmService("anthropic");

		// Create use case with mock services
		useCase = new GenerateCommitMessageUseCase([mockOpenAiService, mockAnthropicService]);

		// Create mock configuration and context
		mockConfiguration = createMockLLMConfiguration();
		mockContext = createMockLlmPromptContext();

		// Reset all mocks
		vi.clearAllMocks();
	});

	describe("execute", () => {
		it("should generate a commit message using the appropriate service", async () => {
			// Arrange
			const expectedCommitMessage = createMockCommitMessage({
				type: "feat",
				scope: "auth",
				subject: "add OAuth2 authentication",
			});
			mockOpenAiService.generateCommitMessage.mockResolvedValue(expectedCommitMessage);

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(mockOpenAiService.supports).toHaveBeenCalledWith(mockConfiguration);
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledWith(mockContext, mockConfiguration);
			expect(result).toBe(expectedCommitMessage);
		});

		it("should throw error when no service supports the provider", async () => {
			// Arrange
			mockConfiguration.getProvider.mockReturnValue("unsupported-provider");

			// Act & Assert
			await expect(useCase.execute(mockContext, mockConfiguration)).rejects.toThrow("No LLM service found for provider: unsupported-provider");
		});

		it("should retry on failure up to max retries", async () => {
			// Arrange
			const maxRetries = 3;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			// Fail twice, then succeed
			mockOpenAiService.generateCommitMessage.mockRejectedValueOnce(new Error("API Error 1")).mockRejectedValueOnce(new Error("API Error 2")).mockResolvedValueOnce(createMockCommitMessage());

			const onRetry = vi.fn();

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration, onRetry);

			// Assert
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(3);
			expect(onRetry).toHaveBeenCalledTimes(2);
			expect(onRetry).toHaveBeenCalledWith(1, 3, expect.any(Error));
			expect(onRetry).toHaveBeenCalledWith(2, 3, expect.any(Error));
			expect(result).toBeDefined();
		});

		it("should throw error after max retries are exhausted", async () => {
			// Arrange
			const maxRetries = 2;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			mockOpenAiService.generateCommitMessage.mockRejectedValue(new Error("Persistent API Error"));

			// Act & Assert
			await expect(useCase.execute(mockContext, mockConfiguration)).rejects.toThrow("Failed to generate commit message after 2 attempts: Persistent API Error");

			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(maxRetries);
		});

		it("should use anthropic service when provider is anthropic", async () => {
			// Arrange
			mockConfiguration.getProvider.mockReturnValue("anthropic");
			const expectedCommitMessage = createMockCommitMessage({
				type: "fix",
				subject: "resolve memory leak in cache service",
			});
			mockAnthropicService.generateCommitMessage.mockResolvedValue(expectedCommitMessage);

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(mockAnthropicService.supports).toHaveBeenCalledWith(mockConfiguration);
			expect(mockAnthropicService.generateCommitMessage).toHaveBeenCalledWith(mockContext, mockConfiguration);
			expect(mockOpenAiService.generateCommitMessage).not.toHaveBeenCalled();
			expect(result).toBe(expectedCommitMessage);
		});

		it("should wait between retries", async () => {
			// Arrange
			const maxRetries = 2;
			mockConfiguration.getMaxRetries.mockReturnValue(maxRetries);

			mockOpenAiService.generateCommitMessage.mockRejectedValueOnce(new Error("API Error")).mockResolvedValueOnce(createMockCommitMessage());

			const startTime = Date.now();

			// Act
			await useCase.execute(mockContext, mockConfiguration);

			const endTime = Date.now();

			// Assert
			// Should have waited at least RETRY_DELAY_MS (assuming it's at least 100ms)
			expect(endTime - startTime).toBeGreaterThanOrEqual(100);
		});
	});

	describe("edge cases", () => {
		it("should handle empty service list", async () => {
			// Arrange
			const emptyUseCase = new GenerateCommitMessageUseCase([]);

			// Act & Assert
			await expect(emptyUseCase.execute(mockContext, mockConfiguration)).rejects.toThrow("No LLM service found for provider: openai");
		});

		it("should handle undefined onRetry callback", async () => {
			// Arrange
			mockOpenAiService.generateCommitMessage.mockRejectedValueOnce(new Error("API Error")).mockResolvedValueOnce(createMockCommitMessage());

			// Act - should not throw
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(result).toBeDefined();
			expect(mockOpenAiService.generateCommitMessage).toHaveBeenCalledTimes(2);
		});
	});
});
