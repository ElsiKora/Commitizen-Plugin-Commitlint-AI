import type { ECommitMode } from "@domain/enum/commit-mode.enum";

/**
 * Main configuration interface
 */
export interface IConfig {
	/**
	 * Number of retries for LLM generation
	 */
	maxRetries?: number;

	/**
	 * Commit mode (auto, manual)
	 */
	mode?: ECommitMode;

	/**
	 * Ticket extraction settings.
	 */
	ticket?: Partial<ITicketConfig>;

	/**
	 * Number of retries for validation fixes
	 */
	validationMaxRetries?: number;
}
/**
 * Configuration for ticket extraction from branch names.
 */
export interface ITicketConfig {
	/**
	 * Behavior when source is branch-lint and config is not available.
	 */
	missingBranchLintBehavior: TTicketMissingBranchLintBehavior;

	/**
	 * How to normalize extracted ticket case before appending to commit footer.
	 */
	normalization: TTicketNormalization;

	/**
	 * Fallback regex pattern source used by local parser mode.
	 */
	pattern: string;

	/**
	 * Regex flags for local pattern matching.
	 */
	patternFlags: string;

	/**
	 * How to resolve ticket id from branch name.
	 */
	source: TTicketSource;
}
export type TTicketMissingBranchLintBehavior = "error" | "fallback";

export type TTicketNormalization = "lower" | "preserve" | "upper";

export type TTicketSource = "auto" | "branch-lint" | "none" | "pattern";
