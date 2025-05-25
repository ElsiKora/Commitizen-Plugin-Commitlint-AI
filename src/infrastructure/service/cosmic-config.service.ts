/* eslint-disable @elsikora/typescript/no-magic-numbers */
import type { PublicExplorer } from "cosmiconfig";

import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IConfig } from "../../application/interface/config.interface.js";
import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";

import { cosmiconfig } from "cosmiconfig";
import { stringify } from "javascript-stringify";
import yaml from "yaml";

import { CONFIG_FILE_DIRECTORY } from "../../application/constant/config-file-directory.constant.js";
import { CONFIG_MODULE_NAME } from "../../application/constant/config-module-name.constant.js";

/**
 * Implementation of ConfigService that uses cosmiconfig for configuration management.
 * Cosmiconfig searches for configuration in standard locations and formats.
 */
export class CosmicConfigService implements IConfigService {
	/** File system service for file operations */
	readonly FILE_SYSTEM_SERVICE: IFileSystemService;

	private cachedConfig: IConfig | null = null;

	private readonly EXPLORER: PublicExplorer;

	/**
	 * Initializes a new instance of the CosmicConfigService.
	 * @param fileSystemService
	 */
	constructor(fileSystemService: IFileSystemService) {
		this.FILE_SYSTEM_SERVICE = fileSystemService;

		this.EXPLORER = cosmiconfig(CONFIG_MODULE_NAME, {
			packageProp: `${CONFIG_FILE_DIRECTORY.replace(".", "")}.${CONFIG_MODULE_NAME}`,
			searchPlaces: [
				"package.json",
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.json`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.yaml`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.yml`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.js`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.ts`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.mjs`,
				`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.cjs`,
				`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.js`,
				`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.ts`,
				`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.mjs`,
				`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.cjs`,
			],
		});
	}

	/**
	 * Clears all caches.
	 */
	public clearCaches(): void {
		this.cachedConfig = null;
		this.EXPLORER.clearCaches();
	}

	/**
	 * Checks if the configuration exists.
	 * @returns Promise resolving to true if the configuration exists, false otherwise
	 */
	public async exists(): Promise<boolean> {
		const result: { config: IConfig; filepath: string; isEmpty?: boolean } | null = await this.EXPLORER.search();

		return result !== null && !result.isEmpty;
	}

	/**
	 * Retrieves the current configuration.
	 * @returns Promise resolving to the configuration object
	 */
	public async get(): Promise<IConfig> {
		if (this.cachedConfig) {
			return this.cachedConfig;
		}

		const result: { config: IConfig; filepath: string; isEmpty?: boolean } | null = await this.EXPLORER.search();

		if (result?.config) {
			this.cachedConfig = result.config;

			return this.cachedConfig;
		}

		return {} as IConfig;
	}

	/**
	 * Gets a specific property from the configuration.
	 * @param property - The property key to retrieve
	 * @returns Promise resolving to the value of the specified property
	 */
	public async getProperty<K extends keyof IConfig>(property: K): Promise<IConfig[K]> {
		const config: IConfig = await this.get();

		return config[property];
	}

	/**
	 * Merges partial configuration with the existing configuration.
	 * @param partial - Partial configuration to merge
	 * @returns Promise that resolves when the merged configuration is saved
	 */
	public async merge(partial: Partial<IConfig>): Promise<void> {
		try {
			const config: IConfig = await this.get();
			const merged: IConfig = { ...config, ...partial };
			await this.set(merged);
		} catch (error) {
			console.error("Error merging config:", error);
			await this.set(partial as IConfig);
		}
	}

	/**
	 * Saves the entire configuration.
	 * @param config - The complete configuration to save
	 * @returns Promise that resolves when the configuration is saved
	 */
	public async set(config: IConfig): Promise<void> {
		try {
			const result: { config: IConfig; filepath: string; isEmpty?: boolean } | null = await this.EXPLORER.search();

			const filePath: string = result?.filepath ?? `${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.js`;

			await this.writeFile(filePath, config);

			this.cachedConfig = config;
			this.EXPLORER.clearSearchCache();
		} catch (error) {
			console.error("Error saving configuration:", error);

			throw error;
		}
	}

	/**
	 * Sets a specific property in the configuration.
	 * @param property - The property key to set
	 * @param value - The value to assign to the property
	 * @returns Promise that resolves when the updated configuration is saved
	 */
	public async setProperty<K extends keyof IConfig>(property: K, value: IConfig[K]): Promise<void> {
		const config: IConfig = await this.get();
		config[property] = value;
		await this.set(config);
	}

	/**
	 * Writes configuration to a file.
	 * @param filepath - Path to write the configuration to
	 * @param config - Configuration to write
	 * @returns Promise that resolves when the file is written
	 */
	private async writeFile(filepath: string, config: IConfig): Promise<void> {
		const extension: string = this.FILE_SYSTEM_SERVICE.getExtensionFromFilePath(filepath);
		let content: string;

		switch (extension) {
			case ".cjs": {
				content = `module.exports = ${String(stringify(config, null, 2))};`;

				break;
			}

			case ".js": {
				content = `export default ${String(stringify(config, null, 2))};`;

				break;
			}

			case ".json": {
				content = String(stringify(config, null, 2));

				break;
			}

			case ".mjs": {
				content = `export default ${String(stringify(config, null, 2))};`;

				break;
			}

			case ".yaml": {
				content = yaml.stringify(config);

				break;
			}

			case ".yml": {
				content = yaml.stringify(config);

				break;
			}

			default: {
				content = JSON.stringify(config, null, 2);
			}
		}

		const directoryName: string = this.FILE_SYSTEM_SERVICE.getDirectoryNameFromFilePath(filepath);

		if (!(await this.FILE_SYSTEM_SERVICE.isPathExists(directoryName))) {
			await this.FILE_SYSTEM_SERVICE.createDirectory(directoryName, { isRecursive: true });
		}

		await this.FILE_SYSTEM_SERVICE.writeFile(filepath, content, "utf8");
	}
} 