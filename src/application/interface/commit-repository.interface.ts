import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";

/**
 * Interface for commit repository operations
 */
export interface ICommitRepository {
	/**
	 * Create a commit with the given message
	 * @param message - The commit message
	 * @returns Promise that resolves when the commit is created
	 */
	commit(message: CommitMessage): Promise<void>;

	/**
	 * Get the current branch name
	 * @returns Promise resolving to the current branch name
	 */
	getCurrentBranch(): Promise<string>;

	/**
	 * Check if there are staged changes
	 * @returns Promise resolving to true if there are staged changes
	 */
	hasStagedChanges(): Promise<boolean>;

	/**
	 * Get the staged diff
	 * @returns Promise resolving to the staged diff
	 */
	getStagedDiff(): Promise<string>;

	/**
	 * Get the list of staged files
	 * @returns Promise resolving to the list of staged files
	 */
	getStagedFiles(): Promise<string[]>;
} 