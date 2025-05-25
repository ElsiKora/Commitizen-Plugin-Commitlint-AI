import type { IContainer } from "@elsikora/cladi";

import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";
import type { ICommitValidator } from "../../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";
import type { ILlmService } from "../../application/interface/llm-service.interface.js";

import { createContainer } from "@elsikora/cladi";

import { ConfigureLLMUseCase as ConfigureLLMUseCaseImpl } from "../../application/use-case/configure-llm.use-case.js";
import { GenerateCommitMessageUseCase as GenerateCommitMessageUseCaseImpl } from "../../application/use-case/generate-commit-message.use-case.js";
import { ManualCommitUseCase as ManualCommitUseCaseImpl } from "../../application/use-case/manual-commit.use-case.js";
import { ValidateCommitMessageUseCase as ValidateCommitMessageUseCaseImpl } from "../../application/use-case/validate-commit-message.use-case.js";
import { CommitlintValidatorService } from "../commit-validator/commitlint-validator.service.js";
import { GitCommitRepository } from "../git/git-commit.repository.js";
import { AnthropicLlmService } from "../llm/anthropic-llm.service.js";
import { AWSBedrockLlmService } from "../llm/aws-bedrock-llm.service.js";
import { AzureOpenAILlmService } from "../llm/azure-openai-llm.service.js";
import { GoogleLlmService } from "../llm/google-llm.service.js";
import { OllamaLlmService } from "../llm/ollama-llm.service.js";
import { OpenAILlmService } from "../llm/openai-llm.service.js";
import { CosmicConfigService } from "../service/cosmic-config.service.js";
import { NodeCommandService } from "../service/node-command.service.js";
import { NodeFileSystemService } from "../service/node-file-system.service.js";
import { PromptsCliInterface } from "../service/prompts-cli-interface.service.js";

// Service tokens
export const FileSystemServiceToken: symbol = Symbol("FileSystemService");
export const CliInterfaceServiceToken: symbol = Symbol("CliInterfaceService");
export const CommandServiceToken: symbol = Symbol("CommandService");
export const ConfigServiceToken: symbol = Symbol("ConfigService");
export const CommitValidatorToken: symbol = Symbol("CommitValidator");
export const CommitRepositoryToken: symbol = Symbol("CommitRepository");
export const LLMServicesToken: symbol = Symbol("LLMServices");

// Use case tokens
export const GenerateCommitMessageUseCaseToken: symbol = Symbol("GenerateCommitMessageUseCase");
export const ValidateCommitMessageUseCaseToken: symbol = Symbol("ValidateCommitMessageUseCase");
export const ConfigureLLMUseCaseToken: symbol = Symbol("ConfigureLLMUseCase");
export const ManualCommitUseCaseToken: symbol = Symbol("ManualCommitUseCase");

/**
 * Create and configure the application DI container
 * @returns {IContainer} The configured DI container
 */
export function createAppContainer(): IContainer {
	const container: IContainer = createContainer({});

	// Register infrastructure services
	container.register(FileSystemServiceToken, new NodeFileSystemService());
	container.register(CliInterfaceServiceToken, new PromptsCliInterface());

	const cliInterface: ICliInterfaceService = container.get<ICliInterfaceService>(CliInterfaceServiceToken) ?? new PromptsCliInterface();
	const fileSystem: IFileSystemService = container.get<IFileSystemService>(FileSystemServiceToken) ?? new NodeFileSystemService();

	container.register(ConfigServiceToken, new CosmicConfigService(fileSystem));
	container.register(CommandServiceToken, new NodeCommandService(cliInterface));

	const commandService: ICommandService = container.get<ICommandService>(CommandServiceToken) ?? new NodeCommandService(cliInterface);

	container.register(CommitRepositoryToken, new GitCommitRepository(commandService));

	// Register LLM services
	const llmServices: Array<ILlmService> = [new OpenAILlmService(), new AnthropicLlmService(), new GoogleLlmService(), new AzureOpenAILlmService(), new AWSBedrockLlmService(), new OllamaLlmService()];
	container.register(LLMServicesToken, llmServices);

	// Register commit validator with LLM services
	container.register(CommitValidatorToken, new CommitlintValidatorService(llmServices));

	const validator: ICommitValidator = container.get<ICommitValidator>(CommitValidatorToken) ?? new CommitlintValidatorService([]);
	const configService: IConfigService = container.get<IConfigService>(ConfigServiceToken) ?? new CosmicConfigService(fileSystem);

	// Register use cases
	container.register(ConfigureLLMUseCaseToken, new ConfigureLLMUseCaseImpl(configService, cliInterface));
	container.register(GenerateCommitMessageUseCaseToken, new GenerateCommitMessageUseCaseImpl(llmServices));
	container.register(ValidateCommitMessageUseCaseToken, new ValidateCommitMessageUseCaseImpl(validator));
	container.register(ManualCommitUseCaseToken, new ManualCommitUseCaseImpl(cliInterface));

	return container;
}
