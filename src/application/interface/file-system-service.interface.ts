/**
 * Interface for file system operations.
 * Provides methods for reading, writing, and managing files and directories.
 */
export interface IFileSystemService {
	/**
	 * Creates a directory at the specified path.
	 * @param path - The path to the directory to create
	 * @param options - Optional configuration for directory creation
	 * @param options.isRecursive - Whether to create parent directories if they don't exist
	 * @returns Promise that resolves when the directory is created
	 */
	createDirectory(path: string, options?: { isRecursive: boolean }): Promise<void>;

	/**
	 * Deletes a file at the specified path.
	 * @param path - The path to the file to delete
	 * @returns Promise that resolves when the file is deleted
	 */
	deleteFile(path: string): Promise<void>;

	/**
	 * Gets the directory name from a file path.
	 * @param filePath
	 * @returns The directory name
	 */
	getDirectoryNameFromFilePath(filePath: string): string;

	/**
	 * Gets the extension from a file path.
	 * @param filePath
	 * @returns The file extension
	 */
	getExtensionFromFilePath(filePath: string): string;

	/**
	 * Checks if any of the provided paths exist and returns the first existing path.
	 * @param paths - Array of paths to check
	 * @returns Promise that resolves to the first existing path or undefined if none exist
	 */
	isOneOfPathsExists(paths: Array<string>): Promise<string | undefined>;

	/**
	 * Checks if a file or directory exists at the specified path.
	 * @param path - The path to check
	 * @returns Promise that resolves to true if the path exists, false otherwise
	 */
	isPathExists(path: string): Promise<boolean>;

	/**
	 * Reads the contents of a file.
	 * @param path - The path to the file to read
	 * @param encoding - The encoding to use when reading the file, defaults to "utf8"
	 * @returns Promise that resolves to the file contents as a string
	 */
	// eslint-disable-next-line @elsikora/javascript/no-undef
	readFile(path: string, encoding?: BufferEncoding): Promise<string>;

	/**
	 * Writes content to a file, creating the file and parent directories if they don't exist.
	 * @param path - The path to the file to write
	 * @param content - The content to write to the file
	 * @param encoding - The encoding to use when writing the file, defaults to "utf8"
	 * @returns Promise that resolves when the file is written
	 */
	// eslint-disable-next-line @elsikora/javascript/no-undef
	writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
}
