import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ICommitRepository } from "@application/interface/commit-repository.interface";
import type { ICommitValidator } from "@application/interface/commit-validator.interface";
import type { IConfigService } from "@application/interface/config-service.interface";
import type { PromptContextExtractorService } from "@application/service/prompt-context-extractor.service";
import type { ConfigureLLMUseCase } from "@application/use-case/configure-llm.use-case";
import type { EditCommitUseCase } from "@application/use-case/edit-commit.use-case";
import type { GenerateCommitMessageUseCase } from "@application/use-case/generate-commit-message.use-case";
import type { ManualCommitUseCase } from "@application/use-case/manual-commit.use-case";
import type { ValidateCommitMessageUseCase } from "@application/use-case/validate-commit-message.use-case";

export interface ICommitizenAdapterDependencies {
	cliInterface: ICliInterfaceService;
	commitRepository: ICommitRepository;
	configService: IConfigService;
	configureLLMUseCase: ConfigureLLMUseCase;
	editCommitUseCase: EditCommitUseCase;
	generateCommitUseCase: GenerateCommitMessageUseCase;
	manualCommitUseCase: ManualCommitUseCase;
	promptContextExtractor: PromptContextExtractorService;
	validateCommitUseCase: ValidateCommitMessageUseCase;
	validator: ICommitValidator;
}
