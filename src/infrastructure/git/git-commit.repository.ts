import type { ICommandService } from "@application/interface/command-service.interface";
import type { ICommitRepository } from "@application/interface/commit-repository.interface";
import type { ITicketIdParser } from "@application/interface/ticket-id-parser.interface";
import type { CommitMessage } from "@domain/entity/commit-message.entity";
import type { TicketId } from "@domain/value-object/ticket-id.value-object";

/**
 * Git implementation of the commit repository
 */
export class GitCommitRepository implements ICommitRepository {
	private readonly COMMAND_SERVICE: ICommandService;

	private readonly TICKET_ID_PARSER: ITicketIdParser;

	constructor(commandService: ICommandService, ticketIdParser: ITicketIdParser) {
		this.COMMAND_SERVICE = commandService;
		this.TICKET_ID_PARSER = ticketIdParser;
	}

	/**
	 * Create a commit with the given message
	 * @param {CommitMessage} message - The commit message
	 * @returns {Promise<void>} Promise that resolves when the commit is created
	 */
	async commit(message: CommitMessage): Promise<void> {
		// Escape the commit message for shell
		const escapedMessage: string = message.toString().replaceAll("'", String.raw`'\''`);

		// Execute git commit
		await this.COMMAND_SERVICE.execute(`git commit -m '${escapedMessage}'`);
	}

	/**
	 * Get the current branch name
	 * @returns {Promise<string>} Promise resolving to the current branch name
	 */
	async getCurrentBranch(): Promise<string> {
		const branch: string = await this.COMMAND_SERVICE.executeWithOutput("git rev-parse --abbrev-ref HEAD");

		return branch || "main";
	}

	/**
	 * Get the staged diff
	 * @returns {Promise<string>} Promise resolving to the staged diff
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
	 * @returns {Promise<Array<string>>} Promise resolving to array of staged file paths
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
	 * Get the ticket ID from the current branch name
	 * Uses configured ticket source strategy (branch-lint or local pattern)
	 * @returns {Promise<string | undefined>} Promise resolving to the ticket ID if found, undefined otherwise
	 */
	async getTicketIdFromBranch(): Promise<string | undefined> {
		const branchName: string = await this.getCurrentBranch();
		const ticketId: TicketId | undefined = await this.TICKET_ID_PARSER.parseFromBranchName(branchName);

		return ticketId?.toString();
	}

	/**
	 * Check if there are staged changes
	 * @returns {Promise<boolean>} Promise resolving to true if there are staged changes
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
