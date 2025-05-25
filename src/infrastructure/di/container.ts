import { createContainer } from "@elsikora/cladi";

import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";
import type { ICommitValidator } from "../../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";
import type { ILLMService } from "../../application/interface/llm-service.interface.js";

import { ConfigureLLMUseCase } from "../../application/use-case/configure-llm.use-case.js";
import { GenerateCommitMessageUseCase } from "../../application/use-case/generate-commit-message.use-case.js";
import { ManualCommitUseCase } from "../../application/use-case/manual-commit.use-case.js";
import { ValidateCommitMessageUseCase } from "../../application/use-case/validate-commit-message.use-case.js";

import { CommitlintValidatorService } from "../commit-validator/commitlint-validator.service.js";
import { GitCommitRepository } from "../git/git-commit.repository.js";
import { AnthropicLLMService } from "../llm/anthropic-llm.service.js";
import { OpenAILLMService } from "../llm/openai-llm.service.js";
import { CosmicConfigService } from "../service/cosmic-config.service.js";
import { NodeCommandService } from "../service/node-command.service.js";
import { NodeFileSystemService } from "../service/node-file-system.service.js";
import { PromptsCliInterface } from "../service/prompts-cli-interface.service.js";

// Service tokens
export const FileSystemServiceToken = Symbol("FileSystemService");
export const CliInterfaceServiceToken = Symbol("CliInterfaceService");
export const CommandServiceToken = Symbol("CommandService");
export const ConfigServiceToken = Symbol("ConfigService");
export const CommitValidatorToken = Symbol("CommitValidator");
export const CommitRepositoryToken = Symbol("CommitRepository");
export const LLMServicesToken = Symbol("LLMServices");

// Use case tokens
export const GenerateCommitMessageUseCaseToken = Symbol("GenerateCommitMessageUseCase");
export const ValidateCommitMessageUseCaseToken = Symbol("ValidateCommitMessageUseCase");
export const ConfigureLLMUseCaseToken = Symbol("ConfigureLLMUseCase");
export const ManualCommitUseCaseToken = Symbol("ManualCommitUseCase");

/**
 * Create and configure the dependency injection container
 */
export function createAppContainer() {
	const container = createContainer({});

	// Register infrastructure services
	container.register(FileSystemServiceToken, new NodeFileSystemService());
	container.register(CliInterfaceServiceToken, new PromptsCliInterface());
	
	const cliInterface = container.get<ICliInterfaceService>(CliInterfaceServiceToken)!;
	container.register(CommandServiceToken, new NodeCommandService(cliInterface));
	
	const fileSystem = container.get<IFileSystemService>(FileSystemServiceToken)!;
	container.register(ConfigServiceToken, new CosmicConfigService(fileSystem));
	
	// Register LLM services
	const llmServices: ILLMService[] = [
		new OpenAILLMService(),
		new AnthropicLLMService(),
	];
	container.register(LLMServicesToken, llmServices);

	// Register commit validator with LLM services
	container.register(CommitValidatorToken, new CommitlintValidatorService(llmServices));
	
	const commandService = container.get<ICommandService>(CommandServiceToken)!;
	container.register(CommitRepositoryToken, new GitCommitRepository(commandService));

	// Register use cases
	container.register(
		GenerateCommitMessageUseCaseToken,
		new GenerateCommitMessageUseCase(llmServices)
	);

	const validator = container.get<ICommitValidator>(CommitValidatorToken)!;
	container.register(
		ValidateCommitMessageUseCaseToken,
		new ValidateCommitMessageUseCase(validator)
	);

	const configService = container.get<IConfigService>(ConfigServiceToken)!;
	container.register(
		ConfigureLLMUseCaseToken,
		new ConfigureLLMUseCase(configService, cliInterface)
	);

	container.register(
		ManualCommitUseCaseToken,
		new ManualCommitUseCase(cliInterface)
	);

	return container;
} 