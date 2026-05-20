import type { IAiProfileService } from "@application/interface/ai-profile-service.interface";
import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { IConfigService } from "@application/interface/config-service.interface";
import type { IConfig, ITicketConfig, TTicketMissingBranchLintBehavior, TTicketNormalization, TTicketSource } from "@application/interface/config.interface";

import { COMMITIZEN_AI_MODULE_CONSTANT } from "@application/constant/ai-core-module.constant";
import { NUMERIC_CONSTANT } from "@domain/constant/numeric.constant";
import { TICKET_CONSTANT } from "@domain/constant/ticket.constant";
import { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ECommitMode } from "@domain/enum/commit-mode.enum";
import { ELLMProvider } from "@domain/enum/llm-provider.enum";
import { ApiKey } from "@domain/value-object/api-key.value-object";

/**
 * Use case for configuring LLM settings.
 */
export class ConfigureLLMUseCase {
	private readonly AI_PROFILE_SERVICE: IAiProfileService;

	private readonly CLI_INTERFACE: ICliInterfaceService;

	private readonly CONFIG_SERVICE: IConfigService;

	constructor(configService: IConfigService, cliInterface: ICliInterfaceService, aiProfileService: IAiProfileService) {
		this.CONFIG_SERVICE = configService;
		this.CLI_INTERFACE = cliInterface;
		this.AI_PROFILE_SERVICE = aiProfileService;
	}

	/**
	 * Configure LLM settings interactively.
	 * @returns {Promise<LLMConfiguration>} Promise resolving to the new configuration.
	 */
	async configureInteractively(): Promise<LLMConfiguration> {
		const mode: ECommitMode = await this.CLI_INTERFACE.select<ECommitMode>(
			"Select commit mode:",
			[
				{ label: "Auto (AI-powered)", value: ECommitMode.AUTO },
				{ label: "Manual", value: ECommitMode.MANUAL },
			],
			ECommitMode.AUTO,
		);

		if (mode === ECommitMode.MANUAL) {
			const configuration: LLMConfiguration = this.createManualConfiguration();
			await this.saveConfiguration(configuration);

			return configuration;
		}

		this.CLI_INTERFACE.info("Setting up AI-powered commit mode through AI-Core...");

		const configuration: LLMConfiguration = await this.AI_PROFILE_SERVICE.configure(COMMITIZEN_AI_MODULE_CONSTANT.ID, mode);
		await this.saveConfiguration(configuration);

		this.CLI_INTERFACE.success("Configuration saved successfully!");

		return configuration;
	}

	/**
	 * Get the current LLM configuration.
	 * @returns {Promise<LLMConfiguration | null>} Promise resolving to the current configuration or null if not configured.
	 */
	async getCurrentConfiguration(): Promise<LLMConfiguration | null> {
		const config: IConfig = await this.getConfigWithDefaults();

		if (!config.mode) {
			return null;
		}

		if (config.mode === ECommitMode.MANUAL) {
			return this.createManualConfiguration(config);
		}

		const configuration: LLMConfiguration = await this.AI_PROFILE_SERVICE.ensure(COMMITIZEN_AI_MODULE_CONSTANT.ID, config.mode);
		await this.saveConfiguration(configuration);

		return configuration;
	}

	async getMockConfiguration(): Promise<LLMConfiguration> {
		const config: IConfig = await this.CONFIG_SERVICE.get();

		return new LLMConfiguration(config.provider ?? ELLMProvider.OPENAI, new ApiKey("mock-mode"), config.mode ?? ECommitMode.AUTO, config.model, config.maxRetries ?? NUMERIC_CONSTANT.DEFAULT_MAX_RETRIES, config.validationMaxRetries ?? NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES);
	}

	/**
	 * Check if the current configuration needs LLM details.
	 * @returns {Promise<boolean>} Promise resolving to true if LLM details are needed.
	 */
	async needsLLMDetails(): Promise<boolean> {
		const config: IConfig = await this.CONFIG_SERVICE.get();

		if (!config.mode || config.mode === ECommitMode.MANUAL) {
			return false;
		}

		return !(await this.AI_PROFILE_SERVICE.isReady(COMMITIZEN_AI_MODULE_CONSTANT.ID));
	}

	/**
	 * Save LLM configuration.
	 * @param {LLMConfiguration} configuration - The configuration to save.
	 * @returns {Promise<void>} Promise that resolves when configuration is saved.
	 */
	async saveConfiguration(configuration: LLMConfiguration): Promise<void> {
		const existingConfig: IConfig = await this.CONFIG_SERVICE.get();

		const config: IConfig = {
			maxRetries: configuration.getMaxRetries(),
			mode: configuration.getMode(),
			ticket: existingConfig.ticket ?? getDefaultTicketConfig(),
			validationMaxRetries: configuration.getValidationMaxRetries(),
		};

		await this.CONFIG_SERVICE.set(config);
	}

	/**
	 * Update the commit mode.
	 * @param {ECommitMode} mode - The new mode.
	 * @returns {Promise<LLMConfiguration | null>} Promise resolving to the updated configuration.
	 */
	async updateMode(mode: ECommitMode): Promise<LLMConfiguration | null> {
		const current: LLMConfiguration | null = await this.getCurrentConfiguration();

		if (!current) {
			return null;
		}

		const updated: LLMConfiguration = current.withMode(mode);
		await this.saveConfiguration(updated);

		return updated;
	}

	private createManualConfiguration(config?: IConfig): LLMConfiguration {
		return new LLMConfiguration(config?.provider ?? ELLMProvider.OPENAI, new ApiKey("manual-mode"), ECommitMode.MANUAL, config?.model, config?.maxRetries ?? NUMERIC_CONSTANT.DEFAULT_MAX_RETRIES, config?.validationMaxRetries ?? NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES);
	}

	private async getConfigWithDefaults(): Promise<IConfig> {
		const config: IConfig = await this.CONFIG_SERVICE.get();
		let isConfigUpdated: boolean = false;

		if (config.maxRetries === undefined) {
			config.maxRetries = NUMERIC_CONSTANT.DEFAULT_MAX_RETRIES;
			isConfigUpdated = true;
		}

		if (config.validationMaxRetries === undefined) {
			config.validationMaxRetries = NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES;
			isConfigUpdated = true;
		}

		if (!config.ticket) {
			config.ticket = getDefaultTicketConfig();
			isConfigUpdated = true;
		}

		if (isConfigUpdated) {
			await this.CONFIG_SERVICE.set(config);
		}

		return config;
	}
}

/**
 * Build default ticket extraction settings for commit configuration.
 * @returns {ITicketConfig} Default ticket settings.
 */
function getDefaultTicketConfig(): ITicketConfig {
	return {
		missingBranchLintBehavior: TICKET_CONSTANT.DEFAULT_TICKET_MISSING_BRANCH_LINT_BEHAVIOR as TTicketMissingBranchLintBehavior,
		normalization: TICKET_CONSTANT.DEFAULT_TICKET_NORMALIZATION as TTicketNormalization,
		pattern: TICKET_CONSTANT.DEFAULT_TICKET_PATTERN_SOURCE,
		patternFlags: TICKET_CONSTANT.DEFAULT_TICKET_PATTERN_FLAGS,
		source: TICKET_CONSTANT.DEFAULT_TICKET_SOURCE as TTicketSource,
	};
}
