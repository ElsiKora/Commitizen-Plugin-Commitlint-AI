/**
 * Subset of git-branch-lint config used by commit ticket integration.
 */
export interface IBranchLintConfig {
	branches?: Array<string> | Record<string, unknown>;
	rules?: IBranchLintRules;
}

/**
 * Service for reading git-branch-lint configuration from the repository.
 */
export interface IBranchLintConfigService {
	/**
	 * Load branch lint configuration.
	 * @returns {Promise<IBranchLintConfig | null>} Parsed configuration or null when not found.
	 */
	load(): Promise<IBranchLintConfig | null>;
}

/**
 * Subset of git-branch-lint rules used by commit ticket integration.
 */
export interface IBranchLintRules {
	"branch-pattern"?: string;
	"branch-subject-pattern"?: TBranchLintSubjectPattern;
}

/**
 * Branch subject pattern format from git-branch-lint config.
 */
export type TBranchLintSubjectPattern = Record<string, string> | string;
