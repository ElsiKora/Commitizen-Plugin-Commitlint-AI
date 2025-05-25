import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ECommitMode } from "../../domain/enum/commit-mode.enum.js";
import type { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";
import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { IConfigService } from "../interface/config-service.interface.js";
import type { IConfig } from "../interface/config.interface.js";

import { EOpenAIModel } from "../../domain/enum/openai-model.enum.js";
import { EAnthropicModel } from "../../domain/enum/anthropic-model.enum.js";

/**
 * Use case for configuring LLM settings
 */
export class ConfigureLLMUseCase {
	private readonly configService: IConfigService;
	private readonly cliInterface: ICliInterfaceService;

	constructor(configService: IConfigService, cliInterface: ICliInterfaceService) {
		this.configService = configService;
		this.cliInterface = cliInterface;
	}

	/**
	 * Get the current LLM configuration
	 * @returns Promise resolving to the current configuration or null if not configured
	 */
	async getCurrentConfiguration(): Promise<LLMConfiguration | null> {
		const config = await this.configService.get();

		if (!config.provider || !config.mode) {
			return null;
		}

		// Add backward compatibility - set default retry values if missing
		let configUpdated = false;
		if (config.maxRetries === undefined) {
			config.maxRetries = 3;
			configUpdated = true;
		}
		if (config.validationMaxRetries === undefined) {
			config.validationMaxRetries = 3;
			configUpdated = true;
		}
		
		// Save updated config if we added defaults
		if (configUpdated) {
			await this.configService.set(config);
		}

		// Migrate deprecated models
		let migratedModel = config.model;
		if (migratedModel) {
			// Map old models to new ones
			const modelMigrations: Record<string, string> = {
				// Anthropic migrations
				"claude-3-sonnet-20240229": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-3-haiku-20240307": EAnthropicModel.CLAUDE_3_5_HAIKU,
				"claude-2.1": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-2.0": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-3-5-sonnet-20241022": EAnthropicModel.CLAUDE_3_5_SONNET,
				"claude-3-5-haiku-20241022": EAnthropicModel.CLAUDE_3_5_HAIKU,
				// OpenAI migrations (upgrade old GPT-4 references)
				"gpt-4-0125-preview": EOpenAIModel.GPT_4_TURBO,
				"gpt-4-1106-preview": EOpenAIModel.GPT_4_TURBO,
				"gpt-4-0613": EOpenAIModel.GPT_4,
				"gpt-4-32k": EOpenAIModel.GPT_4_32K,
				"gpt-4-32k-0613": EOpenAIModel.GPT_4_32K,
				"gpt-4o": EOpenAIModel.GPT_4O_MAY,
				"gpt-4o-2024-05-13": EOpenAIModel.GPT_4O_MAY,
				"gpt-4o-2024-08-06": EOpenAIModel.GPT_4O_AUGUST,
				"gpt-4o-mini": EOpenAIModel.GPT_4O_MINI,
				"gpt-3.5-turbo": EOpenAIModel.GPT_35_TURBO,
			};

			if (modelMigrations[migratedModel]) {
				const oldModel = migratedModel;
				migratedModel = modelMigrations[migratedModel];
				
				// Save the migrated configuration
				await this.configService.setProperty("model", migratedModel);
				
				this.cliInterface.warn(`Migrated deprecated model ${oldModel} to ${migratedModel}`);
			}
		}

		// For manual mode, return configuration with dummy API key
		if (config.mode === "manual") {
			const { ApiKey: ApiKeyClass } = await import("../../domain/value-object/api-key.value-object.js");

			return new (await import("../../domain/entity/llm-configuration.entity.js")).LLMConfiguration(
				config.provider,
				new ApiKeyClass("manual-mode"),
				config.mode,
				migratedModel,
				config.maxRetries || 3,
				config.validationMaxRetries || 3
			);
		}

		// For auto mode, check environment variables
		const envVarName = config.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const envApiKey = process.env[envVarName];
		
		// If no API key in environment, return null (will prompt later)
		if (!envApiKey || envApiKey.trim().length === 0) {
			return null;
		}

		const { ApiKey: ApiKeyClass } = await import("../../domain/value-object/api-key.value-object.js");

		return new (await import("../../domain/entity/llm-configuration.entity.js")).LLMConfiguration(
			config.provider,
			new ApiKeyClass(envApiKey),
			config.mode,
			migratedModel,
			config.maxRetries || 3,
			config.validationMaxRetries || 3
		);
	}

	/**
	 * Check if the current configuration needs LLM details
	 * @returns Promise resolving to true if LLM details are needed
	 */
	async needsLLMDetails(): Promise<boolean> {
		const config = await this.configService.get();
		
		if (!config.mode || config.mode === "manual") {
			return false;
		}

		// For auto mode, check if API key is in environment
		const envVarName = config.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const envApiKey = process.env[envVarName];
		
		// Need details if no API key in environment
		return !envApiKey || envApiKey.trim().length === 0;
	}

	/**
	 * Configure LLM settings interactively
	 * @returns Promise resolving to the new configuration
	 */
	async configureInteractively(): Promise<LLMConfiguration> {
		// First, select mode
		const mode = await this.cliInterface.select<ECommitMode>(
			"Select commit mode:",
			[
				{ label: "Auto (AI-powered)", value: "auto" as ECommitMode },
				{ label: "Manual", value: "manual" as ECommitMode },
			],
			"auto"
		);

		// If manual mode, create a minimal configuration
		if (mode === "manual") {
			const { ApiKey: ApiKeyClass } = await import("../../domain/value-object/api-key.value-object.js");
			const { LLMConfiguration: LLMConfigurationClass } = await import("../../domain/entity/llm-configuration.entity.js");

			// Create configuration with dummy values for manual mode
			const configuration = new LLMConfigurationClass(
				"openai" as ELLMProvider, // Default provider (won't be used)
				new ApiKeyClass("manual-mode"), // Dummy API key
				mode,
				undefined, // No model needed for manual mode
				3, // Default max retries
				3  // Default validation max retries
			);

			// Save configuration
			await this.saveConfiguration(configuration);

			return configuration;
		}

		// Auto mode - ask for LLM details
		this.cliInterface.info("Setting up AI-powered commit mode...");

		// Select provider
		const provider = await this.cliInterface.select<ELLMProvider>(
			"Select your LLM provider:",
			[
				{ label: "OpenAI (GPT-4, GPT-3.5)", value: "openai" as ELLMProvider },
				{ label: "Anthropic (Claude)", value: "anthropic" as ELLMProvider },
			]
		);

		// Select model based on provider
		let model: string;
		if (provider === "openai") {
			model = await this.cliInterface.select<string>(
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
				EOpenAIModel.GPT_4O
			);
		} else {
			model = await this.cliInterface.select<string>(
				"Select Anthropic model:",
				[
					{ label: "Claude Opus 4 (Latest 2025, most capable)", value: EAnthropicModel.CLAUDE_OPUS_4 },
					{ label: "Claude Sonnet 4 (Latest 2025, high-performance)", value: EAnthropicModel.CLAUDE_SONNET_4 },
					{ label: "Claude 3.7 Sonnet (Extended thinking)", value: EAnthropicModel.CLAUDE_3_7_SONNET },
					{ label: "Claude 3.5 Sonnet (Previous flagship)", value: EAnthropicModel.CLAUDE_3_5_SONNET },
					{ label: "Claude 3.5 Haiku (Fastest)", value: EAnthropicModel.CLAUDE_3_5_HAIKU },
					{ label: "Claude 3 Opus (Complex tasks)", value: EAnthropicModel.CLAUDE_3_OPUS },
				],
				EAnthropicModel.CLAUDE_SONNET_4
			);
		}

		// Get API key
		let apiKeyValue: string;
		
		// Check environment variables first
		const envVarName = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
		const envApiKey = process.env[envVarName];
		
		if (envApiKey && envApiKey.trim().length > 0) {
			this.cliInterface.success(`Found API key in environment variable: ${envVarName}`);
			apiKeyValue = envApiKey;
		} else {
			// Inform user about environment variable
			this.cliInterface.info(`API key will be read from ${envVarName} environment variable or prompted each time.`);
			// Use dummy value for configuration
			apiKeyValue = "will-prompt-on-use";
		}

		// Ask for retry configuration (advanced settings)
		const configureAdvanced = await this.cliInterface.confirm(
			"Would you like to configure advanced settings (retry counts)?",
			false
		);

		let maxRetries = 3;
		let validationMaxRetries = 3;

		if (configureAdvanced) {
			const retriesStr = await this.cliInterface.text(
				"Max retries for AI generation (default: 3):",
				"3",
				"3",
				(value: string) => {
					const num = parseInt(value, 10);
					if (isNaN(num) || num < 1 || num > 10) {
						return "Please enter a number between 1 and 10";
					}
					return undefined;
				}
			);
			maxRetries = parseInt(retriesStr, 10);

			const validationRetriesStr = await this.cliInterface.text(
				"Max retries for validation fixes (default: 3):",
				"3",
				"3",
				(value: string) => {
					const num = parseInt(value, 10);
					if (isNaN(num) || num < 1 || num > 10) {
						return "Please enter a number between 1 and 10";
					}
					return undefined;
				}
			);
			validationMaxRetries = parseInt(validationRetriesStr, 10);
		}

		// Create configuration
		const { ApiKey: ApiKeyClass } = await import("../../domain/value-object/api-key.value-object.js");
		const { LLMConfiguration: LLMConfigurationClass } = await import("../../domain/entity/llm-configuration.entity.js");

		// Create configuration - will save without API key
		const configuration = new LLMConfigurationClass(
			provider,
			new ApiKeyClass(apiKeyValue),
			mode,
			model,
			maxRetries,
			validationMaxRetries
		);

		// Save configuration (without API key)
		await this.saveConfiguration(configuration);

		this.cliInterface.success("Configuration saved successfully!");
		
		// If we have an environment API key, return config with it
		// Otherwise, return config with dummy key (will prompt later)
		return configuration;
	}

	/**
	 * Save LLM configuration
	 * @param configuration - The configuration to save
	 */
	async saveConfiguration(configuration: LLMConfiguration): Promise<void> {
		const config: IConfig = {
			provider: configuration.getProvider(),
			mode: configuration.getMode(),
			model: configuration.getModel(),
			maxRetries: configuration.getMaxRetries(),
			validationMaxRetries: configuration.getValidationMaxRetries(),
		};

		await this.configService.set(config);
	}

	/**
	 * Update the commit mode
	 * @param mode - The new commit mode
	 * @returns Promise resolving to the updated configuration
	 */
	async updateMode(mode: ECommitMode): Promise<LLMConfiguration | null> {
		const current = await this.getCurrentConfiguration();

		if (!current) {
			return null;
		}

		const updated = current.withMode(mode);
		await this.saveConfiguration(updated);

		return updated;
	}
} 