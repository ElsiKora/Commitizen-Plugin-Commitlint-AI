import type { ICliInterfaceServiceSelectOptions } from "../../application/interface/cli-interface-service-select-options.interface.js";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";
import type { ICommandService } from "../../application/interface/command-service.interface.js";

import { exec } from "node:child_process";
import { promisify } from "node:util";

import chalk from "chalk";

interface INodeError extends Error {
	cmd?: string;
	code?: number | string;
	isKilled?: boolean;
	signal?: null | string;
	stderr?: string;
	stdout?: string;
}

/**
 * Implementation of the command service using Node.js child_process.
 * Provides functionality to execute shell commands.
 */
export class NodeCommandService implements ICommandService {
	/** CLI interface service for user interaction */
	readonly CLI_INTERFACE_SERVICE: ICliInterfaceService;

	/**
	 * Promisified version of the exec function from child_process.
	 * Allows for async/await usage of command execution.
	 */
	private readonly EXEC_ASYNC: (argument1: string) => Promise<{ stderr: string; stdout: string }> = promisify(exec);

	constructor(cliInterfaceService: ICliInterfaceService) {
		this.CLI_INTERFACE_SERVICE = cliInterfaceService;
	}

	/**
	 * Executes a shell command.
	 * @param command - The shell command to execute
	 * @returns Promise that resolves when the command completes successfully
	 * @throws Will throw an error if the command execution fails, except for npm install which offers retry options
	 */
	async execute(command: string): Promise<void> {
		try {
			await this.EXEC_ASYNC(command);
		} catch (error) {
			// Check if the failed command is npm
			if (command.trim().startsWith("npm install") || command.trim().startsWith("npm ci") || command.trim().startsWith("npm update") || command.trim().startsWith("npm uninstall")) {
				this.formatAndParseNpmError(command, error as INodeError);
				await this.handleNpmInstallFailure(command);
			} else {
				// For non-npm commands, throw the error as before
				throw error;
			}
		}
	}

	/**
	 * Execute a command and return its output
	 * @param command - The command to execute
	 * @returns Promise that resolves to the command output
	 */
	async executeWithOutput(command: string): Promise<string> {
		try {
			const { stdout }: { stdout: string } = await this.EXEC_ASYNC(command);

			return stdout.trim();
		} catch (error) {
			this.CLI_INTERFACE_SERVICE.handleError(`Failed to execute command: ${command}`, error);

			throw error;
		}
	}

	/**
	 * Formate and parse npm error to readable format
	 * @param command - The original npm command that failed
	 * @param error - Error npm object
	 * @returns void
	 */
	private formatAndParseNpmError(command: string, error: INodeError): void {
		// Форматируем и выводим ошибку
		console.error(chalk.red.bold("🚨 NPM Command Failed"));
		console.error(chalk.gray(`Command: ${command}`));
		console.error(chalk.red("Error Details:"));

		// Парсим stderr для структурированного вывода
		if (error.stderr) {
			const lines: Array<string> = error.stderr.split("\n").filter((line: string) => line.trim());
			let errorCode: null | string = null;
			const conflictDetails: Array<string> = [];
			let resolutionAdvice: null | string = null;
			let logFile: null | string = null;

			for (const line of lines) {
				if (line.includes("npm error code")) {
					errorCode = line.replace("npm error code", "").trim();
				} else if (line.includes("While resolving") || line.includes("Found") || line.includes("Could not resolve dependency") || line.includes("Conflicting peer dependency")) {
					conflictDetails.push(line.replace("npm error", "").trim());
				} else if (line.includes("Fix the upstream dependency conflict") || line.includes("--force") || line.includes("--legacy-peer-deps")) {
					resolutionAdvice = line.replace("npm error", "").trim();
				} else if (line.includes("A complete log of this run can be found in")) {
					logFile = line.replace("npm error", "").trim();
				}
			}

			// Выводим структурированную ошибку
			if (errorCode) {
				console.error(chalk.red(`  Code: ${errorCode}`));
			}

			if (conflictDetails.length > 0) {
				console.error(chalk.yellow("  Dependency Conflict:"));

				for (const detail of conflictDetails) console.error(chalk.yellow(`    - ${detail}`));
			}

			if (resolutionAdvice) {
				console.error(chalk.cyan("  Resolution:"));
				console.error(chalk.cyan(`    ${resolutionAdvice}`));
			}

			if (logFile) {
				console.error(chalk.gray(`  Log File: ${logFile}`));
			}
		} else {
			// Если stderr пустой, выводим общую информацию об ошибке
			console.error(chalk.red("Unknown error occurred"));
		}
	}

	/**
	 * Handles npm install command failures by offering retry options to the user.
	 * @param originalCommand - The original npm command that failed
	 * @returns Promise that resolves when the chosen action completes
	 * @throws Will throw an error if the user chooses to cancel or if retried command still fails
	 */
	private async handleNpmInstallFailure(originalCommand: string): Promise<void> {
		this.CLI_INTERFACE_SERVICE.warn("npm command exection failed.");

		const options: Array<ICliInterfaceServiceSelectOptions> = [
			{ label: "Retry with --force", value: "force" },
			{ label: "Retry with --legacy-peer-deps", value: "legacy-peer-deps" },
			{ label: "Cancel command execution", value: "cancel" },
		];

		const choice: string = await this.CLI_INTERFACE_SERVICE.select<string>("How would you like to proceed?", options);

		switch (choice) {
			case "force": {
				this.CLI_INTERFACE_SERVICE.info("Retrying with --force flag...");
				await this.EXEC_ASYNC(`${originalCommand} --force`);
				this.CLI_INTERFACE_SERVICE.success("Execution completed with --force flag.");

				break;
			}

			case "legacy-peer-deps": {
				this.CLI_INTERFACE_SERVICE.info("Retrying with --legacy-peer-deps flag...");
				await this.EXEC_ASYNC(`${originalCommand} --legacy-peer-deps`);
				this.CLI_INTERFACE_SERVICE.success("Execution completed with --legacy-peer-deps flag.");

				break;
			}

			case "cancel": {
				this.CLI_INTERFACE_SERVICE.info("Execution cancelled by user.");

				throw new Error("npm command execution was cancelled by user.");
			}

			default: {
				throw new Error("Invalid option selected.");
			}
		}
	}
}
