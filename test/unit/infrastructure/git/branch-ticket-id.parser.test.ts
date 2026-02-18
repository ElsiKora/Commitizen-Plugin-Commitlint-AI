import type { IBranchLintConfigService } from "../../../../src/application/interface/branch-lint-config.interface";
import type { IConfigService } from "../../../../src/application/interface/config-service.interface";
import type { TicketId } from "../../../../src/domain/value-object/ticket-id.value-object";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ECommitMode } from "../../../../src/domain/enum/commit-mode.enum";
import { ELLMProvider } from "../../../../src/domain/enum/llm-provider.enum";
import { BranchTicketIdParser } from "../../../../src/infrastructure/git/branch-ticket-id.parser";

describe("BranchTicketIdParser", () => {
	let branchLintConfigService: IBranchLintConfigService;
	let configService: IConfigService;
	let parser: BranchTicketIdParser;

	beforeEach(() => {
		branchLintConfigService = {
			load: vi.fn(),
		};
		configService = {
			exists: vi.fn(),
			FILE_SYSTEM_SERVICE: {} as never,
			get: vi.fn(),
			getProperty: vi.fn(),
			merge: vi.fn(),
			set: vi.fn(),
			setProperty: vi.fn(),
		};
		parser = new BranchTicketIdParser(configService, branchLintConfigService);
	});

	it("parses ticket by local regex pattern mode", async () => {
		vi.mocked(configService.get).mockResolvedValue({
			mode: ECommitMode.MANUAL,
			provider: ELLMProvider.OPENAI,
			ticket: {
				normalization: "upper",
				pattern: "[a-z]{2,}-[0-9]+",
				patternFlags: "i",
				source: "pattern",
			},
		});

		const ticketId: TicketId | undefined = await parser.parseFromBranchName("feature/liner-12345-refactor-auth");

		expect(ticketId?.toString()).toBe("LINER-12345");
	});

	it("returns undefined when source is none", async () => {
		vi.mocked(configService.get).mockResolvedValue({
			mode: ECommitMode.MANUAL,
			provider: ELLMProvider.OPENAI,
			ticket: {
				source: "none",
			},
		});

		const ticketId: TicketId | undefined = await parser.parseFromBranchName("feature/liner-12345-refactor-auth");

		expect(ticketId).toBeUndefined();
	});

	it("uses branch-lint template and extracts ticket placeholder only", async () => {
		vi.mocked(configService.get).mockResolvedValue({
			mode: ECommitMode.MANUAL,
			provider: ELLMProvider.OPENAI,
			ticket: {
				missingBranchLintBehavior: "fallback",
				normalization: "preserve",
				pattern: "[a-z]{2,}-[0-9]+",
				patternFlags: "i",
				source: "branch-lint",
			},
		});
		vi.mocked(branchLintConfigService.load).mockResolvedValue({
			branches: {
				feature: { description: "Feature", title: "Feature" },
			},
			rules: {
				"branch-pattern": ":type/:ticket-:name",
				"branch-subject-pattern": "[a-z0-9-]+",
			},
		});

		const validTicket: TicketId | undefined = await parser.parseFromBranchName("feature/liner-4321-auth-refresh");
		const invalidTicket: TicketId | undefined = await parser.parseFromBranchName("feature/release-2026");

		expect(validTicket?.toString()).toBe("liner-4321");
		expect(invalidTicket).toBeUndefined();
	});

	it("falls back to local regex when branch-lint config is missing", async () => {
		vi.mocked(configService.get).mockResolvedValue({
			mode: ECommitMode.MANUAL,
			provider: ELLMProvider.OPENAI,
			ticket: {
				missingBranchLintBehavior: "fallback",
				normalization: "lower",
				pattern: "[a-z]{2,}-[0-9]+",
				patternFlags: "i",
				source: "branch-lint",
			},
		});
		vi.mocked(branchLintConfigService.load).mockResolvedValue(null);

		const ticketId: TicketId | undefined = await parser.parseFromBranchName("feature/LINER-9876-clean-architecture");

		expect(ticketId?.toString()).toBe("liner-9876");
	});

	it("throws when branch-lint is required but config is missing", async () => {
		vi.mocked(configService.get).mockResolvedValue({
			mode: ECommitMode.MANUAL,
			provider: ELLMProvider.OPENAI,
			ticket: {
				missingBranchLintBehavior: "error",
				source: "branch-lint",
			},
		});
		vi.mocked(branchLintConfigService.load).mockResolvedValue(null);

		await expect(parser.parseFromBranchName("feature/liner-9876-clean-architecture")).rejects.toThrow("Ticket source is set to branch-lint");
	});
});
