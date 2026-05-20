import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ICommitRepository } from "@application/interface/commit-repository.interface";
import type { ICommitValidationResult, ICommitValidator } from "@application/interface/commit-validator.interface";
import type { ILlmPromptContext, ILlmService } from "@application/interface/llm-service.interface";
import type { CommitMessage } from "@domain/entity/commit-message.entity";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditCommitUseCase } from "@application/use-case/edit-commit.use-case";
import { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import { ECommitMode } from "@domain/enum/commit-mode.enum";
import { ApiKey } from "@domain/value-object/api-key.value-object";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";

const SUBJECT_MAX_LENGTH: number = 80;
const SUBJECT_MIN_LENGTH: number = 3;

const createMockCli = (): ICliInterfaceService =>
	({
		clear: vi.fn(),
		confirm: vi.fn(),
		error: vi.fn(),
		groupMultiselect: vi.fn(),
		handleError: vi.fn(),
		info: vi.fn(),
		log: vi.fn(),
		multiselect: vi.fn(),
		note: vi.fn(),
		select: vi.fn(),
		startSpinner: vi.fn(),
		stopSpinner: vi.fn(),
		success: vi.fn(),
		text: vi.fn(),
		updateSpinner: vi.fn(),
		warn: vi.fn(),
	}) as unknown as ICliInterfaceService;

describe("EditCommitUseCase", () => {
	let cli: ICliInterfaceService;
	let validator: ICommitValidator;
	let repository: ICommitRepository;
	let llmService: ILlmService;
	let useCase: EditCommitUseCase;
	let context: ILlmPromptContext;

	beforeEach(() => {
		cli = createMockCli();
		validator = {
			fix: vi.fn(),
			validate: vi.fn().mockResolvedValue({ isValid: true } as ICommitValidationResult),
		};
		repository = {
			commit: vi.fn(),
			getCurrentBranch: vi.fn().mockResolvedValue("feature/cas-25-login"),
			getStagedDiff: vi.fn().mockResolvedValue(""),
			getStagedFiles: vi.fn().mockResolvedValue([]),
			getTicketIdFromBranch: vi.fn().mockResolvedValue(""),
			hasStagedChanges: vi.fn().mockResolvedValue(true),
		};
		llmService = {
			generateCommitMessage: vi.fn().mockResolvedValue(createMockCommitMessage({ scope: "auth", subject: "generated message", type: "feat" })),
		};

		useCase = new EditCommitUseCase(cli, validator, llmService, repository);
		context = {
			subject: {
				description: "Describe subject",
				maxLength: SUBJECT_MAX_LENGTH,
				minLength: SUBJECT_MIN_LENGTH,
			},
			typeDescriptions: {
				feat: { description: "feature" },
				fix: { description: "fix" },
			},
			typeEnum: ["feat", "fix"],
		};
	});

	it("returns original message when user confirms", async () => {
		const message: CommitMessage = createMockCommitMessage({ scope: "core", subject: "keep this message", type: "feat" });
		vi.mocked(cli.select).mockResolvedValue("confirm");

		const result: CommitMessage = await useCase.execute(message, context);

		expect(result).toBe(message);
		expect(validator.validate).toHaveBeenCalledWith(message);
	});

	it("adds ticket reference after regenerate when ticket is detected", async () => {
		const message: CommitMessage = createMockCommitMessage({ scope: "core", subject: "old message", type: "feat" });
		const llmConfig: LLMConfiguration = new LLMConfiguration(new ApiKey("test"), ECommitMode.AUTO);
		vi.mocked(cli.select).mockResolvedValueOnce("regenerate").mockResolvedValueOnce("confirm");
		vi.mocked(repository.getTicketIdFromBranch).mockResolvedValue("CAS-25");

		const result: CommitMessage = await useCase.execute(message, context, llmConfig);

		expect(llmService.generateCommitMessage).toHaveBeenCalledTimes(1);
		expect(result.toString()).toContain("Refs CAS-25.");
	});
});
