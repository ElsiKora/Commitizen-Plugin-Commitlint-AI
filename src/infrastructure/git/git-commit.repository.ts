import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitRepository } from "../../application/interface/commit-repository.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";

/**
 * Git implementation of the commit repository
 */
export class GitCommitRepository implements ICommitRepository {
	private readonly commandService: ICommandService;

	constructor(commandService: ICommandService) {
		this.commandService = commandService;
	}

	/**
	 * Create a commit with the given message
	 * @param message - The commit message
	 * @returns Promise that resolves when the commit is created
	 */
	async commit(message: CommitMessage): Promise<void> {
		// Escape the commit message for shell
		const escapedMessage = message.toString().replace(/'/g, "'\\''");
		
		// Execute git commit
		await this.commandService.execute(`git commit -m '${escapedMessage}'`);
	}

	/**
	 * Get the current branch name
	 * @returns Promise resolving to the current branch name
	 */
	async getCurrentBranch(): Promise<string> {
		const branch = await this.commandService.executeWithOutput("git rev-parse --abbrev-ref HEAD");
		return branch || "main";
	}

	/**
	 * Check if there are staged changes
	 * @returns Promise resolving to true if there are staged changes
	 */
	async hasStagedChanges(): Promise<boolean> {
		try {
			const output = await this.commandService.executeWithOutput("git diff --cached --name-only");
			return output.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Get the staged diff
	 * @returns Promise resolving to the staged diff
	 */
	async getStagedDiff(): Promise<string> {
		try {
			// Get a compact diff suitable for LLM context
			const diff = await this.commandService.executeWithOutput("git diff --cached --stat -p --no-color");
			// Limit diff size to avoid token limits
			const maxLength = 3000;
			if (diff.length > maxLength) {
				return diff.substring(0, maxLength) + "\n... (truncated)";
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
	async getStagedFiles(): Promise<string[]> {
		try {
			const output = await this.commandService.executeWithOutput("git diff --cached --name-only");
			return output.split("\n").filter(file => file.trim().length > 0);
		} catch {
			return [];
		}
	}
} 