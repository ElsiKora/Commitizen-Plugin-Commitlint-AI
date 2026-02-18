import type { IContainer } from "@elsikora/cladi";

import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config.interface.js";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";
import type { ICommitRepository } from "../../application/interface/commit-repository.interface.js";
import type { ICommitValidator } from "../../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";
import type { ILlmService } from "../../application/interface/llm-service.interface.js";
import type { ITicketIdParser } from "../../application/interface/ticket-id-parser.interface.js";

import { createContainer } from "@elsikora/cladi";

import { PromptContextExtractorService } from "../../application/service/prompt-context-extractor.service.js";
import { ConfigureLLMUseCase as ConfigureLLMUseCaseImpl } from "../../application/use-case/configure-llm.use-case.js";
import { EditCommitUseCase as EditCommitUseCaseImpl } from "../../application/use-case/edit-commit.use-case.js";
import { GenerateCommitMessageUseCase as GenerateCommitMessageUseCaseImpl } from "../../application/use-case/generate-commit-message.use-case.js";
import { ManualCommitUseCase as ManualCommitUseCaseImpl } from "../../application/use-case/manual-commit.use-case.js";
import { ValidateCommitMessageUseCase as ValidateCommitMessageUseCaseImpl } from "../../application/use-case/validate-commit-message.use-case.js";
import { CommitlintValidatorService } from "../commit-validator/commitlint-validator.service.js";
import { BranchTicketIdParser } from "../git/branch-ticket-id.parser.js";
import { GitCommitRepository } from "../git/git-commit.repository.js";
import { AnthropicLlmService } from "../llm/anthropic-llm.service.js";
import { AWSBedrockLlmService } from "../llm/aws-bedrock-llm.service.js";
import { AzureOpenAILlmService } from "../llm/azure-openai-llm.service.js";
import { GoogleLlmService } from "../llm/google-llm.service.js";
import { MockLlmService } from "../llm/mock-llm.service.js";
import { OllamaLlmService } from "../llm/ollama-llm.service.js";
import { OpenAILlmService } from "../llm/openai-llm.service.js";
import { CosmicBranchLintConfigService } from "../service/cosmic-branch-lint-config.service.js";
import { CosmicConfigService } from "../service/cosmic-config.service.js";
import { NodeCommandService } from "../service/node-command.service.js";
import { NodeFileSystemService } from "../service/node-file-system.service.js";
import { PromptsCliInterface } from "../service/prompts-cli-interface.service.js";

// Service tokens
export const FileSystemServiceToken: symbol = Symbol("FileSystemService");
export const CliInterfaceServiceToken: symbol = Symbol("CliInterfaceService");
export const CommandServiceToken: symbol = Symbol("CommandService");
export const ConfigServiceToken: symbol = Symbol("ConfigService");
export const BranchLintConfigServiceToken: symbol = Symbol("BranchLintConfigService");
export const CommitValidatorToken: symbol = Symbol("CommitValidator");
export const CommitRepositoryToken: symbol = Symbol("CommitRepository");
export const LLMServicesToken: symbol = Symbol("LLMServices");
export const PromptContextExtractorServiceToken: symbol = Symbol("PromptContextExtractorService");
export const TicketIdParserToken: symbol = Symbol("TicketIdParser");

// Use case tokens
export const GenerateCommitMessageUseCaseToken: symbol = Symbol("GenerateCommitMessageUseCase");
export const ValidateCommitMessageUseCaseToken: symbol = Symbol("ValidateCommitMessageUseCase");
export const ConfigureLLMUseCaseToken: symbol = Symbol("ConfigureLLMUseCase");
export const ManualCommitUseCaseToken: symbol = Symbol("ManualCommitUseCase");
export const EditCommitUseCaseToken: symbol = Symbol("EditCommitUseCase");

/**
 * Create and configure the application DI container
 * @returns {IContainer} The configured DI container
 */
export function createAppContainer(): IContainer {
	const container: IContainer = createContainer({});

	const cliInterface: ICliInterfaceService = new PromptsCliInterface();
	const fileSystem: IFileSystemService = new NodeFileSystemService();
	const commandService: ICommandService = new NodeCommandService(cliInterface);
	const configService: IConfigService = new CosmicConfigService(fileSystem);
	const branchLintConfigService: IBranchLintConfigService = new CosmicBranchLintConfigService();
	const ticketIdParser: ITicketIdParser = new BranchTicketIdParser(configService, branchLintConfigService);
	const commitRepository: ICommitRepository = new GitCommitRepository(commandService, ticketIdParser);
	const llmServices: Array<ILlmService> = [new MockLlmService(), new OpenAILlmService(), new AnthropicLlmService(), new GoogleLlmService(), new AzureOpenAILlmService(), new AWSBedrockLlmService(), new OllamaLlmService()];
	const validator: ICommitValidator = new CommitlintValidatorService(llmServices);
	const promptContextExtractor: PromptContextExtractorService = new PromptContextExtractorService();

	container.register(FileSystemServiceToken, fileSystem);
	container.register(CliInterfaceServiceToken, cliInterface);
	container.register(ConfigServiceToken, configService);
	container.register(BranchLintConfigServiceToken, branchLintConfigService);
	container.register(CommandServiceToken, commandService);
	container.register(CommitRepositoryToken, commitRepository);
	container.register(LLMServicesToken, llmServices);
	container.register(CommitValidatorToken, validator);
	container.register(PromptContextExtractorServiceToken, promptContextExtractor);
	container.register(TicketIdParserToken, ticketIdParser);

	// Register use cases
	container.register(ConfigureLLMUseCaseToken, new ConfigureLLMUseCaseImpl(configService, cliInterface));
	container.register(GenerateCommitMessageUseCaseToken, new GenerateCommitMessageUseCaseImpl(llmServices));
	container.register(ValidateCommitMessageUseCaseToken, new ValidateCommitMessageUseCaseImpl(validator));
	container.register(ManualCommitUseCaseToken, new ManualCommitUseCaseImpl(cliInterface));
	container.register(EditCommitUseCaseToken, new EditCommitUseCaseImpl(cliInterface, validator, llmServices, commitRepository));

	return container;
}
