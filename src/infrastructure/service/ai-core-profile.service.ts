import type { IAiProfileService } from "@application/interface/ai-profile-service.interface";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import type { ECommitMode } from "@domain/enum/commit-mode.enum";
import type { AiCoreAdapter, IResolvedModuleProfile, TProfileInspectionResult } from "@elsikora/ai-core";

import { LLMConfiguration as CommitlintAiLLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ApiKey } from "@domain/value-object/api-key.value-object";
import { EProfileInspectionStatus } from "@elsikora/ai-core";

/**
 * AI-Core profile bridge for Commitlint AI runtime configuration.
 */
export class AiCoreProfileService implements IAiProfileService {
	private readonly AI_CORE_ADAPTER: AiCoreAdapter;

	constructor(aiCoreAdapter: AiCoreAdapter) {
		this.AI_CORE_ADAPTER = aiCoreAdapter;
	}

	async configure(moduleId: string, mode: ECommitMode): Promise<LLMConfiguration> {
		const profile: IResolvedModuleProfile = await this.AI_CORE_ADAPTER.configure(moduleId);

		return this.toConfiguration(profile, mode);
	}

	async ensure(moduleId: string, mode: ECommitMode): Promise<LLMConfiguration> {
		const profile: IResolvedModuleProfile = await this.AI_CORE_ADAPTER.ensureProfile(moduleId);

		return this.toConfiguration(profile, mode);
	}

	async isReady(moduleId: string): Promise<boolean> {
		const inspectionResult: TProfileInspectionResult = await this.AI_CORE_ADAPTER.inspectProfile(moduleId);

		return inspectionResult.status === EProfileInspectionStatus.READY;
	}

	private toConfiguration(profile: IResolvedModuleProfile, mode: ECommitMode): LLMConfiguration {
		return new CommitlintAiLLMConfiguration(new ApiKey(profile.credential.getValue()), mode, profile.retries, profile.validationRetries);
	}
}
