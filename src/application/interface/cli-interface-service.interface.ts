import type { ICliInterfaceServiceSelectOptions } from "./cli-interface-service-select-options.interface.js";

/**
 * Interface for CLI user interaction services.
 * Provides methods for displaying information and collecting input from users.
 */
export interface ICliInterfaceService {
	/**
	 * Clears the console screen.
	 */
	clear(): void;

	/**
	 * Displays a confirmation prompt to the user.
	 * @param message - The message to display to the user
	 * @param isConfirmedByDefault - The default value for the confirmation, defaults to false
	 * @returns Promise that resolves to the user's response (true for confirmed, false for declined)
	 */
	confirm(message: string, isConfirmedByDefault?: boolean): Promise<boolean>;

	/**
	 * Displays an error message to the user.
	 * @param message - The error message to display
	 */
	error(message: string): void;

	/**
	 * Displays a grouped multi-select prompt to the user.
	 * @param message - The message to display to the user
	 * @param options - Record of groups and their options
	 * @param isRequired - Whether a selection is required, defaults to false
	 * @param initialValue - Initial selected values
	 * @returns Promise that resolves to an array of selected values
	 */
	groupMultiselect<T>(message: string, options: Record<string, Array<ICliInterfaceServiceSelectOptions>>, isRequired?: boolean, initialValue?: Array<string>): Promise<Array<T>>;

	/**
	 * Handles and displays an error message with additional error details.
	 * @param message - The error message to display
	 * @param error - The error object or details
	 */
	handleError(message: string, error: unknown): void;

	/**
	 * Displays an informational message to the user.
	 * @param message - The info message to display
	 */
	info(message: string): void;

	/**
	 * Displays a standard message to the user.
	 * @param message - The message to display
	 */
	log(message: string): void;

	/**
	 * Displays a multi-select prompt to the user.
	 * @param message - The message to display to the user
	 * @param options - Array of options to select from
	 * @param isRequired - Whether a selection is required, defaults to false
	 * @param initialValue - Initial selected values
	 * @returns Promise that resolves to an array of selected values
	 */
	multiselect<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, isRequired?: boolean, initialValue?: Array<string>): Promise<Array<T>>;

	/**
	 * Displays a note to the user with a title and message.
	 * @param title - The title of the note
	 * @param message - The message content of the note
	 */
	note(title: string, message: string): void;

	/**
	 * Displays a single select prompt to the user.
	 * @param message - The message to display to the user
	 * @param options - Array of options to select from
	 * @param initialValue - Initial selected value
	 * @returns Promise that resolves to the selected value
	 */
	select<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, initialValue?: string): Promise<T>;

	/**
	 * Starts a spinner with the specified message.
	 * @param message - The message to display while the spinner is active
	 */
	startSpinner(message: string): void;

	/**
	 * Updates the spinner message.
	 * @param message - The new message to display
	 */
	updateSpinner(message: string): void;

	/**
	 * Stops the current spinner with an optional completion message.
	 * @param message - Optional message to display when the spinner stops
	 */
	stopSpinner(message?: string): void;

	/**
	 * Displays a success message to the user.
	 * @param message - The success message to display
	 */
	success(message: string): void;

	/**
	 * Displays a text input prompt to the user.
	 * @param message - The message to display to the user
	 * @param placeholder - Optional placeholder text for the input field
	 * @param initialValue - Optional initial value for the input field
	 * @param validate - Optional validation function for the input
	 * @returns Promise that resolves to the user's input text
	 */
	text(message: string, placeholder?: string, initialValue?: string, validate?: (value: string) => Error | string | undefined): Promise<string>;

	/**
	 * Displays a warning message to the user.
	 * @param message - The warning message to display
	 */
	warn(message: string): void;
} 