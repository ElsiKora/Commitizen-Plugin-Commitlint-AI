/**
 * Options for select prompts in CLI interface
 */
export interface ICliInterfaceServiceSelectOptions {
	/**
	 * Display label for the option
	 */
	label: string;

	/**
	 * Value to be returned when the option is selected
	 */
	value: string;

	/**
	 * Optional hint text for the option
	 */
	hint?: string;

	/**
	 * Whether the option is disabled
	 */
	disabled?: boolean;
} 