/**
 * Interface for executing commands.
 * Provides a method for executing shell commands.
 */
export interface ICommandService {
	/**
	 * Executes a shell command.
	 * @param command - The shell command to execute
	 * @returns Promise that resolves when the command completes successfully
	 * @throws May throw an error if the command execution fails
	 */
	execute(command: string): Promise<void>;

	/**
	 * Execute a command and return its output
	 * @param command - The command to execute
	 * @returns Promise that resolves to the command output
	 */
	executeWithOutput(command: string): Promise<string>;
} 