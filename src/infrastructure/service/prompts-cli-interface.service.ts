/* eslint-disable @elsikora/sonar/no-duplicate-string,@elsikora/unicorn/no-process-exit */
import type { ICliInterfaceServiceSelectOptions } from "../../application/interface/cli-interface-service-select-options.interface.js";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface.js";

import chalk from "chalk";
// @ts-ignore
import ora from "ora";
import prompts from "prompts";

type TSpinner = {
	isSpinning?: boolean;
	start(): TSpinner;
	stop(): TSpinner;
	text: string;
};

/**
 * Implementation of the CLI interface service using the prompts library.
 * Provides methods for interacting with the user through the command line.
 */
export class PromptsCliInterface implements ICliInterfaceService {
	/** Reference to the active spinner instance */
	// @ts-ignore
	private spinner: TSpinner;

	/**
	 * Initializes a new instance of the PromptsCliInterface.
	 * Sets up the spinner for providing visual feedback during operations.
	 */
	constructor() {
		this.spinner = ora();
	}

	/**
	 * Clears the console screen.
	 */
	clear(): void {
		process.stdout.write("\u001Bc");
	}

	/**
	 * Displays a confirmation prompt to the user.
	 * @param {string} message - The message to display to the user
	 * @param {boolean} isConfirmedByDefault - The default value for the confirmation, defaults to false
	 * @returns {Promise<boolean>} Promise that resolves to the user's response (true for confirmed, false for declined)
	 */
	async confirm(message: string, isConfirmedByDefault: boolean = false): Promise<boolean> {
		try {
			const response: prompts.Answers<string> = await prompts({
				active: "Yes",
				inactive: "No",
				// eslint-disable-next-line @elsikora/typescript/naming-convention
				initial: isConfirmedByDefault,
				message,
				name: "value",
				type: "toggle",
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");

				process.exit(0);
			}

			return response.value as boolean;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	/**
	 * Displays an error message to the user.
	 * @param {string} message - The error message to display
	 */
	error(message: string): void {
		process.stderr.write(`${chalk.red(message)}\n`);
	}

	/**
	 * Displays a grouped multi-select prompt to the user.
	 * @param {string} message - The message to display to the user
	 * @param {Record<string, Array<ICliInterfaceServiceSelectOptions>>} options - Record of groups and their options
	 * @param {boolean} isRequired - Whether a selection is required, defaults to false
	 * @param {Array<string>} initialValues - Initial selected values
	 * @returns {Promise<Array<T>>} Promise that resolves to an array of selected values
	 * @template T - The type of the selected values
	 */
	async groupMultiselect<T>(message: string, options: Record<string, Array<ICliInterfaceServiceSelectOptions>>, isRequired: boolean = false, initialValues?: Array<string>): Promise<Array<T>> {
		// Convert options to a flat array with group prefixes
		// eslint-disable-next-line @elsikora/typescript/naming-convention
		const choices: Array<{ selected: boolean; title: string; value: string }> = [];

		for (const [group, groupOptions] of Object.entries(options)) {
			for (const opt of groupOptions) {
				choices.push({
					// eslint-disable-next-line @elsikora/typescript/naming-convention
					selected: initialValues?.includes(opt.value) ?? false,
					title: `${group}: ${opt.label}`,
					value: opt.value,
				});
			}
		}

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				// eslint-disable-next-line @elsikora/typescript/naming-convention
				instructions: false,
				message: `${message} (space to select)`,
				min: isRequired ? 1 : undefined,
				name: "values",
				type: "multiselect",
			});

			if (response.values === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.values as Array<T>;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	/**
	 * Handles and displays an error message with additional error details.
	 * @param {string} message - The error message to display
	 * @param {unknown} error - The error object or details
	 */
	handleError(message: string, error: unknown): void {
		process.stderr.write(`${chalk.red(message)}\n`);
		process.stderr.write(`${String(error)}\n`);
	}

	/**
	 * Displays an informational message to the user.
	 * @param {string} message - The info message to display
	 */
	info(message: string): void {
		process.stdout.write(`${chalk.blue(message)}\n`);
	}

	/**
	 * Displays a standard message to the user.
	 * @param {string} message - The message to display
	 */
	log(message: string): void {
		process.stdout.write(`${message}\n`);
	}

	/**
	 * Displays a multi-select prompt to the user.
	 * @param {string} message - The message to display to the user
	 * @param {Array<ICliInterfaceServiceSelectOptions>} options - Array of options to select from
	 * @param {boolean} isRequired - Whether a selection is required, defaults to false
	 * @param {Array<string>} initialValues - Initial selected values
	 * @returns {Promise<Array<T>>} Promise that resolves to an array of selected values
	 * @template T - The type of the selected values
	 */
	async multiselect<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, isRequired: boolean = false, initialValues?: Array<string>): Promise<Array<T>> {
		// eslint-disable-next-line @elsikora/typescript/naming-convention
		const choices: Array<{ selected: boolean; title: string; value: string }> = options.map((opt: ICliInterfaceServiceSelectOptions) => ({
			// eslint-disable-next-line @elsikora/typescript/naming-convention
			selected: initialValues?.includes(opt.value) ?? false,
			title: opt.label,
			value: opt.value,
		}));

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				// eslint-disable-next-line @elsikora/typescript/naming-convention
				instructions: false,
				message: `${message} (space to select)`,
				min: isRequired ? 1 : undefined,
				name: "values",
				type: "multiselect",
			});

			if (response.values === undefined) {
				this.error("Operation cancelled by user");

				process.exit(0);
			}

			return response.values as Array<T>;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	/**
	 * Displays a note to the user with a title and message.
	 * @param {string} title - The title of the note
	 * @param {string} message - The message content of the note
	 */
	note(title: string, message: string): void {
		const lines: Array<string> = message.split("\n");

		// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
		const width: number = Math.max(title.length, ...lines.map((line: string) => line.length)) + 4; // Add padding

		const top: string = `┌${"─".repeat(width)}┐`;
		const bottom: string = `└${"─".repeat(width)}┘`;

		// Create middle lines with padding
		// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
		const paddedTitle: string = ` ${title.padEnd(width - 2)} `;
		// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
		const paddedLines: Array<string> = lines.map((line: string) => ` ${line.padEnd(width - 2)} `);

		// Log the note box with styling
		process.stdout.write(`${chalk.dim(top)}\n`);
		process.stdout.write(`${chalk.dim("│") + chalk.bold(paddedTitle) + chalk.dim("│")}\n`);

		if (lines.length > 0) {
			// Add a separator line
			const separator: string = `├${"─".repeat(width)}┤`;
			process.stdout.write(`${chalk.dim(separator)}\n`);

			// Add message content
			for (const line of paddedLines) {
				process.stdout.write(`${chalk.dim("│") + chalk.dim(line) + chalk.dim("│")}\n`);
			}
		}

		process.stdout.write(`${chalk.dim(bottom)}\n`);
	}

	/**
	 * Displays a single select prompt to the user.
	 * @param {string} message - The message to display to the user
	 * @param {Array<ICliInterfaceServiceSelectOptions>} options - Array of options to select from
	 * @param {string} initialValue - Initial selected value
	 * @returns {Promise<T>} Promise that resolves to the selected value
	 * @template T - The type of the selected value
	 */
	async select<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, initialValue?: string): Promise<T> {
		const choices: Array<{ title: string; value: string }> = options.map((opt: ICliInterfaceServiceSelectOptions) => ({
			title: opt.label,
			value: opt.value,
		}));

		const initialIndex: number | undefined = initialValue ? choices.findIndex((choice: { title: string; value: string }) => choice.value === initialValue) : undefined;

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				initial: initialIndex === -1 ? 0 : initialIndex,
				message,
				name: "value",
				type: "select",
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.value as T;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	/**
	 * Starts a spinner with the specified message.
	 * Stops any existing spinner first.
	 * @param {string} message - The message to display while the spinner is active
	 */
	startSpinner(message: string): void {
		this.spinner.stop();
		this.spinner = ora(message).start();
	}

	/**
	 * Stops the current spinner with an optional completion message.
	 * @param {string} message - Optional message to display when the spinner stops
	 */
	stopSpinner(message?: string): void {
		this.spinner.stop();

		if (message) {
			process.stdout.write(`${message}\n`);
		}
	}

	/**
	 * Displays a success message to the user.
	 * @param {string} message - The success message to display
	 */
	success(message: string): void {
		process.stdout.write(`${chalk.green(message)}\n`);
	}

	/**
	 * Displays a text input prompt to the user.
	 * @param {string} message - The message to display to the user
	 * @param {string} _placeholder - Optional placeholder text for the input field (unused)
	 * @param {string} initialValue - Optional initial value for the input field
	 * @param {(value: string) => Error | string | undefined} validate - Optional validation function for the input
	 * @returns {Promise<string>} Promise that resolves to the user's input text
	 */
	async text(message: string, _placeholder?: string, initialValue?: string, validate?: (value: string) => Error | string | undefined): Promise<string> {
		// Convert the validate function to match prompts' expected format
		const promptsValidate: ((value: string) => boolean | string) | undefined = validate
			? // eslint-disable-next-line @elsikora/typescript/explicit-function-return-type
				(value: string) => {
					const result: Error | string | undefined = validate(value);

					if (result === undefined) return true;

					if (typeof result === "string") return result;

					if (result instanceof Error) return result.message;

					return "Invalid input";
				}
			: undefined;

		try {
			const response: prompts.Answers<string> = await prompts({
				initial: initialValue,
				message,
				name: "value",
				type: "text",
				validate: promptsValidate,
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.value as string;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	/**
	 * Update the spinner message without stopping it.
	 * @param {string} message - The new message to display
	 */
	updateSpinner(message: string): void {
		if (this.spinner?.isSpinning) {
			this.spinner.text = message;
		}
	}

	/**
	 * Displays a warning message to the user.
	 * @param {string} message - The warning message to display
	 */
	warn(message: string): void {
		process.stdout.write(`${chalk.yellow(message)}\n`);
	}
}
