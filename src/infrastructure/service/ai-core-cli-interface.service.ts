import type { ICliInterfaceService as ICommitlintAiCliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ICliInterfaceService as IAiCoreCliInterfaceService, ISelectOption } from "@elsikora/ai-core";

/**
 * Adapts the local CLI port to AI-Core's interactive configuration port.
 */
export class AiCoreCliInterfaceService implements IAiCoreCliInterfaceService {
	private readonly CLI_INTERFACE: ICommitlintAiCliInterfaceService;

	constructor(cliInterface: ICommitlintAiCliInterfaceService) {
		this.CLI_INTERFACE = cliInterface;
	}

	confirm(message: string, isConfirmedByDefault: boolean = false): Promise<boolean> {
		return this.CLI_INTERFACE.confirm(message, isConfirmedByDefault);
	}

	info(message: string): void {
		this.CLI_INTERFACE.info(message);
	}

	password(message: string, defaultValue?: string, validate?: (value: string) => string | undefined): Promise<string> {
		return this.CLI_INTERFACE.password(message, defaultValue, validate);
	}

	async select<T>(message: string, options: Array<ISelectOption<T>>, defaultValue?: T): Promise<T> {
		const selectedIndexText: string = await this.CLI_INTERFACE.select<string>(
			message,
			options.map((option: ISelectOption<T>, index: number) => ({
				label: option.label,
				value: String(index),
			})),
			defaultValue === undefined ? undefined : String(options.findIndex((option: ISelectOption<T>): boolean => Object.is(option.value, defaultValue))),
		);
		const selectedIndex: number = Number.parseInt(selectedIndexText, 10);
		const selectedOption: ISelectOption<T> | undefined = options[selectedIndex];

		if (!selectedOption) {
			throw new Error(`Selected option index '${String(selectedIndex)}' is out of range`);
		}

		return selectedOption.value;
	}

	success(message: string): void {
		this.CLI_INTERFACE.success(message);
	}

	text(message: string, placeholder?: string, defaultValue?: string, validate?: (value: string) => string | undefined): Promise<string> {
		return this.CLI_INTERFACE.text(message, placeholder, defaultValue, validate);
	}

	warn(message: string): void {
		this.CLI_INTERFACE.warn(message);
	}
}
