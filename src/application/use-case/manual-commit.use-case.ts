import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { ILlmPromptContext } from "../interface/llm-service.interface.js";

import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

/**
 * Use case for manual commit message creation
 */
export class ManualCommitUseCase {
	private readonly CLI_INTERFACE: ICliInterfaceService;

	constructor(cliInterface: ICliInterfaceService) {
		this.CLI_INTERFACE = cliInterface;
	}

	/**
	 * Execute the manual commit creation process
	 * @param context - The context for the commit
	 * @returns Promise resolving to the commit message
	 */
	async execute(context: ILlmPromptContext): Promise<CommitMessage> {
		// Build type options from context
		const typeOptions: Array<{ label: string; value: string }> = [];

		if (context.typeDescriptions) {
			for (const [type, desc] of Object.entries(context.typeDescriptions)) {
				const emoji: string = desc.emoji ?? "";
				const cleanDesc: string = desc.description.replace(/\.$/, "");

				const emojiSuffix: string = emoji ? ` ${emoji}` : "";
				typeOptions.push({
					label: `${type}: ${cleanDesc}${emojiSuffix}`,
					value: type,
				});
			}
		} else if (context.typeEnum) {
			for (const type of context.typeEnum) {
				typeOptions.push({ label: type, value: type });
			}
		}

		const type: string = await this.CLI_INTERFACE.select("Select commit type:", typeOptions);

		// Get scope if applicable
		const scope: string | undefined = await this.CLI_INTERFACE.text("Enter scope (optional):", "", "");

		// Get subject
		const subject: string = await this.CLI_INTERFACE.text("Enter commit subject:", "", "", (value: string) => {
			if (!value.trim()) {
				return "Subject is required";
			}

			if (context.subject.minLength && value.length < context.subject.minLength) {
				return `Subject must be at least ${context.subject.minLength} characters`;
			}

			if (context.subject.maxLength && value.length > context.subject.maxLength) {
				return `Subject must be at most ${context.subject.maxLength} characters`;
			}
		});

		// Get body
		const body: string | undefined = await this.CLI_INTERFACE.text("Enter commit body (optional):", "", "");

		// Get breaking change
		const hasBreakingChange: boolean = await this.CLI_INTERFACE.confirm("Is this a breaking change?", false);
		let breakingChange: string | undefined;

		if (hasBreakingChange) {
			breakingChange = await this.CLI_INTERFACE.text("Describe the breaking change:", "", "");
		}

		// Create commit message
		const header: CommitHeader = new CommitHeader(type, subject, scope);
		const commitBody: CommitBody = new CommitBody(body, breakingChange);
		const commitMessage: CommitMessage = new CommitMessage(header, commitBody);

		// Ask for confirmation
		this.CLI_INTERFACE.log("\nCommit message preview:");
		this.CLI_INTERFACE.log(commitMessage.toString());

		const isConfirmed: boolean = await this.CLI_INTERFACE.confirm("\nUse this commit message?", true);

		if (!isConfirmed) {
			// Recursively call to edit
			return this.execute(context);
		}

		return commitMessage;
	}
}
