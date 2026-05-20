import type { IDIContainer, Token } from "@elsikora/cladi";

import type { IAiProfileService } from "../../application/interface/ai-profile-service.interface.js";
import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config.interface.js";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";
import type { ICommitRepository } from "../../application/interface/commit-repository.interface.js";
import type { ICommitValidator } from "../../application/interface/commit-validator.interface.js";
import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";
import type { ILlmService } from "../../application/interface/llm-service.interface.js";
import type { ITicketIdParser } from "../../application/interface/ticket-id-parser.interface.js";

import { AiCoreAdapter } from "@elsikora/ai-core";
import { createDIContainer, createToken } from "@elsikora/cladi";

import { COMMITIZEN_AI_MODULE_CONSTANT } from "../../application/constant/ai-core-module.constant.js";
import { PromptContextExtractorService } from "../../application/service/prompt-context-extractor.service.js";
import { ConfigureLLMUseCase as ConfigureLLMUseCaseImpl } from "../../application/use-case/configure-llm.use-case.js";
import { EditCommitUseCase as EditCommitUseCaseImpl } from "../../application/use-case/edit-commit.use-case.js";
import { GenerateCommitMessageUseCase as GenerateCommitMessageUseCaseImpl } from "../../application/use-case/generate-commit-message.use-case.js";
import { ManualCommitUseCase as ManualCommitUseCaseImpl } from "../../application/use-case/manual-commit.use-case.js";
import { ValidateCommitMessageUseCase as ValidateCommitMessageUseCaseImpl } from "../../application/use-case/validate-commit-message.use-case.js";
import { CommitlintValidatorService } from "../commit-validator/commitlint-validator.service.js";
import { BranchTicketIdParser } from "../git/branch-ticket-id.parser.js";
import { GitCommitRepository } from "../git/git-commit.repository.js";
import { AiCoreLlmService } from "../llm/ai-core-llm.service.js";
import { MockLlmService } from "../llm/mock-llm.service.js";
import { AiCoreCliInterfaceService } from "../service/ai-core-cli-interface.service.js";
import { AiCoreProfileService } from "../service/ai-core-profile.service.js";
import { CosmicBranchLintConfigService } from "../service/cosmic-branch-lint-config.service.js";
import { CosmicConfigService } from "../service/cosmic-config.service.js";
import { NodeCommandService } from "../service/node-command.service.js";
import { NodeFileSystemService } from "../service/node-file-system.service.js";
import { PromptsCliInterface } from "../service/prompts-cli-interface.service.js";

// Service tokens
export const FileSystemServiceToken: Token<IFileSystemService> = createToken<IFileSystemService>("FileSystemService");
export const CliInterfaceServiceToken: Token<ICliInterfaceService> = createToken<ICliInterfaceService>("CliInterfaceService");
export const CommandServiceToken: Token<ICommandService> = createToken<ICommandService>("CommandService");
export const ConfigServiceToken: Token<IConfigService> = createToken<IConfigService>("ConfigService");
export const BranchLintConfigServiceToken: Token<IBranchLintConfigService> = createToken<IBranchLintConfigService>("BranchLintConfigService");
export const CommitValidatorToken: Token<ICommitValidator> = createToken<ICommitValidator>("CommitValidator");
export const CommitRepositoryToken: Token<ICommitRepository> = createToken<ICommitRepository>("CommitRepository");
export const LLMServicesToken: Token<Array<ILlmService>> = createToken<Array<ILlmService>>("LLMServices");
export const AiProfileServiceToken: Token<IAiProfileService> = createToken<IAiProfileService>("AiProfileService");
export const PromptContextExtractorServiceToken: Token<PromptContextExtractorService> = createToken<PromptContextExtractorService>("PromptContextExtractorService");
export const TicketIdParserToken: Token<ITicketIdParser> = createToken<ITicketIdParser>("TicketIdParser");

// Use case tokens
export const GenerateCommitMessageUseCaseToken: Token<GenerateCommitMessageUseCaseImpl> = createToken<GenerateCommitMessageUseCaseImpl>("GenerateCommitMessageUseCase");
export const ValidateCommitMessageUseCaseToken: Token<ValidateCommitMessageUseCaseImpl> = createToken<ValidateCommitMessageUseCaseImpl>("ValidateCommitMessageUseCase");
export const ConfigureLLMUseCaseToken: Token<ConfigureLLMUseCaseImpl> = createToken<ConfigureLLMUseCaseImpl>("ConfigureLLMUseCase");
export const ManualCommitUseCaseToken: Token<ManualCommitUseCaseImpl> = createToken<ManualCommitUseCaseImpl>("ManualCommitUseCase");
export const EditCommitUseCaseToken: Token<EditCommitUseCaseImpl> = createToken<EditCommitUseCaseImpl>("EditCommitUseCase");

/**
 * Create and configure the application DI container
 * @returns {IDIContainer} The configured DI container
 */
export function createAppContainer(): IDIContainer {
	const container: IDIContainer = createDIContainer({});

	const cliInterface: ICliInterfaceService = new PromptsCliInterface();
	const aiCoreAdapter: AiCoreAdapter = AiCoreAdapter.create({ cliInterface: new AiCoreCliInterfaceService(cliInterface) });
	const aiProfileService: IAiProfileService = new AiCoreProfileService(aiCoreAdapter);
	const fileSystem: IFileSystemService = new NodeFileSystemService();
	const commandService: ICommandService = new NodeCommandService(cliInterface);
	const configService: IConfigService = new CosmicConfigService(fileSystem);
	const branchLintConfigService: IBranchLintConfigService = new CosmicBranchLintConfigService();
	const ticketIdParser: ITicketIdParser = new BranchTicketIdParser(configService, branchLintConfigService);
	const commitRepository: ICommitRepository = new GitCommitRepository(commandService, ticketIdParser);
	const llmServices: Array<ILlmService> = [new MockLlmService(), new AiCoreLlmService(aiCoreAdapter, COMMITIZEN_AI_MODULE_CONSTANT.ID)];
	const validator: ICommitValidator = new CommitlintValidatorService(llmServices);
	const promptContextExtractor: PromptContextExtractorService = new PromptContextExtractorService();

	container.register({ provide: FileSystemServiceToken, useValue: fileSystem });
	container.register({ provide: CliInterfaceServiceToken, useValue: cliInterface });
	container.register({ provide: ConfigServiceToken, useValue: configService });
	container.register({ provide: BranchLintConfigServiceToken, useValue: branchLintConfigService });
	container.register({ provide: CommandServiceToken, useValue: commandService });
	container.register({ provide: CommitRepositoryToken, useValue: commitRepository });
	container.register({ provide: LLMServicesToken, useValue: llmServices });
	container.register({ provide: AiProfileServiceToken, useValue: aiProfileService });
	container.register({ provide: CommitValidatorToken, useValue: validator });
	container.register({ provide: PromptContextExtractorServiceToken, useValue: promptContextExtractor });
	container.register({ provide: TicketIdParserToken, useValue: ticketIdParser });

	// Register use cases
	container.register({ provide: ConfigureLLMUseCaseToken, useValue: new ConfigureLLMUseCaseImpl(configService, cliInterface, aiProfileService) });
	container.register({ provide: GenerateCommitMessageUseCaseToken, useValue: new GenerateCommitMessageUseCaseImpl(llmServices) });
	container.register({
		provide: ValidateCommitMessageUseCaseToken,
		useValue: new ValidateCommitMessageUseCaseImpl(validator, undefined, (message: string): void => {
			cliInterface.log(message);
		}),
	});
	container.register({ provide: ManualCommitUseCaseToken, useValue: new ManualCommitUseCaseImpl(cliInterface) });
	container.register({ provide: EditCommitUseCaseToken, useValue: new EditCommitUseCaseImpl(cliInterface, validator, llmServices, commitRepository) });

	return container;
}
