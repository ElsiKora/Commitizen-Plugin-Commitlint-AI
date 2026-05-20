import type { AiCoreAdapter, IResolvedModuleProfile } from "@elsikora/ai-core";

import { describe, expect, it, vi } from "vitest";

import { ELLMProvider as EAiCoreLLMProvider, EProfileInspectionStatus } from "@elsikora/ai-core";

import { ECommitMode } from "../../../../src/domain/enum/commit-mode.enum";
import { ELLMProvider } from "../../../../src/domain/enum/llm-provider.enum";
import { AiCoreProfileService } from "../../../../src/infrastructure/service/ai-core-profile.service";

describe("AiCoreProfileService", () => {
	it("maps AI-Core profiles to local runtime configuration", async () => {
		const profile: IResolvedModuleProfile = {
			credential: {
				getValue: () => "sk-profile-value",
			} as IResolvedModuleProfile["credential"],
			model: "gpt-4o",
			moduleId: "commitlint-plugin-commitlint-ai",
			provider: EAiCoreLLMProvider.OPENAI,
			retries: 4,
			validationRetries: 2,
		};
		const adapter: AiCoreAdapter = {
			ensureProfile: vi.fn().mockResolvedValue(profile),
		} as unknown as AiCoreAdapter;
		const service = new AiCoreProfileService(adapter);

		const configuration = await service.ensure("commitlint-plugin-commitlint-ai", ECommitMode.AUTO);

		expect(configuration.getProvider()).toBe(ELLMProvider.OPENAI);
		expect(configuration.getApiKey().getValue()).toBe("sk-profile-value");
		expect(configuration.getModel()).toBe("gpt-4o");
		expect(configuration.getMaxRetries()).toBe(4);
		expect(configuration.getValidationMaxRetries()).toBe(2);
		expect(adapter.ensureProfile).toHaveBeenCalledWith("commitlint-plugin-commitlint-ai");
	});

	it("checks profile readiness without prompting", async () => {
		const adapter: AiCoreAdapter = {
			inspectProfile: vi.fn().mockResolvedValue({ status: EProfileInspectionStatus.READY }),
		} as unknown as AiCoreAdapter;
		const service = new AiCoreProfileService(adapter);

		await expect(service.isReady("commitlint-plugin-commitlint-ai")).resolves.toBe(true);
		expect(adapter.inspectProfile).toHaveBeenCalledWith("commitlint-plugin-commitlint-ai");
	});
});
