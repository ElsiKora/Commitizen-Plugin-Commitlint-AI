import type { IAiProfileService } from "@application/interface/ai-profile-service.interface";
import type { IBranchLintConfigService } from "@application/interface/branch-lint-config.interface";
import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ICommandService } from "@application/interface/command-service.interface";
import type { ICommitRepository } from "@application/interface/commit-repository.interface";
import type { ICommitValidator } from "@application/interface/commit-validator.interface";
import type { IConfigService } from "@application/interface/config-service.interface";
import type { IFileSystemService } from "@application/interface/file-system-service.interface";
import type { ILlmService } from "@application/interface/llm-service.interface";
import type { ITicketIdParser } from "@application/interface/ticket-id-parser.interface";
import type { IDIContainer, Token } from "@elsikora/cladi";

import { COMMITIZEN_AI_MODULE_CONSTANT } from "@application/constant/ai-core-module.constant";
import { PromptContextExtractorService } from "@application/service/prompt-context-extractor.service";
import { ConfigureLLMUseCase as ConfigureLLMUseCaseImpl } from "@application/use-case/configure-llm.use-case";
import { EditCommitUseCase as EditCommitUseCaseImpl } from "@application/use-case/edit-commit.use-case";
import { GenerateCommitMessageUseCase as GenerateCommitMessageUseCaseImpl } from "@application/use-case/generate-commit-message.use-case";
import { ManualCommitUseCase as ManualCommitUseCaseImpl } from "@application/use-case/manual-commit.use-case";
import { ValidateCommitMessageUseCase as ValidateCommitMessageUseCaseImpl } from "@application/use-case/validate-commit-message.use-case";
import { AiCoreAdapter } from "@elsikora/ai-core";
import { createDIContainer, createToken } from "@elsikora/cladi";
import { CommitlintValidatorService } from "@infrastructure/commit-validator/commitlint-validator.service";
import { BranchTicketIdParser } from "@infrastructure/git/branch-ticket-id.parser";
import { GitCommitRepository } from "@infrastructure/git/git-commit.repository";
import { AiCoreLlmService } from "@infrastructure/llm/ai-core-llm.service";
import { MockLlmService } from "@infrastructure/llm/mock-llm.service";
import { AiCoreCliInterfaceService } from "@infrastructure/service/ai-core-cli-interface.service";
import { AiCoreProfileService } from "@infrastructure/service/ai-core-profile.service";
import { CosmicBranchLintConfigService } from "@infrastructure/service/cosmic-branch-lint-config.service";
import { CosmicConfigService } from "@infrastructure/service/cosmic-config.service";
import { NodeCommandService } from "@infrastructure/service/node-command.service";
import { NodeFileSystemService } from "@infrastructure/service/node-file-system.service";
import { PromptsCliInterface } from "@infrastructure/service/prompts-cli-interface.service";

// Service tokens
export const FileSystemServiceToken: Token<IFileSystemService> = createToken<IFileSystemService>("FileSystemService");
export const CliInterfaceServiceToken: Token<ICliInterfaceService> = createToken<ICliInterfaceService>("CliInterfaceService");
export const CommandServiceToken: Token<ICommandService> = createToken<ICommandService>("CommandService");
export const ConfigServiceToken: Token<IConfigService> = createToken<IConfigService>("ConfigService");
export const BranchLintConfigServiceToken: Token<IBranchLintConfigService> = createToken<IBranchLintConfigService>("BranchLintConfigService");
export const CommitValidatorToken: Token<ICommitValidator> = createToken<ICommitValidator>("CommitValidator");
export const CommitRepositoryToken: Token<ICommitRepository> = createToken<ICommitRepository>("CommitRepository");
export const LLMServiceToken: Token<ILlmService> = createToken<ILlmService>("LLMService");
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
	const llmService: ILlmService = isMockLlmEnabled() ? new MockLlmService() : new AiCoreLlmService(aiCoreAdapter, COMMITIZEN_AI_MODULE_CONSTANT.ID);
	const validator: ICommitValidator = new CommitlintValidatorService(llmService);
	const promptContextExtractor: PromptContextExtractorService = new PromptContextExtractorService();

	container.register({ provide: FileSystemServiceToken, useValue: fileSystem });
	container.register({ provide: CliInterfaceServiceToken, useValue: cliInterface });
	container.register({ provide: ConfigServiceToken, useValue: configService });
	container.register({ provide: BranchLintConfigServiceToken, useValue: branchLintConfigService });
	container.register({ provide: CommandServiceToken, useValue: commandService });
	container.register({ provide: CommitRepositoryToken, useValue: commitRepository });
	container.register({ provide: LLMServiceToken, useValue: llmService });
	container.register({ provide: AiProfileServiceToken, useValue: aiProfileService });
	container.register({ provide: CommitValidatorToken, useValue: validator });
	container.register({ provide: PromptContextExtractorServiceToken, useValue: promptContextExtractor });
	container.register({ provide: TicketIdParserToken, useValue: ticketIdParser });

	// Register use cases
	container.register({ provide: ConfigureLLMUseCaseToken, useValue: new ConfigureLLMUseCaseImpl(configService, cliInterface, aiProfileService) });
	container.register({ provide: GenerateCommitMessageUseCaseToken, useValue: new GenerateCommitMessageUseCaseImpl(llmService) });
	container.register({
		provide: ValidateCommitMessageUseCaseToken,
		useValue: new ValidateCommitMessageUseCaseImpl(validator, undefined, (message: string): void => {
			cliInterface.log(message);
		}),
	});
	container.register({ provide: ManualCommitUseCaseToken, useValue: new ManualCommitUseCaseImpl(cliInterface) });
	container.register({ provide: EditCommitUseCaseToken, useValue: new EditCommitUseCaseImpl(cliInterface, validator, llmService, commitRepository) });

	return container;
}

/**
 * Check whether the local mock LLM runtime should be used.
 * @returns {boolean} True when mock mode is enabled.
 */
function isMockLlmEnabled(): boolean {
	return process.env.MOCK_LLM === "true" || process.env.MOCK_LLM === "1";
}
