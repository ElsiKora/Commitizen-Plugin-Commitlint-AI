import type { IAiProfileService } from "@application/interface/ai-profile-service.interface";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import type { ECommitMode } from "@domain/enum/commit-mode.enum";
import type { AiCoreAdapter, IResolvedModuleProfile, TProfileInspectionResult } from "@elsikora/ai-core";

import { LLMConfiguration as CommitlintAiLLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ELLMProvider } from "@domain/enum/llm-provider.enum";
import { ApiKey } from "@domain/value-object/api-key.value-object";
import { ELLMProvider as EAiCoreLLMProvider, EProfileInspectionStatus } from "@elsikora/ai-core";

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
		return new CommitlintAiLLMConfiguration(this.toLocalProvider(profile.provider), new ApiKey(profile.credential.getValue()), mode, profile.model, profile.retries, profile.validationRetries);
	}

	private toLocalProvider(provider: EAiCoreLLMProvider): ELLMProvider {
		switch (provider) {
			case EAiCoreLLMProvider.ANTHROPIC: {
				return ELLMProvider.ANTHROPIC;
			}

			case EAiCoreLLMProvider.AWS_BEDROCK: {
				return ELLMProvider.AWS_BEDROCK;
			}

			case EAiCoreLLMProvider.AZURE_OPENAI: {
				return ELLMProvider.AZURE_OPENAI;
			}

			case EAiCoreLLMProvider.CEREBRAS: {
				return ELLMProvider.CEREBRAS;
			}

			case EAiCoreLLMProvider.GOOGLE: {
				return ELLMProvider.GOOGLE;
			}

			case EAiCoreLLMProvider.OLLAMA: {
				return ELLMProvider.OLLAMA;
			}

			case EAiCoreLLMProvider.OPENAI: {
				return ELLMProvider.OPENAI;
			}

			case EAiCoreLLMProvider.VERCEL_AI_GATEWAY: {
				return ELLMProvider.VERCEL_AI_GATEWAY;
			}
		}
	}
}
