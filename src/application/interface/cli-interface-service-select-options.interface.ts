/**
 * Options for select inputs in the CLI interface
 */
export interface ICliInterfaceServiceSelectOptions {
	/**
	 * Optional hint text for the option
	 */
	hint?: string;

	/**
	 * Whether the option is disabled
	 */
	isDisabled?: boolean;

	/**
	 * Display label for the option
	 */
	label: string;

	/**
	 * Value to be returned when the option is selected
	 */
	value: string;
}
