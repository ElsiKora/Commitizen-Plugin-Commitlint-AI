import { vi } from "vitest";

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
			supports: vi.fn(),
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
export function createMockLLMConfiguration() {
	return {
		getProvider: vi.fn().mockReturnValue("openai"),
		getModel: vi.fn().mockReturnValue("gpt-4"),
		getApiKey: vi.fn().mockReturnValue("test-api-key"),
		getMaxRetries: vi.fn().mockReturnValue(3),
		getTemperature: vi.fn().mockReturnValue(0.7),
		getMaxTokens: vi.fn().mockReturnValue(500),
		getTimeout: vi.fn().mockReturnValue(30000),
		getBaseUrl: vi.fn().mockReturnValue(undefined),
		getApiVersion: vi.fn().mockReturnValue(undefined),
		getDeploymentName: vi.fn().mockReturnValue(undefined),
		getRegion: vi.fn().mockReturnValue(undefined),
		getAnthropicVersion: vi.fn().mockReturnValue(undefined),
		isAutoCommit: vi.fn().mockReturnValue(false),
		getConventionalCommitTypes: vi.fn().mockReturnValue(["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]),
	};
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
