import { vi } from "vitest";

import { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ECommitMode } from "@domain/enum/commit-mode.enum";
import { ApiKey } from "@domain/value-object/api-key.value-object";

/**
 * Creates a mock function with type safety
 */
export function createMock<T extends (...args: any[]) => any>(): T {
	return vi.fn() as unknown as T;
}

/**
 * Waits for a specific amount of time
 */
export async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a test context with common mocked services
 */
export function createTestContext() {
	return {
		gitService: {
			getDiff: vi.fn(),
			getStatus: vi.fn(),
			getStagedFiles: vi.fn(),
		},
		llmService: {
			generateCommitMessage: vi.fn(),
		},
		commitValidator: {
			validate: vi.fn(),
		},
	};
}

/**
 * Creates a mock LLM configuration
 */
export function createMockLLMConfiguration(options: { maxRetries?: number; mode?: ECommitMode; validationMaxRetries?: number } = {}): LLMConfiguration {
	return new LLMConfiguration(new ApiKey("test-api-key"), options.mode ?? ECommitMode.AUTO, options.maxRetries ?? 3, options.validationMaxRetries ?? 3);
}

/**
 * Creates a mock commit message entity
 */
export function createMockCommitMessage() {
	return {
		getType: vi.fn().mockReturnValue("feat"),
		getScope: vi.fn().mockReturnValue("test"),
		getSubject: vi.fn().mockReturnValue("add new feature"),
		getBody: vi.fn().mockReturnValue("This is a test body"),
		getFooter: vi.fn().mockReturnValue(""),
		getBreaking: vi.fn().mockReturnValue(""),
		getIssues: vi.fn().mockReturnValue(""),
		toString: vi.fn().mockReturnValue("feat(test): add new feature"),
	};
}

/**
 * Creates a mock LLM prompt context
 */
export function createMockLlmPromptContext() {
	return {
		diff: "diff --git a/test.ts b/test.ts\n+console.log('test');",
		files: "test.ts",
		subject: {
			description: "Brief description of the change",
			minLength: 3,
			maxLength: 50,
		},
		body: {
			description: "Detailed description of the change",
		},
		typeEnum: ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
		typeDescriptions: {
			feat: { description: "A new feature", emoji: "✨" },
			fix: { description: "A bug fix", emoji: "🐛" },
			docs: { description: "Documentation only changes", emoji: "📚" },
		},
		rules: {},
		scopeDescription: "The scope of the change",
		typeDescription: "The type of change",
	};
}
