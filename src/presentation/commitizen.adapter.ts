import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";

import type { ICliInterfaceService } from "../application/interface/cli-interface-service.interface.js";
import type { IConfig } from "../application/interface/config.interface.js";
import type { ILlmPromptContext } from "../application/interface/llm-service.interface.js";
import type { CommitMessage } from "../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../domain/entity/llm-configuration.entity.js";

import type { ICommitizenAdapterDependencies } from "./interface/commitizen-adapter-dependencies.interface.js";

import load from "@commitlint/load";

import { ECommitMode } from "../domain/enum/commit-mode.enum.js";
import { addTicketIdToCommitMessage } from "../domain/helper/add-ticket-to-commit.helper.js";

type TCommit = (message: string) => void;
type TLoadResult = { prompt?: UserPromptConfig; rules: QualifiedRules };

/**
 * Main adapter for Commitizen integration
 */
export class CommitizenAdapter {
	private readonly DEPENDENCIES: ICommitizenAdapterDependencies;

	constructor(dependencies: ICommitizenAdapterDependencies) {
		this.DEPENDENCIES = dependencies;
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
			const { cliInterface, commitRepository, configService, configureLLMUseCase, editCommitUseCase, generateCommitUseCase, manualCommitUseCase, promptContextExtractor, validateCommitUseCase, validator }: ICommitizenAdapterDependencies = this.DEPENDENCIES;

			// Extract context from commitlint config
			const promptContext: ILlmPromptContext = promptContextExtractor.extractContext(rules, prompt);

			// Add git diff and files to context for AI mode
			const [diff, files]: [string, Array<string>] = await Promise.all([commitRepository.getStagedDiff(), commitRepository.getStagedFiles()]);

			promptContext.diff = diff;
			promptContext.files = files.join("\n");

			// Get or configure LLM
			let llmConfig: LLMConfiguration | null = null;
			const isConfigExists: boolean = await configService.exists();

			if (this.isMockMode()) {
				llmConfig = await configureLLMUseCase.getMockConfiguration();
			} else if (isConfigExists) {
				// Configuration exists - load it first to show details
				const config: IConfig = await configService.get();

				// Ask if they want to use existing configuration
				const modeInfo: string = config.mode === ECommitMode.AUTO ? `${config.mode} mode, AI-Core profile` : `${config.mode ?? "unconfigured"} mode`;
				const isUseExisting: boolean = await cliInterface.confirm(`Found existing configuration (${modeInfo}). Use it?`, true);

				if (isUseExisting) {
					llmConfig = await configureLLMUseCase.getCurrentConfiguration();
				} else {
					cliInterface.info("Let's reconfigure...");
					llmConfig = await configureLLMUseCase.configureInteractively();
				}
			} else {
				// No configuration at all
				cliInterface.info("No configuration found. Let's set it up!");
				llmConfig = await configureLLMUseCase.configureInteractively();
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
		if (this.isMockMode()) {
			cliInterface.success("🎭 Mock mode: Commit NOT executed (MOCK_LLM=true)");
			cliInterface.note("Final commit message that would be used:", message);
			cliInterface.info("In mock mode, staged files remain in staging area for manual cleanup");
		} else {
			commit(message);
		}
	}

	private isMockMode(): boolean {
		return process.env.MOCK_LLM === "true" || process.env.MOCK_LLM === "1";
	}
}
