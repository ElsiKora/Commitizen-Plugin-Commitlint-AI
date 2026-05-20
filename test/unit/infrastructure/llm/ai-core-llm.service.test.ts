import type { AiCoreAdapter, IGenerateResult } from "@elsikora/ai-core";

import { describe, expect, it, vi } from "vitest";

import { EGenerateMode, ELLMProvider } from "@elsikora/ai-core";
import { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ECommitMode } from "@domain/enum/commit-mode.enum";
import { ApiKey } from "@domain/value-object/api-key.value-object";
import { AiCoreLlmService } from "@infrastructure/llm/ai-core-llm.service";

describe("AiCoreLlmService", () => {
	it("generates commit messages through AI-Core profile mode", async () => {
		const generate = vi.fn().mockResolvedValue({
			attempts: 1,
			model: "gpt-4o",
			provider: ELLMProvider.OPENAI,
			text: JSON.stringify({
				body: "Body text",
				scope: "core",
				subject: "migrate llm runtime",
				type: "refactor",
			}),
		} satisfies IGenerateResult);
		const adapter: AiCoreAdapter = {
			generate,
		} as unknown as AiCoreAdapter;
		const service = new AiCoreLlmService(adapter, "commitlint-plugin-commitlint-ai");
		const configuration = new LLMConfiguration(new ApiKey("sk-test-value"), ECommitMode.AUTO);

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

});
