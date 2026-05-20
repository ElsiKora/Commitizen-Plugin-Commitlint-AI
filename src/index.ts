import type { IDIContainer } from "@elsikora/cladi";

import { CliInterfaceServiceToken, CommitRepositoryToken, CommitValidatorToken, ConfigServiceToken, ConfigureLLMUseCaseToken, createAppContainer, EditCommitUseCaseToken, GenerateCommitMessageUseCaseToken, ManualCommitUseCaseToken, PromptContextExtractorServiceToken, ValidateCommitMessageUseCaseToken } from "./infrastructure/di/container.js";
import { CommitizenAdapter } from "./presentation/commitizen.adapter.js";

import "dotenv/config";

// Initialize the DI container
const container: IDIContainer = createAppContainer();

// Create adapter instance
const adapter: CommitizenAdapter = new CommitizenAdapter({
	cliInterface: container.resolve(CliInterfaceServiceToken),
	commitRepository: container.resolve(CommitRepositoryToken),
	configService: container.resolve(ConfigServiceToken),
	configureLLMUseCase: container.resolve(ConfigureLLMUseCaseToken),
	editCommitUseCase: container.resolve(EditCommitUseCaseToken),
	generateCommitUseCase: container.resolve(GenerateCommitMessageUseCaseToken),
	manualCommitUseCase: container.resolve(ManualCommitUseCaseToken),
	promptContextExtractor: container.resolve(PromptContextExtractorServiceToken),
	validateCommitUseCase: container.resolve(ValidateCommitMessageUseCaseToken),
	validator: container.resolve(CommitValidatorToken),
});

/**
 * Commitizen adapter entry point
 * This function is called by Commitizen when running `git cz`
 * It delegates to the CommitizenAdapter to handle the interactive commit process
 * @param {unknown} inquirerInstance - The inquirer instance provided by Commitizen
 * @param {(message: string) => void} commit - Callback function to execute the commit with the generated message
 * @returns {Promise<void>} Promise that resolves when the commit process is complete
 */
export async function prompter(inquirerInstance: unknown, commit: (message: string) => void): Promise<void> {
	return adapter.prompter(inquirerInstance, commit);
}

// Export the prompter function for Commitizen
export default {
	prompter,
};

export * from "./application/index.js";
// Re-export types and utilities that might be needed by consumers
export * from "./domain/index.js";
