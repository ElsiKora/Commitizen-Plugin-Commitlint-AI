import type { IFileSystemService } from "../../application/interface/file-system-service.interface.js";

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Implementation of the file system service using Node.js fs/promises API.
 * Provides methods for managing files and directories.
 */
export class NodeFileSystemService implements IFileSystemService {
	/**
	 * Creates a directory at the specified path.
	 * @param {string} directoryPath - The path to the directory to create
	 * @param {{ isRecursive: boolean }} options - Optional configuration for directory creation
	 * @param {boolean} options.isRecursive - Whether to create parent directories if they don't exist
	 * @returns {Promise<void>} Promise that resolves when the directory is created
	 */
	async createDirectory(directoryPath: string, options?: { isRecursive: boolean }): Promise<void> {
		directoryPath = path.dirname(directoryPath);
		// eslint-disable-next-line @elsikora/typescript/naming-convention
		await fs.mkdir(directoryPath, { recursive: options?.isRecursive });
	}

	/**
	 * Deletes a file at the specified path.
	 * @param {string} filePath - The path to the file to delete
	 * @returns {Promise<void>} Promise that resolves when the file is deleted
	 */
	async deleteFile(filePath: string): Promise<void> {
		await fs.unlink(filePath);
	}

	/**
	 * Gets the directory name from a file path.
	 * @param {string} filePath - The file path to extract the directory from
	 * @returns {string} The directory name
	 */
	getDirectoryNameFromFilePath(filePath: string): string {
		return path.dirname(filePath);
	}

	/**
	 * Gets the extension from a file path.
	 * @param {string} filePath - The file path to extract the extension from
	 * @returns {string} The file extension
	 */
	getExtensionFromFilePath(filePath: string): string {
		return path.extname(filePath);
	}

	/**
	 * Checks if any of the provided paths exist and returns the first existing path.
	 * @param {Array<string>} paths - Array of paths to check
	 * @returns {Promise<string | undefined>} Promise that resolves to the first existing path or undefined if none exist
	 */
	async isOneOfPathsExists(paths: Array<string>): Promise<string | undefined> {
		let existingFilePath: string | undefined = undefined;

		for (const path of paths) {
			if (await this.isPathExists(path)) {
				existingFilePath = path;

				break;
			}
		}

		return existingFilePath;
	}

	/**
	 * Checks if a file or directory exists at the specified path.
	 * @param {string} filePath - The path to check
	 * @returns {Promise<boolean>} Promise that resolves to true if the path exists, false otherwise
	 */
	async isPathExists(filePath: string): Promise<boolean> {
		try {
			await fs.access(filePath);

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Reads the contents of a file.
	 * @param {string} filePath - The path to the file to read
	 * @param {string} encoding - The encoding to use when reading the file, defaults to "utf8"
	 * @returns {Promise<string>} Promise that resolves to the file contents as a string
	 */
	// eslint-disable-next-line @elsikora/javascript/no-undef
	async readFile(filePath: string, encoding: BufferEncoding = "utf8"): Promise<string> {
		return await fs.readFile(filePath, { encoding });
	}

	/**
	 * Writes content to a file, creating the file and parent directories if they don't exist.
	 * @param {string} filePath - The path to the file to write
	 * @param {string} content - The content to write to the file
	 * @param {string} encoding - The encoding to use when writing the file, defaults to "utf8"
	 * @returns {Promise<void>} Promise that resolves when the file is written
	 */
	// eslint-disable-next-line @elsikora/javascript/no-undef
	async writeFile(filePath: string, content: string, encoding: BufferEncoding = "utf8"): Promise<void> {
		// eslint-disable-next-line @elsikora/typescript/naming-convention
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content, { encoding });
	}
}
