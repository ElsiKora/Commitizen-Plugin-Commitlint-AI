import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import type { ECommitMode } from "@domain/enum/commit-mode.enum";

/**
 * Port for resolving AI-Core profiles into this package runtime configuration.
 */
export interface IAiProfileService {
	configure(moduleId: string, mode: ECommitMode): Promise<LLMConfiguration>;

	ensure(moduleId: string, mode: ECommitMode): Promise<LLMConfiguration>;

	isReady(moduleId: string): Promise<boolean>;
}
