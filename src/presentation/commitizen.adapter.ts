import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { IContainer } from "@elsikora/cladi";

import type { ICliInterfaceService } from "../application/interface/cli-interface-service.interface.js";
import type { ICommitRepository } from "../application/interface/commit-repository.interface.js";
import type { ICommitValidationResult, ICommitValidator } from "../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../application/interface/config-service.interface.js";
import type { IConfig } from "../application/interface/config.interface.js";
import type { ILlmPromptContext } from "../application/interface/llm-service.interface.js";
import type { ConfigureLLMUseCase } from "../application/use-case/configure-llm.use-case.js";
import type { GenerateCommitMessageUseCase } from "../application/use-case/generate-commit-message.use-case.js";
import type { ManualCommitUseCase } from "../application/use-case/manual-commit.use-case.js";
import type { ValidateCommitMessageUseCase } from "../application/use-case/validate-commit-message.use-case.js";
import type { CommitMessage } from "../domain/entity/commit-message.entity.js";
import type { ECommitMode } from "../domain/enum/commit-mode.enum.js";

import load from "@commitlint/load";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../domain/constant/numeric.constant.js";
import { LLMConfiguration } from "../domain/entity/llm-configuration.entity.js";
import { ApiKey } from "../domain/value-object/api-key.value-object.js";
import { CommitlintValidatorService } from "../infrastructure/commit-validator/commitlint-validator.service.js";
import { CliInterfaceServiceToken, CommitRepositoryToken, CommitValidatorToken, ConfigServiceToken, ConfigureLLMUseCaseToken, createAppContainer, GenerateCommitMessageUseCaseToken, ManualCommitUseCaseToken, ValidateCommitMessageUseCaseToken } from "../infrastructure/di/container.js";

// Type constants
const TYPE_ENUM_INDEX: number = 2;

type TCommit = (message: string) => void;
type TLoadResult = { prompt?: UserPromptConfig; rules: QualifiedRules };

/**
 * Main adapter for Commitizen integration
 */
export class CommitizenAdapter {
	private readonly CONTAINER: IContainer;

	constructor() {
		this.CONTAINER = createAppContainer();
	}

	/**
	 * Main entry point for commitizen
	 * @param inquirerIns - Instance passed by commitizen (unused in our implementation)
	 * @param commit - Callback to execute with complete commit message
	 */
	async prompter(_inquirerIns: unknown, commit: TCommit): Promise<void> {
		const loadResult: TLoadResult = await load();
		const { prompt = {}, rules }: TLoadResult = loadResult;

		try {
			// Get use cases from container
			const configureLLMUseCase: ConfigureLLMUseCase | undefined = this.CONTAINER.get<ConfigureLLMUseCase>(ConfigureLLMUseCaseToken);
			const generateCommitUseCase: GenerateCommitMessageUseCase | undefined = this.CONTAINER.get<GenerateCommitMessageUseCase>(GenerateCommitMessageUseCaseToken);
			const validateCommitUseCase: undefined | ValidateCommitMessageUseCase = this.CONTAINER.get<ValidateCommitMessageUseCase>(ValidateCommitMessageUseCaseToken);
			const manualCommitUseCase: ManualCommitUseCase | undefined = this.CONTAINER.get<ManualCommitUseCase>(ManualCommitUseCaseToken);
			const cliInterface: ICliInterfaceService | undefined = this.CONTAINER.get<ICliInterfaceService>(CliInterfaceServiceToken);
			const commitRepository: ICommitRepository | undefined = this.CONTAINER.get<ICommitRepository>(CommitRepositoryToken);
			const configService: IConfigService | undefined = this.CONTAINER.get<IConfigService>(ConfigServiceToken);

			if (!configureLLMUseCase || !generateCommitUseCase || !validateCommitUseCase || !manualCommitUseCase || !cliInterface || !commitRepository || !configService) {
				throw new Error("Failed to initialize required services");
			}

			// Extract context from commitlint config
			const promptContext: ILlmPromptContext = this.extractLlmPromptContext(rules, prompt);

			// Add git diff and files to context for AI mode
			const [diff, files]: [string, Array<string>] = await Promise.all([commitRepository.getStagedDiff(), commitRepository.getStagedFiles()]);

			promptContext.diff = diff;
			promptContext.files = files.join("\n");

			// Get or configure LLM
			let llmConfig: LLMConfiguration | null = await configureLLMUseCase.getCurrentConfiguration();
			const isConfigExists: boolean = await configService.exists();

			if (isConfigExists) {
				// Configuration exists - load it first to show details
				const config: IConfig = await configService.get();

				// Ask if they want to use existing configuration
				const modeInfo: string = config.mode === ("auto" as ECommitMode) ? `${config.mode} mode, ${config.provider} provider` : `${config.mode} mode`;
				const isUseExisting: boolean = await cliInterface.confirm(`Found existing configuration (${modeInfo}). Use it?`, true);

				if (!isUseExisting) {
					cliInterface.info("Let's reconfigure...");
					llmConfig = await configureLLMUseCase.configureInteractively();

					// Check if we need to prompt for API key after configuration
					if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
						// Ask for API key
						const { hint, prompt }: { hint: string; prompt: string } = this.getApiKeyPromptInfo(llmConfig.getProvider());

						const apiKeyValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
							if (!value || value.trim().length === 0) {
								return "API key is required";
							}
						});

						// Create new configuration with the provided API key
						llmConfig = new LLMConfiguration(llmConfig.getProvider(), new ApiKey(apiKeyValue), llmConfig.getMode(), llmConfig.getModel(), llmConfig.getMaxRetries(), llmConfig.getValidationMaxRetries());
					}
				} else if (config.mode === ("auto" as ECommitMode) && !llmConfig) {
					// User wants to use existing config but API key is missing
					const environmentVariableNames: Record<string, string> = {
						anthropic: "ANTHROPIC_API_KEY",
						"aws-bedrock": "AWS_BEDROCK_API_KEY",
						"azure-openai": "AZURE_OPENAI_API_KEY",
						google: "GOOGLE_API_KEY",
						ollama: "OLLAMA_API_KEY",
						openai: "OPENAI_API_KEY",
					};
					const environmentVariableName: string = environmentVariableNames[config.provider] || "";
					cliInterface.warn(`API key not found in ${environmentVariableName} environment variable.`);

					// Ask for API key
					const { hint, prompt }: { hint: string; prompt: string } = this.getApiKeyPromptInfo(config.provider);

					const apiKeyValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}
					});

					// Create new configuration with the provided API key
					const maxRetries: number = config.maxRetries ?? DEFAULT_MAX_RETRIES;
					const validationMaxRetries: number = config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES;
					llmConfig = new LLMConfiguration(config.provider, new ApiKey(apiKeyValue), config.mode, config.model, maxRetries, validationMaxRetries);
				}
			} else {
				// No configuration at all
				cliInterface.info("No configuration found. Let's set it up!");
				llmConfig = await configureLLMUseCase.configureInteractively();

				// Check if we need to prompt for API key after configuration
				if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
					// Ask for API key
					const { hint, prompt }: { hint: string; prompt: string } = this.getApiKeyPromptInfo(llmConfig.getProvider());

					const apiKeyValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}
					});

					// Create new configuration with the provided API key
					llmConfig = new LLMConfiguration(llmConfig.getProvider(), new ApiKey(apiKeyValue), llmConfig.getMode(), llmConfig.getModel(), llmConfig.getMaxRetries(), llmConfig.getValidationMaxRetries());
				}
			}

			// Configuration should exist at this point
			if (!llmConfig) {
				throw new Error("Failed to configure LLM settings");
			}

			// Check commit mode
			if (llmConfig.isManualMode()) {
				cliInterface.info("Using manual commit mode...");
				const commitMessage: CommitMessage = await manualCommitUseCase.execute(promptContext);
				commit(commitMessage.toString());

				return;
			}

			// Auto mode - set LLM configuration on validator if it supports it
			const validator: ICommitValidator = this.CONTAINER.get<ICommitValidator>(CommitValidatorToken) ?? ({} as ICommitValidator);

			if (validator instanceof CommitlintValidatorService) {
				validator.setLLMConfiguration(llmConfig);
			}

			// Auto mode - generate with AI
			cliInterface.info("Using AI-powered commit mode...");

			try {
				// Generate commit message
				cliInterface.startSpinner("Generating commit message with AI...");

				let generatedMessage: CommitMessage;

				try {
					generatedMessage = await generateCommitUseCase.execute(promptContext, llmConfig, (attempt: number, maxRetries: number, error: Error) => {
						cliInterface.updateSpinner(`Generating commit message with AI... (Attempt ${attempt}/${maxRetries} failed: ${error.message})`);
					});
				} catch (genError) {
					cliInterface.stopSpinner();

					throw genError;
				}

				cliInterface.stopSpinner();
				cliInterface.success("AI generated initial commit message");

				// Validate and fix if needed
				cliInterface.startSpinner("Validating commit message format...");

				// Track validation attempts
				let lastValidationAttempt: number = 0;
				const originalValidate: (message: CommitMessage) => Promise<ICommitValidationResult> = validateCommitUseCase.validate.bind(validateCommitUseCase);

				validateCommitUseCase.validate = async (message: CommitMessage): Promise<ICommitValidationResult> => {
					lastValidationAttempt++;

					if (lastValidationAttempt > 1) {
						cliInterface.updateSpinner(`Validating commit message format... (attempt ${lastValidationAttempt})`);
					}

					return originalValidate(message);
				};

				const validatedMessage: CommitMessage | null = await validateCommitUseCase.execute(generatedMessage, true, llmConfig.getValidationMaxRetries(), promptContext);

				cliInterface.stopSpinner();

				// Restore original validate method
				validateCommitUseCase.validate = originalValidate;

				if (!validatedMessage) {
					cliInterface.warn("Could not generate a valid commit message. Switching to manual mode...");
					const commitMessage: CommitMessage = await manualCommitUseCase.execute(promptContext);
					commit(commitMessage.toString());

					return;
				}

				// Show the generated message
				cliInterface.success("AI generated commit message successfully!");
				cliInterface.note("Generated commit message:", validatedMessage.toString());

				// Ask for confirmation
				const isConfirmed: boolean = await cliInterface.confirm("Do you want to proceed with this commit message?", true);

				if (isConfirmed) {
					commit(validatedMessage.toString());
				} else {
					cliInterface.info("Switching to manual mode to edit the message...");
					const commitMessage: CommitMessage = await manualCommitUseCase.execute(promptContext);
					commit(commitMessage.toString());
				}
			} catch (error) {
				// Check if it's a retry exhaustion error
				if (error instanceof Error && error.message.includes("Failed to generate commit message after")) {
					cliInterface.error(error.message);
				} else {
					cliInterface.handleError("Error generating commit with AI:", error);
				}

				cliInterface.warn("Falling back to manual commit entry...");

				const commitMessage: CommitMessage = await manualCommitUseCase.execute(promptContext);
				commit(commitMessage.toString());
			}
		} catch (error) {
			if (error instanceof Error && error.message === "User canceled the commit") {
				throw error;
			}
			console.error("Error in commitizen adapter:", error);

			throw error;
		}
	}

	/**
	 * Extract LLM prompt context from commitlint rules and prompts
	 */
	private extractLlmPromptContext(rules: QualifiedRules, prompts: UserPromptConfig): ILlmPromptContext {
		const context: ILlmPromptContext = {
			rules: rules, // Pass all commitlint rules to the LLM
			subject: {},
		};

		// Extract type information
		if (rules["type-enum"]) {
			const types: unknown = rules["type-enum"][TYPE_ENUM_INDEX];

			if (Array.isArray(types)) {
				context.typeEnum = types as Array<string>;
			}
		}

		// Extract type descriptions from prompts
		if (prompts.questions?.type?.enum) {
			context.typeDescriptions = {};

			for (const [key, value] of Object.entries(prompts.questions.type.enum)) {
				if (typeof value === "object" && value && "description" in value && typeof value.description === "string") {
					interface ITypeEnumValue {
						description: string;
						emoji?: string;
					}
					const enumValue: ITypeEnumValue = value as ITypeEnumValue;
					context.typeDescriptions[key] = {
						description: enumValue.description,
						emoji: enumValue.emoji,
					};
				}
			}
		}

		// Extract subject rules
		if (rules["subject-max-length"]) {
			const maxLength: unknown = rules["subject-max-length"][TYPE_ENUM_INDEX];

			if (typeof maxLength === "number") {
				context.subject.maxLength = maxLength;
			}
		}

		if (rules["subject-min-length"]) {
			const minLength: unknown = rules["subject-min-length"][TYPE_ENUM_INDEX];

			if (typeof minLength === "number") {
				context.subject.minLength = minLength;
			}
		}

		// Add descriptions from prompts
		if (prompts.questions?.type?.description) {
			context.typeDescription = prompts.questions.type.description;
		}

		if (prompts.questions?.scope?.description) {
			context.scopeDescription = prompts.questions.scope.description;
		}

		if (prompts.questions?.subject?.description) {
			context.subject.description = prompts.questions.subject.description;
		}

		if (prompts.questions?.body?.description) {
			context.body = {
				description: prompts.questions.body.description,
			};
		}

		return context;
	}

	/**
	 * Get API key prompt information based on provider
	 */
	private getApiKeyPromptInfo(provider: string): { hint: string; prompt: string } {
		switch (provider) {
			case "anthropic": {
				return { hint: "sk-ant-...", prompt: "Enter your Anthropic API key for this session:" };
			}

			case "aws-bedrock": {
				return { hint: "us-east-1|AKIA...|secret...", prompt: "Enter your AWS Bedrock credentials (region|access-key-id|secret-access-key):" };
			}

			case "azure-openai": {
				return { hint: "https://your.openai.azure.com|key|deployment", prompt: "Enter your Azure OpenAI credentials (endpoint|api-key|deployment-name):" };
			}

			case "google": {
				return { hint: "AIza...", prompt: "Enter your Google API key for this session:" };
			}

			case "ollama": {
				return { hint: "localhost:11434", prompt: "Enter your Ollama host (host:port or host:port|custom-model):" };
			}

			case "openai": {
				return { hint: "sk-...", prompt: "Enter your OpenAI API key for this session:" };
			}

			default: {
				return { hint: "", prompt: "Enter your API key for this session:" };
			}
		}
	}
}
