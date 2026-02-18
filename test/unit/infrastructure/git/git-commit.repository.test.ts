import type { Mock } from "vitest";

import type { ICommandService } from "../../../../src/application/interface/command-service.interface";
import type { ITicketIdParser } from "../../../../src/application/interface/ticket-id-parser.interface";
import type { CommitMessage } from "../../../../src/domain/entity/commit-message.entity";
import type { TicketId } from "../../../../src/domain/value-object/ticket-id.value-object";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { TicketId as TicketIdValueObject } from "../../../../src/domain/value-object/ticket-id.value-object";
import { GitCommitRepository } from "../../../../src/infrastructure/git/git-commit.repository";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";

const LARGE_DIFF_LENGTH: number = 4000;
const MAX_DIFF_LENGTH: number = 3000;
const TRUNCATED_SUFFIX: string = "\n... (truncated)";

type TExecuteMock = (command: string) => Promise<void>;
type TExecuteWithOutputMock = (command: string) => Promise<string>;
type TParseFromBranchNameMock = (branchName: string) => Promise<TicketId | undefined>;

describe("GitCommitRepository", () => {
	let executeMock: Mock<TExecuteMock>;
	let executeWithOutputMock: Mock<TExecuteWithOutputMock>;
	let parseFromBranchNameMock: Mock<TParseFromBranchNameMock>;
	let repository: GitCommitRepository;

	beforeEach(() => {
		executeMock = vi.fn<TExecuteMock>();
		executeWithOutputMock = vi.fn<TExecuteWithOutputMock>();
		parseFromBranchNameMock = vi.fn<TParseFromBranchNameMock>();

		const mockCommandService: ICommandService = {
			execute: executeMock,
			executeWithOutput: executeWithOutputMock,
		};

		const mockTicketIdParser: ITicketIdParser = {
			parseFromBranchName: parseFromBranchNameMock,
		};

		repository = new GitCommitRepository(mockCommandService, mockTicketIdParser);
		vi.clearAllMocks();
	});

	describe("commit", () => {
		it("should execute git commit with the message", async () => {
			const commitMessage: CommitMessage = createMockCommitMessage({
				scope: "core",
				subject: "add new feature",
				type: "feat",
			});

			await repository.commit(commitMessage);

			expect(executeMock).toHaveBeenCalledWith("git commit -m 'feat(core): add new feature'");
		});

		it("should escape single quotes in commit message", async () => {
			const commitMessage: CommitMessage = createMockCommitMessage({
				subject: "fix user's input validation",
				type: "fix",
			});

			await repository.commit(commitMessage);

			expect(executeMock).toHaveBeenCalledWith(String.raw`git commit -m 'fix(test): fix user'\''s input validation'`);
		});

		it("should handle multi-line commit messages", async () => {
			const commitMessage: CommitMessage = createMockCommitMessage({
				body: "Implemented OAuth2 authentication\nAdded JWT token support",
				subject: "add authentication",
				type: "feat",
			});

			await repository.commit(commitMessage);

			const expectedMessage: string = "feat(test): add authentication\n\nImplemented OAuth2 authentication\nAdded JWT token support";
			expect(executeMock).toHaveBeenCalledWith(`git commit -m '${expectedMessage}'`);
		});

		it("should handle commit messages with breaking changes", async () => {
			const commitMessage: CommitMessage = createMockCommitMessage({
				breaking: "All endpoints have changed",
				subject: "redesign API",
				type: "feat",
			});

			await repository.commit(commitMessage);

			const expectedMessage: string = "feat(test): redesign API\n\nBREAKING CHANGE: All endpoints have changed";
			expect(executeMock).toHaveBeenCalledWith(`git commit -m '${expectedMessage}'`);
		});
	});

	describe("getCurrentBranch", () => {
		it("should return the current branch name", async () => {
			executeWithOutputMock.mockResolvedValue("feature/auth");

			const branchName: string = await repository.getCurrentBranch();

			expect(branchName).toBe("feature/auth");
			expect(executeWithOutputMock).toHaveBeenCalledWith("git rev-parse --abbrev-ref HEAD");
		});

		it("should return 'main' when branch is empty", async () => {
			executeWithOutputMock.mockResolvedValue("");

			const branchName: string = await repository.getCurrentBranch();

			expect(branchName).toBe("main");
		});

		it("should handle HEAD state", async () => {
			executeWithOutputMock.mockResolvedValue("HEAD");

			const branchName: string = await repository.getCurrentBranch();

			expect(branchName).toBe("HEAD");
		});
	});

	describe("getTicketIdFromBranch", () => {
		it("returns parsed ticket id when parser finds it", async () => {
			executeWithOutputMock.mockResolvedValue("feature/LINER-91-commit-message-flow");
			parseFromBranchNameMock.mockResolvedValue(TicketIdValueObject.tryCreate("LINER-91"));

			const ticketId: string | undefined = await repository.getTicketIdFromBranch();

			expect(ticketId).toBe("LINER-91");
			expect(parseFromBranchNameMock).toHaveBeenCalledWith("feature/LINER-91-commit-message-flow");
		});

		it("returns undefined when parser does not find ticket id", async () => {
			executeWithOutputMock.mockResolvedValue("feature/no-ticket-here");
			parseFromBranchNameMock.mockResolvedValue(TicketIdValueObject.tryCreate("invalid-ticket"));

			const ticketId: string | undefined = await repository.getTicketIdFromBranch();

			expect(ticketId).toBeUndefined();
		});
	});

	describe("getStagedDiff", () => {
		it("should return the staged diff", async () => {
			const mockDiff: string = `diff --git a/file.ts b/file.ts
index 123..456 789
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+console.log('new line');
 existing code`;
			executeWithOutputMock.mockResolvedValue(mockDiff);

			const diff: string = await repository.getStagedDiff();

			expect(diff).toBe(mockDiff);
			expect(executeWithOutputMock).toHaveBeenCalledWith("git diff --cached --stat -p --no-color");
		});

		it("should truncate long diffs", async () => {
			const longDiff: string = "a".repeat(LARGE_DIFF_LENGTH);
			executeWithOutputMock.mockResolvedValue(longDiff);

			const diff: string = await repository.getStagedDiff();
			const maxAllowedLength: number = MAX_DIFF_LENGTH + TRUNCATED_SUFFIX.length;

			expect(diff.length).toBeLessThanOrEqual(maxAllowedLength);
			expect(diff.endsWith(TRUNCATED_SUFFIX)).toBe(true);
		});

		it("should return empty string on error", async () => {
			executeWithOutputMock.mockRejectedValue(new Error("git error"));

			const diff: string = await repository.getStagedDiff();

			expect(diff).toBe("");
		});
	});

	describe("getStagedFiles", () => {
		it("should return list of staged files", async () => {
			const mockOutput: string = "src/file1.ts\nsrc/file2.ts\nREADME.md";
			executeWithOutputMock.mockResolvedValue(mockOutput);

			const files: Array<string> = await repository.getStagedFiles();

			expect(files).toEqual(["src/file1.ts", "src/file2.ts", "README.md"]);
			expect(executeWithOutputMock).toHaveBeenCalledWith("git diff --cached --name-only");
		});

		it("should filter out empty lines", async () => {
			const mockOutput: string = "src/file1.ts\n\n\nsrc/file2.ts\n";
			executeWithOutputMock.mockResolvedValue(mockOutput);

			const files: Array<string> = await repository.getStagedFiles();

			expect(files).toEqual(["src/file1.ts", "src/file2.ts"]);
		});

		it("should return empty array when no files are staged", async () => {
			executeWithOutputMock.mockResolvedValue("");

			const files: Array<string> = await repository.getStagedFiles();

			expect(files).toEqual([]);
		});

		it("should return empty array on error", async () => {
			executeWithOutputMock.mockRejectedValue(new Error("git error"));

			const files: Array<string> = await repository.getStagedFiles();

			expect(files).toEqual([]);
		});
	});

	describe("hasStagedChanges", () => {
		it("should return true when there are staged changes", async () => {
			executeWithOutputMock.mockResolvedValue("src/file.ts");

			const hasStagedChanges: boolean = await repository.hasStagedChanges();

			expect(hasStagedChanges).toBe(true);
			expect(executeWithOutputMock).toHaveBeenCalledWith("git diff --cached --name-only");
		});

		it("should return false when there are no staged changes", async () => {
			executeWithOutputMock.mockResolvedValue("");

			const hasStagedChanges: boolean = await repository.hasStagedChanges();

			expect(hasStagedChanges).toBe(false);
		});

		it("should return false on error", async () => {
			executeWithOutputMock.mockRejectedValue(new Error("git error"));

			const hasStagedChanges: boolean = await repository.hasStagedChanges();

			expect(hasStagedChanges).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle special characters in file names", async () => {
			const mockOutput: string = "src/file with spaces.ts\nsrc/file-with-dashes.ts\nsrc/file_with_underscores.ts";
			executeWithOutputMock.mockResolvedValue(mockOutput);

			const files: Array<string> = await repository.getStagedFiles();

			expect(files).toEqual(["src/file with spaces.ts", "src/file-with-dashes.ts", "src/file_with_underscores.ts"]);
		});

		it("should handle unicode characters in commit messages", async () => {
			const commitMessage: CommitMessage = createMockCommitMessage({
				subject: "add 🚀 rocket feature",
				type: "feat",
			});

			await repository.commit(commitMessage);

			expect(executeMock).toHaveBeenCalledWith("git commit -m 'feat(test): add 🚀 rocket feature'");
		});
	});
});
