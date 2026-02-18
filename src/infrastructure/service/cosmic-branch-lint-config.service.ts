import type { PublicExplorer } from "cosmiconfig";

import type { IBranchLintConfig, IBranchLintConfigService } from "../../application/interface/branch-lint-config.interface.js";

import { cosmiconfig } from "cosmiconfig";

import { CONFIG_FILE_DIRECTORY } from "../../application/constant/config-file-directory.constant.js";
import { BRANCH_LINT_CONFIG_MODULE_NAME, BRANCH_LINT_PACKAGE_PROPERTY } from "../../domain/constant/ticket.constant.js";

/**
 * Reads git-branch-lint configuration using cosmiconfig.
 */
export class CosmicBranchLintConfigService implements IBranchLintConfigService {
	private readonly EXPLORER: PublicExplorer;

	constructor() {
		this.EXPLORER = cosmiconfig(BRANCH_LINT_CONFIG_MODULE_NAME, {
			packageProp: BRANCH_LINT_PACKAGE_PROPERTY,
			searchPlaces: [
				"package.json",
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.json`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.yaml`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.yml`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.js`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.ts`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.mjs`,
				`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.cjs`,
				`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.js`,
				`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.ts`,
				`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.mjs`,
				`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.cjs`,
			],
		});
	}

	/**
	 * Load git-branch-lint configuration from repository root.
	 * @returns {Promise<IBranchLintConfig | null>} Parsed config or null when not found.
	 */
	async load(): Promise<IBranchLintConfig | null> {
		const result: { config: IBranchLintConfig; filepath: string; isEmpty?: boolean } | null = await this.EXPLORER.search();

		if (!result || result.isEmpty || !result.config) {
			return null;
		}

		return result.config;
	}
}
