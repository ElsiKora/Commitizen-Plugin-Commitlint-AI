import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { IConfigService } from "../interface/config-service.interface.js";
import type { IConfig } from "../interface/config.interface.js";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES, MAX_RETRY_COUNT, MIN_RETRY_COUNT } from "../../domain/constant/numeric.constant.js";
import { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import { EAnthropicModel } from "../../domain/enum/anthropic-model.enum.js";
import { EAWSBedrockModel } from "../../domain/enum/aws-bedrock-model.enum.js";
import { EAzureOpenAIModel } from "../../domain/enum/azure-openai-model.enum.js";
import { ECommitMode } from "../../domain/enum/commit-mode.enum.js";
import { EGoogleModel } from "../../domain/enum/google-model.enum.js";
import { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";
import { EOllamaModel } from "../../domain/enum/ollama-model.enum.js";
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
	 * @returns {Promise<LLMConfiguration>} Promise resolving to the new configuration
	 */
	async configureInteractively(): Promise<LLMConfiguration> {
		// First, select mode
		const mode: ECommitMode = await this.CLI_INTERFACE.select<ECommitMode>(
			"Select commit mode:",
			[
				{ label: "Auto (AI-powered)", value: ECommitMode.AUTO },
				{ label: "Manual", value: ECommitMode.MANUAL },
			],
			ECommitMode.AUTO,
		);

		// If manual mode, create a minimal configuration
		if (mode === ECommitMode.MANUAL) {
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
			{ label: "OpenAI (GPT-4, GPT-3.5)", value: ELLMProvider.OPENAI },
			{ label: "Anthropic (Claude)", value: ELLMProvider.ANTHROPIC },
			{ label: "Google (Gemini)", value: ELLMProvider.GOOGLE },
			{ label: "Azure OpenAI", value: ELLMProvider.AZURE_OPENAI },
			{ label: "AWS Bedrock", value: ELLMProvider.AWS_BEDROCK },
			{ label: "Ollama (Local)", value: ELLMProvider.OLLAMA },
		]);

		// Select model based on provider
		let model: string;

		switch (provider) {
			case ELLMProvider.ANTHROPIC: {
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

				break;
			}

			case ELLMProvider.AWS_BEDROCK: {
				model = await this.CLI_INTERFACE.select<string>(
					"Select AWS Bedrock model:",
					[
						{ label: "Claude Opus 4 (Latest 2025, most capable)", value: EAWSBedrockModel.CLAUDE_OPUS_4 },
						{ label: "Claude Sonnet 4 (Latest 2025, balanced performance)", value: EAWSBedrockModel.CLAUDE_SONNET_4 },
						{ label: "Claude 3.5 Sonnet v2 (Previous flagship)", value: EAWSBedrockModel.CLAUDE_3_5_SONNET_V2 },
						{ label: "Claude 3.5 Haiku (Fast)", value: EAWSBedrockModel.CLAUDE_3_5_HAIKU },
						{ label: "Claude 3.5 Sonnet", value: EAWSBedrockModel.CLAUDE_3_5_SONNET },
						{ label: "Amazon Nova Pro (Latest Amazon model)", value: EAWSBedrockModel.NOVA_PRO },
						{ label: "DeepSeek R1 (Advanced reasoning)", value: EAWSBedrockModel.DEEPSEEK_R1 },
						{ label: "Llama 3.2 90B (Open source)", value: EAWSBedrockModel.LLAMA_3_2_90B },
						{ label: "Mistral Large (Latest)", value: EAWSBedrockModel.MISTRAL_LARGE_2_24_11 },
					],
					EAWSBedrockModel.CLAUDE_SONNET_4,
				);

				break;
			}

			case ELLMProvider.AZURE_OPENAI: {
				model = await this.CLI_INTERFACE.select<string>(
					"Select Azure OpenAI model:",
					[
						{ label: "GPT-4.1 Turbo (Latest 2025, most capable)", value: EAzureOpenAIModel.GPT_4_1_TURBO_2024_12_17 },
						{ label: "GPT-4.1 Preview (Latest preview)", value: EAzureOpenAIModel.GPT_4_1_PREVIEW_2024_12_17 },
						{ label: "GPT-4.1 Mini (Fast 4.1 model)", value: EAzureOpenAIModel.GPT_4_1_MINI_2024_12_17 },
						{ label: "GPT-4o 2024-11 (Enhanced creative)", value: EAzureOpenAIModel.GPT_4O_2024_11_20 },
						{ label: "GPT-4o Mini", value: EAzureOpenAIModel.GPT_4O_MINI_2024_07_18 },
						{ label: "GPT-4 Turbo", value: EAzureOpenAIModel.GPT_4_TURBO },
						{ label: "GPT-3.5 Turbo", value: EAzureOpenAIModel.GPT_35_TURBO },
						{ label: "O3 (Enhanced reasoning)", value: EAzureOpenAIModel.O3_2024_12_17 },
						{ label: "O4 Mini (Fast reasoning)", value: EAzureOpenAIModel.O4_MINI_2024_12_17 },
					],
					EAzureOpenAIModel.GPT_4_1_TURBO_2024_12_17,
				);

				break;
			}

			case ELLMProvider.GOOGLE: {
				model = await this.CLI_INTERFACE.select<string>(
					"Select Google model:",
					[
						{ label: "Gemini 2.5 Pro (Latest 2025, most capable)", value: EGoogleModel.GEMINI_2_5_PRO },
						{ label: "Gemini 2.5 Flash (Latest 2025, fast)", value: EGoogleModel.GEMINI_2_5_FLASH },
						{ label: "Gemini 2.0 Flash (Experimental)", value: EGoogleModel.GEMINI_2_0_FLASH_EXP },
						{ label: "Gemini 1.5 Pro (Stable, capable)", value: EGoogleModel.GEMINI_1_5_PRO },
						{ label: "Gemini 1.5 Flash (Fast, stable)", value: EGoogleModel.GEMINI_1_5_FLASH },
						{ label: "Gemini 1.5 Flash 8B (Lightweight)", value: EGoogleModel.GEMINI_1_5_FLASH_8B },
						{ label: "Gemini 1.0 Pro", value: EGoogleModel.GEMINI_1_0_PRO },
						{ label: "Gemma 3 27B (Most capable open model)", value: EGoogleModel.GEMMA_3_27B },
						{ label: "Gemma 3 12B (Strong language model)", value: EGoogleModel.GEMMA_3_12B },
						{ label: "Gemma 3 4B (Balanced, multimodal)", value: EGoogleModel.GEMMA_3_4B },
						{ label: "Gemma 3 1B (Lightweight)", value: EGoogleModel.GEMMA_3_1B },
					],
					EGoogleModel.GEMINI_2_5_FLASH,
				);

				break;
			}

			case ELLMProvider.OLLAMA: {
				model = await this.CLI_INTERFACE.select<string>(
					"Select Ollama model:",
					[
						{ label: "Llama 3.2 (Latest)", value: EOllamaModel.LLAMA3_2 },
						{ label: "Llama 3.1", value: EOllamaModel.LLAMA3_1 },
						{ label: "Llama 3", value: EOllamaModel.LLAMA3 },
						{ label: "Mistral", value: EOllamaModel.MISTRAL },
						{ label: "CodeLlama", value: EOllamaModel.CODELLAMA },
						{ label: "DeepSeek Coder", value: EOllamaModel.DEEPSEEK_CODER },
						{ label: "Custom Model", value: EOllamaModel.CUSTOM },
					],
					EOllamaModel.LLAMA3_2,
				);

				break;
			}

			case ELLMProvider.OPENAI: {
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

				break;
			}

			default: {
				// This ensures exhaustiveness - TypeScript will error if a case is missing
				const exhaustiveCheck: never = provider;

				throw new Error(`Unsupported provider: ${String(exhaustiveCheck)}`);
			}
		}

		// Get API key
		let credentialValue: string;

		// Check environment variables first
		const environmentVariableNames: Record<string, string> = {
			anthropic: "ANTHROPIC_API_KEY",
			"aws-bedrock": "AWS_BEDROCK_API_KEY",
			"azure-openai": "AZURE_OPENAI_API_KEY",
			google: "GOOGLE_API_KEY",
			ollama: "OLLAMA_API_KEY",
			openai: "OPENAI_API_KEY",
		};

		const environmentVariableName: string = environmentVariableNames[provider] ?? "";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		if (environmentApiKey && environmentApiKey.trim().length > 0) {
			this.CLI_INTERFACE.success(`Found API key in environment variable: ${environmentVariableName}`);
			credentialValue = environmentApiKey;
		} else {
			// Inform user about environment variable and format requirements
			let keyFormatInfo: string = "";

			switch (provider) {
				case ELLMProvider.ANTHROPIC: {
					// Standard API key format - no special format info needed
					// keyFormatInfo is already initialized as empty string
					break;
				}

				case ELLMProvider.AWS_BEDROCK: {
					keyFormatInfo = " (format: region|access-key-id|secret-access-key)";

					break;
				}

				case ELLMProvider.AZURE_OPENAI: {
					keyFormatInfo = " (format: endpoint|api-key|deployment-name)";

					break;
				}

				case ELLMProvider.GOOGLE: {
					// Standard API key format - no special format info needed
					// keyFormatInfo is already initialized as empty string
					break;
				}

				case ELLMProvider.OLLAMA: {
					keyFormatInfo = " (format: host:port or host:port|custom-model)";

					break;
				}

				case ELLMProvider.OPENAI: {
					// Standard API key format - no special format info needed
					// keyFormatInfo is already initialized as empty string
					break;
				}

				default: {
					// This ensures exhaustiveness - TypeScript will error if a case is missing
					const exhaustiveCheck: never = provider;

					throw new Error(`Unsupported provider: ${String(exhaustiveCheck)}`);
				}
			}

			this.CLI_INTERFACE.info(`API key will be read from ${environmentVariableName} environment variable${keyFormatInfo} or prompted each time.`);
			// Use dummy value for configuration
			credentialValue = "will-prompt-on-use";
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

				// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
				return;
			});
			maxRetries = Number.parseInt(retriesString, 10);

			const validationRetriesString: string = await this.CLI_INTERFACE.text("Max retries for validation fixes (default: 3):", "3", "3", (value: string) => {
				const parsedNumber: number = Number.parseInt(value, 10);

				if (Number.isNaN(parsedNumber) || parsedNumber < MIN_RETRY_COUNT || parsedNumber > MAX_RETRY_COUNT) {
					return "Please enter a number between 1 and 10";
				}

				// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
				return;
			});
			validationMaxRetries = Number.parseInt(validationRetriesString, 10);
		}

		// Create configuration
		// Create configuration - will save without API key
		const configuration: LLMConfiguration = new LLMConfiguration(provider, new ApiKey(credentialValue), mode, model, maxRetries, validationMaxRetries);

		// Save configuration (without API key)
		await this.saveConfiguration(configuration);

		this.CLI_INTERFACE.success("Configuration saved successfully!");

		// If we have an environment API key, return config with it
		// Otherwise, return config with dummy key (will prompt later)
		return configuration;
	}

	/**
	 * Get the current LLM configuration
	 * @returns {Promise<LLMConfiguration | null>} Promise resolving to the current configuration or null if not configured
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
		if (config.mode === ECommitMode.MANUAL) {
			return new LLMConfiguration(config.provider, new ApiKey("manual-mode"), config.mode, migratedModel, config.maxRetries ?? DEFAULT_MAX_RETRIES, config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES);
		}

		// For auto mode, check environment variables
		const environmentVariableNames: Record<string, string> = {
			anthropic: "ANTHROPIC_API_KEY",
			"aws-bedrock": "AWS_BEDROCK_API_KEY",
			"azure-openai": "AZURE_OPENAI_API_KEY",
			google: "GOOGLE_API_KEY",
			ollama: "OLLAMA_API_KEY",
			openai: "OPENAI_API_KEY",
		};

		const environmentVariableName: string = environmentVariableNames[config.provider] ?? "";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		// If no API key in environment, return null (will prompt later)
		if (!environmentApiKey || environmentApiKey.trim().length === 0) {
			return null;
		}

		return new LLMConfiguration(config.provider, new ApiKey(environmentApiKey), config.mode, migratedModel, config.maxRetries ?? DEFAULT_MAX_RETRIES, config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES);
	}

	/**
	 * Check if the current configuration needs LLM details
	 * @returns {Promise<boolean>} Promise resolving to true if LLM details are needed
	 */
	async needsLLMDetails(): Promise<boolean> {
		const config: IConfig = await this.CONFIG_SERVICE.get();

		if (!config.mode || config.mode === ECommitMode.MANUAL) {
			return false;
		}

		// For auto mode, check if API key is in environment
		const environmentVariableNames: Record<string, string> = {
			anthropic: "ANTHROPIC_API_KEY",
			"aws-bedrock": "AWS_BEDROCK_API_KEY",
			"azure-openai": "AZURE_OPENAI_API_KEY",
			google: "GOOGLE_API_KEY",
			ollama: "OLLAMA_API_KEY",
			openai: "OPENAI_API_KEY",
		};

		const environmentVariableName: string = environmentVariableNames[config.provider] ?? "";
		const environmentApiKey: string | undefined = process.env[environmentVariableName];

		// Need details if no API key in environment
		return !environmentApiKey || environmentApiKey.trim().length === 0;
	}

	/**
	 * Save LLM configuration
	 * @param {LLMConfiguration} configuration - The configuration to save
	 * @returns {Promise<void>} Promise that resolves when configuration is saved
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
	 * @param {ECommitMode} mode - The new commit mode
	 * @returns {Promise<LLMConfiguration | null>} Promise resolving to the updated configuration
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
