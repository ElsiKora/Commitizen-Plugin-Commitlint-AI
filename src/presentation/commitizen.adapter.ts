import type { IContainer } from "@elsikora/cladi";
import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { CommitMessage } from "../domain/entity/commit-message.entity.js";

import load from "@commitlint/load";




import { ConfigureLLMUseCase } from "../application/use-case/configure-llm.use-case.js";
import { GenerateCommitMessageUseCase } from "../application/use-case/generate-commit-message.use-case.js";
import { ManualCommitUseCase } from "../application/use-case/manual-commit.use-case.js";
import { ValidateCommitMessageUseCase } from "../application/use-case/validate-commit-message.use-case.js";
import { ILLMPromptContext } from "../application/interface/llm-service.interface.js";
import { ICliInterfaceService } from "../application/interface/cli-interface-service.interface.js";
import { 
	createAppContainer,
	ConfigureLLMUseCaseToken,
	GenerateCommitMessageUseCaseToken,
	ManualCommitUseCaseToken,
	ValidateCommitMessageUseCaseToken,
	CliInterfaceServiceToken,
	CommitRepositoryToken,
	CommitValidatorToken,
	ConfigServiceToken
} from "../infrastructure/di/container.js";

import type { ICommitRepository } from "../application/interface/commit-repository.interface.js";
import type { ICommitValidator } from "../application/interface/commit-validator.interface.js";
import { CommitlintValidatorService } from "../infrastructure/commit-validator/commitlint-validator.service.js";
import type { IConfigService } from "../application/interface/config-service.interface.js";

type Commit = (message: string) => void;

/**
 * Main adapter for Commitizen integration
 */
export class CommitizenAdapter {
	private container: IContainer;

	constructor() {
		this.container = createAppContainer();
	}

	/**
	 * Main entry point for commitizen
	 * @param inquirerIns - Instance passed by commitizen (unused in our implementation)
	 * @param commit - Callback to execute with complete commit message
	 */
	async prompter(
		_inquirerIns: any,
		commit: Commit
	): Promise<void> {
		const { prompt = {}, rules } = await load();
		
		try {
			// Get use cases from container
			const configureLLMUseCase = this.container.get<ConfigureLLMUseCase>(ConfigureLLMUseCaseToken)!;
			const generateCommitUseCase = this.container.get<GenerateCommitMessageUseCase>(GenerateCommitMessageUseCaseToken)!;
			const validateCommitUseCase = this.container.get<ValidateCommitMessageUseCase>(ValidateCommitMessageUseCaseToken)!;
			const manualCommitUseCase = this.container.get<ManualCommitUseCase>(ManualCommitUseCaseToken)!;
			const cliInterface = this.container.get<ICliInterfaceService>(CliInterfaceServiceToken)!;
			const commitRepository = this.container.get<ICommitRepository>(CommitRepositoryToken)!;

			// Extract context from commitlint config
			const promptContext = this.extractLLMPromptContext(rules, prompt);

			// Add git diff and files to context for AI mode
			const [diff, files] = await Promise.all([
				commitRepository.getStagedDiff(),
				commitRepository.getStagedFiles()
			]);
			
			promptContext.diff = diff;
			promptContext.files = files.join("\n");

			// Get or configure LLM
			let llmConfig = await configureLLMUseCase.getCurrentConfiguration();
			const configExists = await this.container.get<IConfigService>(ConfigServiceToken)!.exists();
			
			if (!configExists) {
				// No configuration at all
				cliInterface.info("No configuration found. Let's set it up!");
				llmConfig = await configureLLMUseCase.configureInteractively();
				
				// Check if we need to prompt for API key after configuration
				if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
					// Ask for API key
					const apiKeyValue = await cliInterface.text(
						`Enter your API key for this session:`,
						llmConfig.getProvider() === "openai" ? "sk-..." : "sk-ant-...",
						undefined,
						(value: string) => {
							if (!value || value.trim().length === 0) {
								return "API key is required";
							}
							return undefined;
						}
					);
					
					// Create new configuration with the provided API key
					const { ApiKey: ApiKeyClass } = await import("../domain/value-object/api-key.value-object.js");
					const { LLMConfiguration: LLMConfigurationClass } = await import("../domain/entity/llm-configuration.entity.js");
					
					llmConfig = new LLMConfigurationClass(
						llmConfig.getProvider(),
						new ApiKeyClass(apiKeyValue),
						llmConfig.getMode(),
						llmConfig.getModel(),
						llmConfig.getMaxRetries(),
						llmConfig.getValidationMaxRetries()
					);
				}
			} else {
				// Configuration exists - load it first to show details
				const config = await this.container.get<IConfigService>(ConfigServiceToken)!.get();
				
				// Ask if they want to use existing configuration
				const useExisting = await cliInterface.confirm(
					`Found existing configuration (${config.mode} mode${config.mode === 'auto' ? `, ${config.provider} provider` : ''}). Use it?`,
					true
				);

				if (!useExisting) {
					cliInterface.info("Let's reconfigure...");
					llmConfig = await configureLLMUseCase.configureInteractively();
					
					// Check if we need to prompt for API key after configuration
					if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
						// Ask for API key
						const apiKeyValue = await cliInterface.text(
							`Enter your API key for this session:`,
							llmConfig.getProvider() === "openai" ? "sk-..." : "sk-ant-...",
							undefined,
							(value: string) => {
								if (!value || value.trim().length === 0) {
									return "API key is required";
								}
								return undefined;
							}
						);
						
						// Create new configuration with the provided API key
						const { ApiKey: ApiKeyClass } = await import("../domain/value-object/api-key.value-object.js");
						const { LLMConfiguration: LLMConfigurationClass } = await import("../domain/entity/llm-configuration.entity.js");
						
						llmConfig = new LLMConfigurationClass(
							llmConfig.getProvider(),
							new ApiKeyClass(apiKeyValue),
							llmConfig.getMode(),
							llmConfig.getModel(),
							llmConfig.getMaxRetries(),
							llmConfig.getValidationMaxRetries()
						);
					}
				} else if (config.mode === 'auto' && !llmConfig) {
					// User wants to use existing config but API key is missing
					cliInterface.warn(`API key not found in ${config.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} environment variable.`);
					
					// Ask for API key
					const apiKeyValue = await cliInterface.text(
						`Enter your API key for this session:`,
						config.provider === "openai" ? "sk-..." : "sk-ant-...",
						undefined,
						(value: string) => {
							if (!value || value.trim().length === 0) {
								return "API key is required";
							}
							return undefined;
						}
					);
					
					// Create new configuration with the provided API key
					const { ApiKey: ApiKeyClass } = await import("../domain/value-object/api-key.value-object.js");
					const { LLMConfiguration: LLMConfigurationClass } = await import("../domain/entity/llm-configuration.entity.js");
					
					llmConfig = new LLMConfigurationClass(
						config.provider,
						new ApiKeyClass(apiKeyValue),
						config.mode,
						config.model,
						config.maxRetries || 3,
						config.validationMaxRetries || 3
					);
				}
			}

			// Configuration should exist at this point
			if (!llmConfig) {
				throw new Error("Failed to configure LLM settings");
			}

			// Check commit mode
			if (llmConfig.isManualMode()) {
				cliInterface.info("Using manual commit mode...");
				const commitMessage = await manualCommitUseCase.execute(promptContext);
				commit(commitMessage.toString());
				return;
			}

			// Auto mode - set LLM configuration on validator if it supports it
			const validator = this.container.get<ICommitValidator>(CommitValidatorToken);
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
					generatedMessage = await generateCommitUseCase.execute(
						promptContext, 
						llmConfig,
						(attempt, maxRetries, error) => {
							cliInterface.updateSpinner(`Generating commit message with AI... (Attempt ${attempt}/${maxRetries} failed: ${error.message})`);
						}
					);
				} catch (genError) {
					cliInterface.stopSpinner();
					throw genError;
				}
				
				cliInterface.stopSpinner();
				cliInterface.success("AI generated initial commit message");

				// Validate and fix if needed
				cliInterface.startSpinner("Validating commit message format...");
				
				// Track validation attempts
				let lastValidationAttempt = 0;
				const originalValidate = validateCommitUseCase.validate.bind(validateCommitUseCase);
				validateCommitUseCase.validate = async (message: CommitMessage) => {
					lastValidationAttempt++;
					if (lastValidationAttempt > 1) {
						cliInterface.updateSpinner(`Validating commit message format... (attempt ${lastValidationAttempt})`);
					}
					return originalValidate(message);
				};
				
				const validatedMessage = await validateCommitUseCase.execute(
					generatedMessage, 
					true, 
					llmConfig.getValidationMaxRetries(),
					promptContext
				);
				
				cliInterface.stopSpinner();
				
				// Restore original validate method
				validateCommitUseCase.validate = originalValidate;
				
				if (!validatedMessage) {
					cliInterface.warn("Could not generate a valid commit message. Switching to manual mode...");
					const commitMessage = await manualCommitUseCase.execute(promptContext);
					commit(commitMessage.toString());
					return;
				}

				// Show the generated message
				cliInterface.success("AI generated commit message successfully!");
				cliInterface.note("Generated commit message:", validatedMessage.toString());

				// Ask for confirmation
				const confirmed = await cliInterface.confirm(
					"Do you want to proceed with this commit message?",
					true
				);

				if (confirmed) {
					commit(validatedMessage.toString());
				} else {
					cliInterface.info("Switching to manual mode to edit the message...");
					const commitMessage = await manualCommitUseCase.execute(promptContext);
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
				
				const commitMessage = await manualCommitUseCase.execute(promptContext);
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
	private extractLLMPromptContext(rules: QualifiedRules, prompts: UserPromptConfig): ILLMPromptContext {
		const context: ILLMPromptContext = {
			subject: {},
			rules: rules, // Pass all commitlint rules to the LLM
		};

		// Extract type information
		if (rules["type-enum"]) {
			const [, , types] = rules["type-enum"];
			if (Array.isArray(types)) {
				context.typeEnum = types;
			}
		}

		// Extract type descriptions from prompts
		if (prompts.questions?.type?.enum) {
			context.typeDescriptions = {};
			for (const [key, value] of Object.entries(prompts.questions.type.enum)) {
				if (typeof value === "object" && value !== null && "description" in value) {
					context.typeDescriptions[key] = {
						description: value.description as string,
						emoji: (value as any).emoji,
					};
				}
			}
		}

		// Extract subject rules
		if (rules["subject-max-length"]) {
			const [, , maxLength] = rules["subject-max-length"];
			if (typeof maxLength === "number") {
				context.subject.maxLength = maxLength;
			}
		}

		if (rules["subject-min-length"]) {
			const [, , minLength] = rules["subject-min-length"];
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
} 