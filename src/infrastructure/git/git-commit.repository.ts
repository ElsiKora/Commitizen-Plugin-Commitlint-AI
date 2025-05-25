import type { ICommandService } from "../../application/interface/command-service.interface.js";
import type { ICommitRepository } from "../../application/interface/commit-repository.interface.js";
import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";

/**
 * Git implementation of the commit repository
 */
export class GitCommitRepository implements ICommitRepository {
	private readonly COMMAND_SERVICE: ICommandService;

	constructor(commandService: ICommandService) {
		this.COMMAND_SERVICE = commandService;
	}

	/**
	 * Create a commit with the given message
	 * @param message - The commit message
	 * @returns Promise that resolves when the commit is created
	 */
	async commit(message: CommitMessage): Promise<void> {
		// Escape the commit message for shell
		const escapedMessage: string = message.toString().replaceAll("'", String.raw`'\''`);

		// Execute git commit
		await this.COMMAND_SERVICE.execute(`git commit -m '${escapedMessage}'`);
	}

	/**
	 * Get the current branch name
	 * @returns Promise resolving to the current branch name
	 */
	async getCurrentBranch(): Promise<string> {
		const branch: string = await this.COMMAND_SERVICE.executeWithOutput("git rev-parse --abbrev-ref HEAD");

		return branch || "main";
	}

	/**
	 * Get the staged diff
	 * @returns Promise resolving to the staged diff
	 */
	async getStagedDiff(): Promise<string> {
		try {
			// Get a compact diff suitable for LLM context
			const diff: string = await this.COMMAND_SERVICE.executeWithOutput("git diff --cached --stat -p --no-color");
			// Limit diff size to avoid token limits
			const maxLength: number = 3000;

			if (diff.length > maxLength) {
				return diff.slice(0, Math.max(0, maxLength)) + "\n... (truncated)";
			}

			return diff;
		} catch {
			return "";
		}
	}

	/**
	 * Get the list of staged files
	 * @returns Promise resolving to the list of staged files
	 */
	async getStagedFiles(): Promise<Array<string>> {
		try {
			const output: string = await this.COMMAND_SERVICE.executeWithOutput("git diff --cached --name-only");

			return output.split("\n").filter((file: string) => file.trim().length > 0);
		} catch {
			return [];
		}
	}

	/**
	 * Check if there are staged changes
	 * @returns Promise resolving to true if there are staged changes
	 */
	async hasStagedChanges(): Promise<boolean> {
		try {
			const output: string = await this.COMMAND_SERVICE.executeWithOutput("git diff --cached --name-only");

			return output.length > 0;
		} catch {
			return false;
		}
	}
}
