import type { ILlmService } from "@application/interface/llm-service.interface";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GenerateCommitMessageUseCase } from "@application/use-case/generate-commit-message.use-case";
import { createMockLLMConfiguration, createMockLlmPromptContext } from "../../../helpers/test-utils";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";

describe("GenerateCommitMessageUseCase", () => {
	let useCase: GenerateCommitMessageUseCase;
	let llmService: ILlmService;
	let mockConfiguration: LLMConfiguration;
	let mockContext: ReturnType<typeof createMockLlmPromptContext>;

	beforeEach(() => {
		llmService = {
			generateCommitMessage: vi.fn(),
		};

		useCase = new GenerateCommitMessageUseCase(llmService);

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
			vi.mocked(llmService.generateCommitMessage).mockResolvedValue(expectedCommitMessage);

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(llmService.generateCommitMessage).toHaveBeenCalledWith(mockContext, mockConfiguration);
			expect(result).toBe(expectedCommitMessage);
		});

		it("should retry on failure up to max retries", async () => {
			// Arrange
			// Fail twice, then succeed
			vi.mocked(llmService.generateCommitMessage).mockRejectedValueOnce(new Error("API Error 1")).mockRejectedValueOnce(new Error("API Error 2")).mockResolvedValueOnce(createMockCommitMessage());

			const onRetry = vi.fn();

			// Act
			const result = await useCase.execute(mockContext, mockConfiguration, onRetry);

			// Assert
			expect(llmService.generateCommitMessage).toHaveBeenCalledTimes(3);
			expect(onRetry).toHaveBeenCalledTimes(2);
			expect(onRetry).toHaveBeenCalledWith(1, 3, expect.any(Error));
			expect(onRetry).toHaveBeenCalledWith(2, 3, expect.any(Error));
			expect(result).toBeDefined();
		});

		it("should throw error after max retries are exhausted", async () => {
			// Arrange
			const configuration: LLMConfiguration = createMockLLMConfiguration({ maxRetries: 2 });

			vi.mocked(llmService.generateCommitMessage).mockRejectedValue(new Error("Persistent API Error"));

			// Act & Assert
			await expect(useCase.execute(mockContext, configuration)).rejects.toThrow("Failed to generate commit message after 2 attempts: Persistent API Error");

			expect(llmService.generateCommitMessage).toHaveBeenCalledTimes(2);
		});

		it("should wait between retries", async () => {
			// Arrange
			const configuration: LLMConfiguration = createMockLLMConfiguration({ maxRetries: 2 });

			vi.mocked(llmService.generateCommitMessage).mockRejectedValueOnce(new Error("API Error")).mockResolvedValueOnce(createMockCommitMessage());

			const startTime = Date.now();

			// Act
			await useCase.execute(mockContext, configuration);

			const endTime = Date.now();

			// Assert
			// Should have waited at least RETRY_DELAY_MS (assuming it's at least 100ms)
			expect(endTime - startTime).toBeGreaterThanOrEqual(100);
		});
	});

	describe("edge cases", () => {
		it("should handle undefined onRetry callback", async () => {
			// Arrange
			vi.mocked(llmService.generateCommitMessage).mockRejectedValueOnce(new Error("API Error")).mockResolvedValueOnce(createMockCommitMessage());

			// Act - should not throw
			const result = await useCase.execute(mockContext, mockConfiguration);

			// Assert
			expect(result).toBeDefined();
			expect(llmService.generateCommitMessage).toHaveBeenCalledTimes(2);
		});
	});
});
