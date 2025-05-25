import type { ECommitMode } from "../../domain/enum/commit-mode.enum.js";
import type { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";
import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { IConfigService } from "../interface/config-service.interface.js";
import type { IConfig } from "../interface/config.interface.js";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES, MAX_RETRY_COUNT, MIN_RETRY_COUNT } from "../../domain/constant/numeric.constant.js";
import { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import { EAnthropicModel } from "../../domain/enum/anthropic-model.enum.js";
import { EOpenAIModel } from "../../domain/enum/openai-model.enum.js";
import { ApiKey } from "../../domain/value-object/api-key.value-object.js";

/**
 * Use case for configuring LLM settings
 */
export class ConfigureLLMUseCase {
	private readonly CLI_INTERFACE: ICliInterfaceService;

	private readonly CONFIG_SERVICE: IConfigService;

	constructor(configService: IConfigService, cliInterface: ICliInterfaceService) {
		this.CONFIG_SERVICE = configService;
		this.CLI_INTERFACE = cliInterface;
	}

	/**
	 * Configure LLM settings interactively
	 * @returns Promise resolving to the new configuration
	 */
	async configureInteractively(): Promise<LLMConfiguration> {
		// First, select mode
		const mode: ECommitMode = await this.CLI_INTERFACE.select<ECommitMode>(
			"Select commit mode:",
			[
				{ label: "Auto (AI-powered)", value: "auto" as ECommitMode },
				{ label: "Manual", value: "manual" as ECommitMode },
			],
			"auto",
		);

		// If manual mode, create a minimal configuration
		if (mode === ("manual" as ECommitMode)) {
			// Create configuration with dummy values for manual mode
			const configuration: LLMConfiguration = new LLMConfiguration(
				"openai" as ELLMProvider, // Default provider (won't be used)
				new ApiKey("manual-mode"), // Dummy API key
				mode,
				undefined, // No model needed for manual mode
				DEFAULT_MAX_RETRIES, // Default max retries
				DEFAULT_VALIDATION_MAX_RETRIES, // Default validation max retries
			);

			// Save configuration
			await this.saveConfiguration(configuration);

			return configuration;
		}

		// Auto mode - ask for LLM details
		this.CLI_INTERFACE.info("Setting up AI-powered commit mode...");

		// Select provider
		const provider: ELLMProvider = await this.CLI_INTERFACE.select<ELLMProvider>("Select your LLM provider:", [
			{ label: "OpenAI (GPT-4, GPT-3.5)", value: "openai" as ELLMProvider },
			{ label: "Anthropic (Claude)", value: "anthropic" as ELLMProvider },
		]);

		// Select model based on provider
		let model: string;

		if (provider === ("openai" as ELLMProvider)) {
			model = await this.CLI_INTERFACE.select<string>(
				"Select OpenAI model:",
				[
					{ label: "GPT-4.1 (Latest 2025, most capable)", value: EOpenAIModel.GPT_4_1 },
					{ label: "GPT-4.1 Nano (Fastest 4.1 model)", value: EOpenAIModel.GPT_4_1_NANO },
					{ label: "GPT-4.1 Mini", value: EOpenAIModel.GPT_4_1_MINI },
					{ label: "GPT-4o (Latest, enhanced creative writing)", value: EOpenAIModel.GPT_4O },
					{ label: "GPT-4o Mini (Faster, cheaper)", value: EOpenAIModel.GPT_4O_MINI },
					{ label: "GPT-4 Turbo", value: EOpenAIModel.GPT_4_TURBO },
					{ label: "GPT-4 (Original)", value: EOpenAIModel.GPT_4 },
					{ label: "GPT-3.5 Turbo (Fastest, cheapest)", value: EOpenAIModel.GPT_35_TURBO },
					{ label: "O1 (Enhanced reasoning)", value: EOpenAIModel.O1 },
					{ label: "O1 Mini (Fast reasoning)", value: EOpenAIModel.O1_MINI },
				],
				EOpenAIModel.GPT_4O,
			);
		} else {
			model = await this.CLI_INTERFACE.select<string>(
				"Select Anthropic model:",
				[
					{ label: "Claude Opus 4 (Latest 2025, most capable)", value: EAnthropicModel.CLAUDE_OPUS_4 },
					{ label: "Claude Sonnet 4 (Latest 2025, high-performance)", value: EAnthropicModel.CLAUDE_SONNET_4 },
					{ label: "Claude 3.7 Sonnet (Extended thinking)", value: EAnthropicModel.CLAUDE_3_7_SONNET },
					{ label: "Claude 3.5 Sonnet (Previous flagship)", value: EAnthropicModel.CLAUDE_3_5_SONNET },
					{ label: "Claude 3.5 Haiku (Fastest)", value: EAnthropicModel.CLAUDE_3_5_HAIKU },
					{ label: "Claude 3 Opus (Complex tasks)", value: EAnthropicModel.CLAUDE_3_OPUS },
				],
				EAnthropicModel.CLAUDE_SONNET_4,
			);
		}

		// Get API key
		let apiKeyValue: string;

		// Check environment variables first
		const environmentVariableName: string = provider === ("openai" as ELLMProvider) ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		if (environmentApiKey && environmentApiKey.trim().length > 0) {
			this.CLI_INTERFACE.success(`Found API key in environment variable: ${environmentVariableName}`);
			apiKeyValue = environmentApiKey;
		} else {
			// Inform user about environment variable
			this.CLI_INTERFACE.info(`API key will be read from ${environmentVariableName} environment variable or prompted each time.`);
			// Use dummy value for configuration
			apiKeyValue = "will-prompt-on-use";
		}

		// Ask for retry configuration (advanced settings)
		const shouldConfigureAdvanced: boolean = await this.CLI_INTERFACE.confirm("Would you like to configure advanced settings (retry counts)?", false);

		let maxRetries: number = DEFAULT_MAX_RETRIES;
		let validationMaxRetries: number = DEFAULT_VALIDATION_MAX_RETRIES;

		if (shouldConfigureAdvanced) {
			const retriesString: string = await this.CLI_INTERFACE.text("Max retries for AI generation (default: 3):", "3", "3", (value: string) => {
				const parsedNumber: number = Number.parseInt(value, 10);

				if (Number.isNaN(parsedNumber) || parsedNumber < MIN_RETRY_COUNT || parsedNumber > MAX_RETRY_COUNT) {
					return "Please enter a number between 1 and 10";
				}
			});
			maxRetries = Number.parseInt(retriesString, 10);

			const validationRetriesString: string = await this.CLI_INTERFACE.text("Max retries for validation fixes (default: 3):", "3", "3", (value: string) => {
				const parsedNumber: number = Number.parseInt(value, 10);

				if (Number.isNaN(parsedNumber) || parsedNumber < MIN_RETRY_COUNT || parsedNumber > MAX_RETRY_COUNT) {
					return "Please enter a number between 1 and 10";
				}
			});
			validationMaxRetries = Number.parseInt(validationRetriesString, 10);
		}

		// Create configuration
		// Create configuration - will save without API key
		const configuration: LLMConfiguration = new LLMConfiguration(provider, new ApiKey(apiKeyValue), mode, model, maxRetries, validationMaxRetries);

		// Save configuration (without API key)
		await this.saveConfiguration(configuration);

		this.CLI_INTERFACE.success("Configuration saved successfully!");

		// If we have an environment API key, return config with it
		// Otherwise, return config with dummy key (will prompt later)
		return configuration;
	}

	/**
	 * Get the current LLM configuration
	 * @returns Promise resolving to the current configuration or null if not configured
	 */
	async getCurrentConfiguration(): Promise<LLMConfiguration | null> {
		const config: IConfig = await this.CONFIG_SERVICE.get();

		if (!config.provider || !config.mode) {
			return null;
		}

		// Add backward compatibility - set default retry values if missing
		let isConfigUpdated: boolean = false;

		if (config.maxRetries === undefined) {
			config.maxRetries = DEFAULT_MAX_RETRIES;
			isConfigUpdated = true;
		}

		if (config.validationMaxRetries === undefined) {
			config.validationMaxRetries = DEFAULT_VALIDATION_MAX_RETRIES;
			isConfigUpdated = true;
		}

		// Save updated config if we added defaults
		if (isConfigUpdated) {
			await this.CONFIG_SERVICE.set(config);
		}

		// Migrate deprecated models
		let migratedModel: string | undefined = config.model;

		if (migratedModel) {
			// Map old models to new ones
			const modelMigrations: Record<string, string> = {
				// Anthropic migrations
				"claude-2.0": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-2.1": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-3-5-haiku-20241022": EAnthropicModel.CLAUDE_3_5_HAIKU,
				"claude-3-5-sonnet-20241022": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-3-haiku-20240307": EAnthropicModel.CLAUDE_3_5_HAIKU,
				"claude-3-sonnet-20240229": EAnthropicModel.CLAUDE_3_5_SONNET,
				// OpenAI migrations (upgrade old GPT-4 references)
				"gpt-3.5-turbo": EOpenAIModel.GPT_35_TURBO,
				"gpt-4": EOpenAIModel.GPT_4,
				"gpt-4-0125-preview": EOpenAIModel.GPT_4_TURBO,
				"gpt-4-0613": EOpenAIModel.GPT_4,
				"gpt-4-1106-preview": EOpenAIModel.GPT_4_TURBO,
				"gpt-4-32k": EOpenAIModel.GPT_4_32K,
				"gpt-4-32k-0613": EOpenAIModel.GPT_4_32K,
				"gpt-4o": EOpenAIModel.GPT_4O_MAY,
				"gpt-4o-2024-05-13": EOpenAIModel.GPT_4O_MAY,
				"gpt-4o-2024-08-06": EOpenAIModel.GPT_4O_AUGUST,
				"gpt-4o-mini": EOpenAIModel.GPT_4O_MINI,
			};

			if (modelMigrations[migratedModel]) {
				const oldModel: string = migratedModel;
				migratedModel = modelMigrations[migratedModel];

				// Save the migrated configuration
				await this.CONFIG_SERVICE.setProperty("model", migratedModel);

				this.CLI_INTERFACE.warn(`Migrated deprecated model ${oldModel} to ${migratedModel}`);
			}
		}

		// For manual mode, return configuration with dummy API key
		if (config.mode === ("manual" as ECommitMode)) {
			return new LLMConfiguration(config.provider, new ApiKey("manual-mode"), config.mode, migratedModel, config.maxRetries ?? DEFAULT_MAX_RETRIES, config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES);
		}

		// For auto mode, check environment variables
		const environmentVariableName: string = config.provider === ("openai" as ELLMProvider) ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		// If no API key in environment, return null (will prompt later)
		if (!environmentApiKey || environmentApiKey.trim().length === 0) {
			return null;
		}

		return new LLMConfiguration(config.provider, new ApiKey(environmentApiKey), config.mode, migratedModel, config.maxRetries ?? DEFAULT_MAX_RETRIES, config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES);
	}

	/**
	 * Check if the current configuration needs LLM details
	 * @returns Promise resolving to true if LLM details are needed
	 */
	async needsLLMDetails(): Promise<boolean> {
		const config: IConfig = await this.CONFIG_SERVICE.get();

		if (!config.mode || config.mode === ("manual" as ECommitMode)) {
			return false;
		}

		// For auto mode, check if API key is in environment
		const environmentVariableName: string = config.provider === ("openai" as ELLMProvider) ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		// Need details if no API key in environment
		return !environmentApiKey || environmentApiKey.trim().length === 0;
	}

	/**
	 * Save LLM configuration
	 * @param configuration - The configuration to save
	 */
	async saveConfiguration(configuration: LLMConfiguration): Promise<void> {
		const config: IConfig = {
			maxRetries: configuration.getMaxRetries(),
			mode: configuration.getMode(),
			model: configuration.getModel(),
			provider: configuration.getProvider(),
			validationMaxRetries: configuration.getValidationMaxRetries(),
		};

		await this.CONFIG_SERVICE.set(config);
	}

	/**
	 * Update the commit mode
	 * @param mode - The new commit mode
	 * @returns Promise resolving to the updated configuration
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
}
