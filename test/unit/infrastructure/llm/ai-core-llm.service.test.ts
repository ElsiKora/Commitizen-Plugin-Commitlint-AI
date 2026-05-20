import type { AiCoreAdapter, IGenerateResult, IProviderOption } from "@elsikora/ai-core";

import { describe, expect, it, vi } from "vitest";

import { AiCoreLlmService } from "../../../../src/infrastructure/llm/ai-core-llm.service";
import { LLMConfiguration } from "../../../../src/domain/entity/llm-configuration.entity";
import { ECommitMode } from "../../../../src/domain/enum/commit-mode.enum";
import { ELLMProvider } from "../../../../src/domain/enum/llm-provider.enum";
import { ApiKey } from "../../../../src/domain/value-object/api-key.value-object";
import { EGenerateMode, ELLMProvider as EAiCoreLLMProvider } from "@elsikora/ai-core";

describe("AiCoreLlmService", () => {
	it("generates commit messages through AI-Core profile mode", async () => {
		const generate = vi.fn().mockResolvedValue({
			attempts: 1,
			model: "gpt-4o",
			provider: EAiCoreLLMProvider.OPENAI,
			text: JSON.stringify({
				body: "Body text",
				scope: "core",
				subject: "migrate llm runtime",
				type: "refactor",
			}),
		} satisfies IGenerateResult);
		const adapter: AiCoreAdapter = {
			generate,
			getProviderOptions: vi.fn().mockReturnValue([{ label: "OpenAI", value: EAiCoreLLMProvider.OPENAI } satisfies IProviderOption]),
		} as unknown as AiCoreAdapter;
		const service = new AiCoreLlmService(adapter, "commitlint-plugin-commitlint-ai");
		const configuration = new LLMConfiguration(ELLMProvider.OPENAI, new ApiKey("sk-test-value"), ECommitMode.AUTO, "gpt-4o");

		const result = await service.generateCommitMessage(
			{
				diff: "diff --git a/file.ts b/file.ts",
				files: "file.ts",
				subject: {},
				typeEnum: ["refactor"],
			},
			configuration,
		);

		expect(result.toString()).toContain("refactor(core): migrate llm runtime");
		expect(generate).toHaveBeenCalledWith(
			expect.objectContaining({
				credential: "sk-test-value",
				mode: EGenerateMode.PROFILE,
				moduleId: "commitlint-plugin-commitlint-ai",
			}),
		);
		expect(generate.mock.calls[0]?.[0]).not.toHaveProperty("provider");
		expect(generate.mock.calls[0]?.[0]).not.toHaveProperty("retries");
		expect(generate.mock.calls[0]?.[0]).not.toHaveProperty("temperature");
	});

	it("supports providers exposed by AI-Core", () => {
		const adapter: AiCoreAdapter = {
			getProviderOptions: vi.fn().mockReturnValue([{ label: "Cerebras", value: EAiCoreLLMProvider.CEREBRAS } satisfies IProviderOption]),
		} as unknown as AiCoreAdapter;
		const service = new AiCoreLlmService(adapter, "commitlint-plugin-commitlint-ai");

		expect(service.supports(new LLMConfiguration(ELLMProvider.CEREBRAS, new ApiKey("cer-test-value"), ECommitMode.AUTO))).toBe(true);
		expect(service.supports(new LLMConfiguration(ELLMProvider.OPENAI, new ApiKey("sk-test-value"), ECommitMode.AUTO))).toBe(false);
	});
});
