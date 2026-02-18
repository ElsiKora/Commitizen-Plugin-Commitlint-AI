import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { IContainer } from "@elsikora/cladi";

import type { ICliInterfaceService } from "../application/interface/cli-interface-service.interface.js";
import type { ICommitRepository } from "../application/interface/commit-repository.interface.js";
import type { ICommitValidator } from "../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../application/interface/config-service.interface.js";
import type { IConfig } from "../application/interface/config.interface.js";
import type { ILlmPromptContext } from "../application/interface/llm-service.interface.js";
import type { PromptContextExtractorService } from "../application/service/prompt-context-extractor.service.js";
import type { ConfigureLLMUseCase } from "../application/use-case/configure-llm.use-case.js";
import type { EditCommitUseCase } from "../application/use-case/edit-commit.use-case.js";
import type { GenerateCommitMessageUseCase } from "../application/use-case/generate-commit-message.use-case.js";
import type { ManualCommitUseCase } from "../application/use-case/manual-commit.use-case.js";
import type { ValidateCommitMessageUseCase } from "../application/use-case/validate-commit-message.use-case.js";
import type { CommitMessage } from "../domain/entity/commit-message.entity.js";

import load from "@commitlint/load";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../domain/constant/numeric.constant.js";
import { LLMConfiguration } from "../domain/entity/llm-configuration.entity.js";
import { ECommitMode } from "../domain/enum/commit-mode.enum.js";
import { addTicketIdToCommitMessage } from "../domain/helper/add-ticket-to-commit.helper.js";
import { ApiKey } from "../domain/value-object/api-key.value-object.js";
import { CliInterfaceServiceToken, CommitRepositoryToken, CommitValidatorToken, ConfigServiceToken, ConfigureLLMUseCaseToken, EditCommitUseCaseToken, GenerateCommitMessageUseCaseToken, ManualCommitUseCaseToken, PromptContextExtractorServiceToken, ValidateCommitMessageUseCaseToken } from "../infrastructure/di/container.js";

type TCommit = (message: string) => void;
type TLoadResult = { prompt?: UserPromptConfig; rules: QualifiedRules };

/**
 * Main adapter for Commitizen integration
 */
export class CommitizenAdapter {
	private readonly CONTAINER: IContainer;

	constructor(container: IContainer) {
		this.CONTAINER = container;
	}

	/**
	 * Main entry point for commitizen
	 * @param {unknown} _inquirerIns - Instance passed by commitizen (unused in our implementation)
	 * @param {TCommit} commit - Callback to execute with complete commit message
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
			const editCommitUseCase: EditCommitUseCase | undefined = this.CONTAINER.get<EditCommitUseCase>(EditCommitUseCaseToken);
			const cliInterface: ICliInterfaceService | undefined = this.CONTAINER.get<ICliInterfaceService>(CliInterfaceServiceToken);
			const commitRepository: ICommitRepository | undefined = this.CONTAINER.get<ICommitRepository>(CommitRepositoryToken);
			const configService: IConfigService | undefined = this.CONTAINER.get<IConfigService>(ConfigServiceToken);
			const promptContextExtractor: PromptContextExtractorService | undefined = this.CONTAINER.get<PromptContextExtractorService>(PromptContextExtractorServiceToken);

			if (!configureLLMUseCase || !generateCommitUseCase || !validateCommitUseCase || !manualCommitUseCase || !editCommitUseCase || !cliInterface || !commitRepository || !configService || !promptContextExtractor) {
				throw new Error("Failed to initialize required services");
			}

			// Extract context from commitlint config
			const promptContext: ILlmPromptContext = promptContextExtractor.extractContext(rules, prompt);

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
				const modeInfo: string = config.mode === ECommitMode.AUTO ? `${config.mode} mode, ${config.provider} provider` : `${config.mode} mode`;
				const isUseExisting: boolean = await cliInterface.confirm(`Found existing configuration (${modeInfo}). Use it?`, true);

				if (!isUseExisting) {
					cliInterface.info("Let's reconfigure...");
					llmConfig = await configureLLMUseCase.configureInteractively();

					// Check if we need to prompt for API key after configuration
					if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
						// Ask for API key
						const { hint, prompt }: { hint: string; prompt: string } = promptContextExtractor.getApiKeyPromptInfo(llmConfig.getProvider());

						const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
							if (!value || value.trim().length === 0) {
								return "API key is required";
							}

							// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
							return;
						});

						// Create new configuration with the provided API key
						llmConfig = new LLMConfiguration(llmConfig.getProvider(), new ApiKey(credentialValue), llmConfig.getMode(), llmConfig.getModel(), llmConfig.getMaxRetries(), llmConfig.getValidationMaxRetries());
					}
				} else if (config.mode === ECommitMode.AUTO && !llmConfig) {
					// User wants to use existing config but API key is missing
					const environmentVariableNames: Record<string, string> = {
						anthropic: "ANTHROPIC_API_KEY",
						"aws-bedrock": "AWS_BEDROCK_API_KEY",
						"azure-openai": "AZURE_OPENAI_API_KEY",
						google: "GOOGLE_API_KEY",
						ollama: "OLLAMA_API_KEY",
						openai: "OPENAI_API_KEY",
					};
					const environmentVariableName: string = environmentVariableNames[config.provider] ?? "";
					cliInterface.warn(`API key not found in ${environmentVariableName} environment variable.`);

					// Ask for API key
					const { hint, prompt }: { hint: string; prompt: string } = promptContextExtractor.getApiKeyPromptInfo(config.provider);

					const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}

						// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
						return;
					});

					// Create new configuration with the provided API key
					const maxRetries: number = config.maxRetries ?? DEFAULT_MAX_RETRIES;
					const validationMaxRetries: number = config.validationMaxRetries ?? DEFAULT_VALIDATION_MAX_RETRIES;
					llmConfig = new LLMConfiguration(config.provider, new ApiKey(credentialValue), config.mode, config.model, maxRetries, validationMaxRetries);
				}
			} else {
				// No configuration at all
				cliInterface.info("No configuration found. Let's set it up!");
				llmConfig = await configureLLMUseCase.configureInteractively();

				// Check if we need to prompt for API key after configuration
				if (llmConfig.isAutoMode() && llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
					// Ask for API key
					const { hint, prompt }: { hint: string; prompt: string } = promptContextExtractor.getApiKeyPromptInfo(llmConfig.getProvider());

					const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}

						// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
						return;
					});

					// Create new configuration with the provided API key
					llmConfig = new LLMConfiguration(llmConfig.getProvider(), new ApiKey(credentialValue), llmConfig.getMode(), llmConfig.getModel(), llmConfig.getMaxRetries(), llmConfig.getValidationMaxRetries());
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
				this.executeCommit(commit, commitMessage.toString(), cliInterface);

				return;
			}

			// Auto mode - set LLM configuration on validator if supported
			const validator: ICommitValidator | undefined = this.CONTAINER.get<ICommitValidator>(CommitValidatorToken);
			validator?.setLLMConfiguration?.(llmConfig);

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

				const validatedMessage: CommitMessage | null = await validateCommitUseCase.execute(generatedMessage, true, llmConfig.getValidationMaxRetries(), promptContext, (validationAttempt: number) => {
					if (validationAttempt > 1) {
						cliInterface.updateSpinner(`Validating commit message format... (attempt ${validationAttempt})`);
					}
				});

				cliInterface.stopSpinner();

				if (!validatedMessage) {
					cliInterface.warn("Could not generate a valid commit message. Switching to manual mode...");
					const commitMessage: CommitMessage = await manualCommitUseCase.execute(promptContext);
					this.executeCommit(commit, commitMessage.toString(), cliInterface);

					return;
				}

				// Add ticket ID from branch if exists
				let finalMessage: CommitMessage = validatedMessage;
				const ticketId: string | undefined = await commitRepository.getTicketIdFromBranch();

				if (ticketId) {
					finalMessage = addTicketIdToCommitMessage(validatedMessage, ticketId);
				}

				// Show the generated message
				cliInterface.success("AI generated commit message successfully!");
				cliInterface.note("Generated commit message:", finalMessage.toString());

				// Ask for confirmation
				const isConfirmed: boolean = await cliInterface.confirm("Do you want to proceed with this commit message?", true);

				if (isConfirmed) {
					this.executeCommit(commit, finalMessage.toString(), cliInterface);
				} else {
					cliInterface.info("Opening edit menu...");
					const editedMessage: CommitMessage = await editCommitUseCase.execute(finalMessage, promptContext, llmConfig);
					this.executeCommit(commit, editedMessage.toString(), cliInterface);
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
				this.executeCommit(commit, commitMessage.toString(), cliInterface);
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
	 * Execute commit or simulate it in mock mode
	 * @param {TCommit} commit - Callback to execute with complete commit message
	 * @param {string} message - The commit message to use
	 * @param {ICliInterfaceService} cliInterface - CLI interface for user interaction
	 */
	private executeCommit(commit: TCommit, message: string, cliInterface: ICliInterfaceService): void {
		const isMockMode: boolean = process.env.MOCK_LLM === "true" || process.env.MOCK_LLM === "1";

		if (isMockMode) {
			cliInterface.success("🎭 Mock mode: Commit NOT executed (MOCK_LLM=true)");
			cliInterface.note("Final commit message that would be used:", message);
			cliInterface.info("In mock mode, staged files remain in staging area for manual cleanup");
		} else {
			commit(message);
		}
	}
}
