import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { ILLMPromptContext } from "../interface/llm-service.interface.js";

import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";
import { CommitMessage } from "../../domain/entity/commit-message.entity.js";

/**
 * Use case for creating commit messages manually
 */
export class ManualCommitUseCase {
	private readonly cliInterface: ICliInterfaceService;

	constructor(cliInterface: ICliInterfaceService) {
		this.cliInterface = cliInterface;
	}

	/**
	 * Execute the use case to create a commit message manually
	 * @param context - The context containing commit rules and descriptions
	 * @returns Promise resolving to the created commit message
	 */
	async execute(context: ILLMPromptContext): Promise<CommitMessage> {
		// Select commit type
		const typeOptions = context.typeEnum?.map((type) => {
			const desc = context.typeDescriptions?.[type]?.description ?? "";
			const emoji = context.typeDescriptions?.[type]?.emoji ?? "";

			// Remove emoji from description if it already appears at the beginning
			let cleanDesc = desc;
			if (emoji && desc.startsWith(emoji)) {
				cleanDesc = desc.slice(emoji.length).trim();
			}

			return {
				label: type + (emoji ? " " + emoji : "") + ": " + cleanDesc,
				value: type,
			};
		}) ?? [];

		const type = await this.cliInterface.select<string>(
			context.typeDescription ?? "Select the type of change that you're committing:",
			typeOptions
		);

		// Get scope
		const scope = await this.cliInterface.text(
			context.scopeDescription ?? 
			'What is the scope of this change:\n  - Use component, directory or area of codebase\n  - Use comma-separated list for multiple areas\n  - Type "global" for project-wide changes\n  - Press enter to skip if scope is not applicable'
		);

		// Get subject
		const subject = await this.cliInterface.text(
			context.subject.description ?? "Write a short, imperative mood description of the change:",
			undefined,
			undefined,
			(input: string) => {
				if (!input || input.trim().length === 0) {
					return "Subject is required";
				}
				if (context.subject.minLength && input.length < context.subject.minLength) {
					return `Subject must be at least ${context.subject.minLength} characters`;
				}
				if (context.subject.maxLength && input.length > context.subject.maxLength) {
					return `Subject must be at most ${context.subject.maxLength} characters`;
				}
				return undefined;
			}
		);

		// Get body
		const body = await this.cliInterface.text(
			context.body?.description ?? "Provide a longer description of the change: (press enter to skip)"
		);

		// Check for breaking changes
		const isBreaking = await this.cliInterface.confirm(
			"Are there any breaking changes?",
			false
		);

		let breakingChange: string | undefined;
		if (isBreaking) {
			breakingChange = await this.cliInterface.text(
				"Describe the breaking changes:"
			);
		}

		// Create commit message
		const header = new CommitHeader(type, subject, scope || undefined);
		const commitBody = new CommitBody(body || undefined, breakingChange);
		const commitMessage = new CommitMessage(header, commitBody);

		// Display the commit message
		this.cliInterface.note("Your commit message:", commitMessage.toString());

		// Confirm
		const confirmed = await this.cliInterface.confirm(
			"Are you sure you want to proceed with the commit above?",
			true
		);

		if (!confirmed) {
			throw new Error("User canceled the commit");
		}

		return commitMessage;
	}
} 