import { vi } from "vitest";
import type { ILlmService } from "../../src/application/interface/llm-service.interface";
import type { LLMConfiguration } from "../../src/domain/entity/llm-configuration.entity";
import type { CommitMessage } from "../../src/domain/entity/commit-message.entity";
import { createMockCommitMessage } from "./commit-message.mock";

export class MockLlmService implements ILlmService {
	supports = vi.fn() as any;
	generateCommitMessage = vi.fn() as any;

	constructor(
		private readonly supportedProvider: string = "openai",
		private readonly mockCommitMessage?: CommitMessage,
	) {
		this.supports.mockImplementation((config: LLMConfiguration) => {
			return config.getProvider() === this.supportedProvider;
		});

		this.generateCommitMessage.mockImplementation(async () => {
			if (this.mockCommitMessage) {
				return this.mockCommitMessage;
			}

			// Return a simple mock commit message
			return createMockCommitMessage();
		});
	}

	reset(): void {
		this.supports.mockClear();
		this.generateCommitMessage.mockClear();
	}
}
