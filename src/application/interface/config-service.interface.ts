import type { IConfig } from "./config.interface.js";
import type { IFileSystemService } from "./file-system-service.interface.js";

/**
 * Interface for managing application configuration.
 * Defines contract for reading, writing, and manipulating configuration settings.
 */
export interface IConfigService {
	/**
	 * Checks if the configuration exists.
	 * @returns Promise resolving to true if the configuration exists, false otherwise
	 */
	exists(): Promise<boolean>;

	/**
	 * File system service for file operations.
	 */
	FILE_SYSTEM_SERVICE: IFileSystemService;

	/**
	 * Retrieves the current configuration.
	 * @returns Promise resolving to the configuration object
	 */
	get(): Promise<IConfig>;

	/**
	 * Gets a specific property from the configuration.
	 * @param property - The property key to retrieve
	 * @returns Promise resolving to the value of the specified property
	 */
	getProperty<K extends keyof IConfig>(property: K): Promise<IConfig[K]>;

	/**
	 * Merges partial configuration with the existing configuration.
	 * @param partial - Partial configuration to merge
	 * @returns Promise that resolves when the merged configuration is saved
	 */
	merge(partial: Partial<IConfig>): Promise<void>;

	/**
	 * Saves the entire configuration.
	 * @param config - The complete configuration to save
	 * @returns Promise that resolves when the configuration is saved
	 */
	set(config: IConfig): Promise<void>;

	/**
	 * Sets a specific property in the configuration.
	 * @param property - The property key to set
	 * @param value - The value to assign to the property
	 * @returns Promise that resolves when the updated configuration is saved
	 */
	setProperty<K extends keyof IConfig>(property: K, value: IConfig[K]): Promise<void>;
} 