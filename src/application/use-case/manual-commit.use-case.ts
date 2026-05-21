import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ILlmPromptContext } from "@application/interface/llm-service.interface";

import { CommitMessage } from "@domain/entity/commit-message.entity";
import { CommitBody } from "@domain/value-object/commit-body.value-object";
import { CommitHeader } from "@domain/value-object/commit-header.value-object";

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
	 * @param {ILlmPromptContext} context - The context for the commit
	 * @returns {Promise<CommitMessage>} Promise resolving to the commit message
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

			// eslint-disable-next-line @elsikora/sonar/no-redundant-jump
			return;
		});

		// Get body
		const body: string | undefined = await this.CLI_INTERFACE.text("Enter commit body (optional):", "", "");

		// Get breaking change
		const hasBreakingChange: boolean = await this.CLI_INTERFACE.confirm("Is this a breaking change?", false);
		let breakingChange: string | undefined;

		if (hasBreakingChange) {
			breakingChange = await this.CLI_INTERFACE.text("Describe the breaking change:", "", "");
		}

		// Get footer (issues, references)
		this.CLI_INTERFACE.info("💡 Examples: 'Closes #123', 'Fixes #456', 'Refs PROJ-123.'");
		const footer: string | undefined = await this.CLI_INTERFACE.text("Enter footer (issues, references) (optional):", "", "");

		// Create commit message
		const header: CommitHeader = new CommitHeader(type, subject, scope);
		const finalFooter: string | undefined = footer && footer.trim().length > 0 ? footer.trim() : undefined;
		const commitBody: CommitBody = new CommitBody(body, breakingChange, finalFooter);
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
