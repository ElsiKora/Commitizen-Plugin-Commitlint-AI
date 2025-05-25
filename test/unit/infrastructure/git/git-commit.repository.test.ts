import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitCommitRepository } from "../../../../src/infrastructure/git/git-commit.repository";
import { createMockCommitMessage } from "../../../mocks/commit-message.mock";
import type { ICommandService } from "../../../../src/application/interface/command-service.interface";

describe("GitCommitRepository", () => {
	let repository: GitCommitRepository;
	let mockCommandService: ICommandService;

	beforeEach(() => {
		// Create mock command service
		mockCommandService = {
			execute: vi.fn(),
			executeWithOutput: vi.fn(),
		};

		// Create repository instance
		repository = new GitCommitRepository(mockCommandService);

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe("commit", () => {
		it("should execute git commit with the message", async () => {
			// Arrange
			const commitMessage = createMockCommitMessage({
				type: "feat",
				scope: "core",
				subject: "add new feature",
			});

			// Act
			await repository.commit(commitMessage);

			// Assert
			expect(mockCommandService.execute).toHaveBeenCalledWith("git commit -m 'feat(core): add new feature'");
		});

		it("should escape single quotes in commit message", async () => {
			// Arrange
			const commitMessage = createMockCommitMessage({
				type: "fix",
				subject: "fix user's input validation",
			});

			// Act
			await repository.commit(commitMessage);

			// Assert
			expect(mockCommandService.execute).toHaveBeenCalledWith("git commit -m 'fix(test): fix user'\\''s input validation'");
		});

		it("should handle multi-line commit messages", async () => {
			// Arrange
			const commitMessage = createMockCommitMessage({
				type: "feat",
				subject: "add authentication",
				body: "Implemented OAuth2 authentication\nAdded JWT token support",
			});

			// Act
			await repository.commit(commitMessage);

			// Assert
			const expectedMessage = "feat(test): add authentication\n\nImplemented OAuth2 authentication\nAdded JWT token support";
			expect(mockCommandService.execute).toHaveBeenCalledWith(`git commit -m '${expectedMessage}'`);
		});

		it("should handle commit messages with breaking changes", async () => {
			// Arrange
			const commitMessage = createMockCommitMessage({
				type: "feat",
				subject: "redesign API",
				breaking: "All endpoints have changed",
			});

			// Act
			await repository.commit(commitMessage);

			// Assert
			const expectedMessage = "feat(test): redesign API\n\nBREAKING CHANGE: All endpoints have changed";
			expect(mockCommandService.execute).toHaveBeenCalledWith(`git commit -m '${expectedMessage}'`);
		});
	});

	describe("getCurrentBranch", () => {
		it("should return the current branch name", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("feature/auth");

			// Act
			const branch = await repository.getCurrentBranch();

			// Assert
			expect(branch).toBe("feature/auth");
			expect(mockCommandService.executeWithOutput).toHaveBeenCalledWith("git rev-parse --abbrev-ref HEAD");
		});

		it("should return 'main' when branch is empty", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("");

			// Act
			const branch = await repository.getCurrentBranch();

			// Assert
			expect(branch).toBe("main");
		});

		it("should handle HEAD state", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("HEAD");

			// Act
			const branch = await repository.getCurrentBranch();

			// Assert
			expect(branch).toBe("HEAD");
		});
	});

	describe("getStagedDiff", () => {
		it("should return the staged diff", async () => {
			// Arrange
			const mockDiff = `diff --git a/file.ts b/file.ts
index 123..456 789
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+console.log('new line');
 existing code`;
			(mockCommandService.executeWithOutput as any).mockResolvedValue(mockDiff);

			// Act
			const diff = await repository.getStagedDiff();

			// Assert
			expect(diff).toBe(mockDiff);
			expect(mockCommandService.executeWithOutput).toHaveBeenCalledWith("git diff --cached --stat -p --no-color");
		});

		it("should truncate long diffs", async () => {
			// Arrange
			const longDiff = "a".repeat(4000);
			(mockCommandService.executeWithOutput as any).mockResolvedValue(longDiff);

			// Act
			const diff = await repository.getStagedDiff();

			// Assert
			expect(diff.length).toBeLessThanOrEqual(3000 + 20); // 3000 + "... (truncated)"
			expect(diff.endsWith("... (truncated)")).toBe(true);
		});

		it("should return empty string on error", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockRejectedValue(new Error("git error"));

			// Act
			const diff = await repository.getStagedDiff();

			// Assert
			expect(diff).toBe("");
		});
	});

	describe("getStagedFiles", () => {
		it("should return list of staged files", async () => {
			// Arrange
			const mockOutput = "src/file1.ts\nsrc/file2.ts\nREADME.md";
			(mockCommandService.executeWithOutput as any).mockResolvedValue(mockOutput);

			// Act
			const files = await repository.getStagedFiles();

			// Assert
			expect(files).toEqual(["src/file1.ts", "src/file2.ts", "README.md"]);
			expect(mockCommandService.executeWithOutput).toHaveBeenCalledWith("git diff --cached --name-only");
		});

		it("should filter out empty lines", async () => {
			// Arrange
			const mockOutput = "src/file1.ts\n\n\nsrc/file2.ts\n";
			(mockCommandService.executeWithOutput as any).mockResolvedValue(mockOutput);

			// Act
			const files = await repository.getStagedFiles();

			// Assert
			expect(files).toEqual(["src/file1.ts", "src/file2.ts"]);
		});

		it("should return empty array when no files are staged", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("");

			// Act
			const files = await repository.getStagedFiles();

			// Assert
			expect(files).toEqual([]);
		});

		it("should return empty array on error", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockRejectedValue(new Error("git error"));

			// Act
			const files = await repository.getStagedFiles();

			// Assert
			expect(files).toEqual([]);
		});
	});

	describe("hasStagedChanges", () => {
		it("should return true when there are staged changes", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("src/file.ts");

			// Act
			const hasChanges = await repository.hasStagedChanges();

			// Assert
			expect(hasChanges).toBe(true);
			expect(mockCommandService.executeWithOutput).toHaveBeenCalledWith("git diff --cached --name-only");
		});

		it("should return false when there are no staged changes", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockResolvedValue("");

			// Act
			const hasChanges = await repository.hasStagedChanges();

			// Assert
			expect(hasChanges).toBe(false);
		});

		it("should return false on error", async () => {
			// Arrange
			(mockCommandService.executeWithOutput as any).mockRejectedValue(new Error("git error"));

			// Act
			const hasChanges = await repository.hasStagedChanges();

			// Assert
			expect(hasChanges).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("should handle special characters in file names", async () => {
			// Arrange
			const mockOutput = "src/file with spaces.ts\nsrc/file-with-dashes.ts\nsrc/file_with_underscores.ts";
			(mockCommandService.executeWithOutput as any).mockResolvedValue(mockOutput);

			// Act
			const files = await repository.getStagedFiles();

			// Assert
			expect(files).toEqual(["src/file with spaces.ts", "src/file-with-dashes.ts", "src/file_with_underscores.ts"]);
		});

		it("should handle unicode characters in commit messages", async () => {
			// Arrange
			const commitMessage = createMockCommitMessage({
				type: "feat",
				subject: "add 🚀 rocket feature",
			});

			// Act
			await repository.commit(commitMessage);

			// Assert
			expect(mockCommandService.execute).toHaveBeenCalledWith("git commit -m 'feat(test): add 🚀 rocket feature'");
		});
	});
});
