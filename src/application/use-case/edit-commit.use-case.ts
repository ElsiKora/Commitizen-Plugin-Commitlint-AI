import type { ICliInterfaceService } from "@application/interface/cli-interface-service.interface";
import type { ICommitRepository } from "@application/interface/commit-repository.interface";
import type { ICommitValidationResult, ICommitValidator } from "@application/interface/commit-validator.interface";
import type { ILlmPromptContext, ILlmService } from "@application/interface/llm-service.interface";
import type { CommitMessage } from "@domain/entity/commit-message.entity";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";

import { addTicketIdToCommitMessage } from "@domain/helper/add-ticket-to-commit.helper";
import { CommitBody } from "@domain/value-object/commit-body.value-object";
import { CommitHeader } from "@domain/value-object/commit-header.value-object";

/**
 * Use case for editing existing commit messages with point editing capabilities
 */
export class EditCommitUseCase {
	private readonly CLI_INTERFACE: ICliInterfaceService;

	private readonly COMMIT_REPOSITORY: ICommitRepository;

	private readonly LLM_SERVICE: ILlmService;

	private readonly VALIDATOR: ICommitValidator;

	constructor(cliInterface: ICliInterfaceService, validator: ICommitValidator, llmService: ILlmService, commitRepository: ICommitRepository) {
		this.CLI_INTERFACE = cliInterface;
		this.VALIDATOR = validator;
		this.LLM_SERVICE = llmService;
		this.COMMIT_REPOSITORY = commitRepository;
	}

	/**
	 * Execute the commit editing workflow
	 * @param {CommitMessage} commitMessage - The initial commit message to edit
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration for regeneration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	async execute(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		// Show current commit message
		this.CLI_INTERFACE.log("\nCurrent commit message:");
		this.CLI_INTERFACE.note("Commit Preview", commitMessage.toString());

		// Validate current message
		const validation: ICommitValidationResult = await this.VALIDATOR.validate(commitMessage);

		if (validation.isValid) {
			this.CLI_INTERFACE.success("✅ Validation: PASSED");
		} else {
			this.CLI_INTERFACE.warn("❌ Validation: FAILED");

			if (validation.errors && validation.errors.length > 0) {
				for (const error of validation.errors) {
					this.CLI_INTERFACE.error(`  - ${error}`);
				}
			}
		}

		// Build edit options
		const editOptions: Array<{ isDisabled?: boolean; label: string; value: string }> = [
			{ label: "✅ Confirm and use this commit message", value: "confirm" },
			{ isDisabled: true, label: "─────────────────────────────────", value: "separator1" },
			{ label: "🏷️  Edit commit type", value: "changeType" },
			{ label: "🎯 Edit commit scope", value: "changeScope" },
			{ label: "💬 Edit commit subject", value: "changeSubject" },
			{ label: commitMessage.getBody().getContent() ? "📄 Edit commit body" : "➕ Add commit body", value: "changeBody" },
			{ isDisabled: true, label: "─────────────────────────────────", value: "separator2" },
			{
				label: commitMessage.getBody().getFooter() ? "🔗 Edit footer/issues" : "➕ Add footer/issues",
				value: "changeFooter",
			},
			{
				label: commitMessage.isBreakingChange() ? "✔️  Unmark as breaking change" : "⚠️  Mark as breaking change",
				value: "toggleBreaking",
			},
		];

		// Add regenerate option if LLM is configured
		if (llmConfig) {
			editOptions.splice(1, 0, { label: "🔄 Regenerate with AI", value: "regenerate" });
		}

		const action: string = await this.CLI_INTERFACE.select<string>("What would you like to do?", editOptions);

		switch (action) {
			case "changeBody": {
				return this.handleChangeBody(commitMessage, context, llmConfig);
			}

			case "changeFooter": {
				return this.handleChangeFooter(commitMessage, context, llmConfig);
			}

			case "changeScope": {
				return this.handleChangeScope(commitMessage, context, llmConfig);
			}

			case "changeSubject": {
				return this.handleChangeSubject(commitMessage, context, llmConfig);
			}

			case "changeType": {
				return this.handleChangeType(commitMessage, context, llmConfig);
			}

			case "confirm": {
				return commitMessage;
			}

			case "regenerate": {
				if (!llmConfig) {
					return commitMessage;
				}

				return this.handleRegenerate(commitMessage, context, llmConfig);
			}

			case "toggleBreaking": {
				return this.handleToggleBreaking(commitMessage, context, llmConfig);
			}

			default: {
				// Should never reach here
				return commitMessage;
			}
		}
	}

	/**
	 * Handle changing commit body
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleChangeBody(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const body: CommitBody = commitMessage.getBody();

		this.CLI_INTERFACE.info("💡 Leave empty to remove body (clear all text and press Enter)");
		const newBodyContent: string = await this.CLI_INTERFACE.text(context.body?.description ?? "Body description (optional):", body.getContent() ?? "");

		const finalBodyContent: string | undefined = newBodyContent.trim() === "" ? undefined : newBodyContent.trim();
		const newBody: CommitBody = new CommitBody(finalBodyContent, body.getBreakingChange(), body.getFooter());
		const newMessage: CommitMessage = commitMessage.withBody(newBody);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle changing commit footer (issues, references)
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleChangeFooter(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const body: CommitBody = commitMessage.getBody();

		this.CLI_INTERFACE.info("💡 Examples: 'Closes #123', 'Fixes #456', 'Refs PROJ-123.'");
		this.CLI_INTERFACE.info("💡 Leave empty to remove footer (clear all text and press Enter)");
		const newFooter: string = await this.CLI_INTERFACE.text("Footer (issues, references):", body.getFooter() ?? "");

		const finalFooter: string | undefined = newFooter.trim() === "" ? undefined : newFooter.trim();
		const newBody: CommitBody = new CommitBody(body.getContent(), body.getBreakingChange(), finalFooter);
		const newMessage: CommitMessage = commitMessage.withBody(newBody);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle changing commit scope
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleChangeScope(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const header: CommitHeader = commitMessage.getHeader();

		// Scope is optional, use placeholder to allow deletion
		const newScope: string = await this.CLI_INTERFACE.text(context.scopeDescription ?? "What is the scope of this change?", header.getScope() ?? "");

		const finalScope: string | undefined = newScope.trim() === "" ? undefined : newScope.trim();
		const newHeader: CommitHeader = new CommitHeader(header.getType(), header.getSubject(), finalScope);
		const newMessage: CommitMessage = commitMessage.withHeader(newHeader);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle changing commit subject
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleChangeSubject(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const header: CommitHeader = commitMessage.getHeader();

		// Subject is required by commitlint rules, use initialValue to prevent deletion
		const newSubject: string = await this.CLI_INTERFACE.text(context.subject?.description ?? "Write a short, imperative description of the change:", "", header.getSubject());

		const newHeader: CommitHeader = new CommitHeader(header.getType(), newSubject.trim(), header.getScope());
		const newMessage: CommitMessage = commitMessage.withHeader(newHeader);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle changing commit type
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleChangeType(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const header: CommitHeader = commitMessage.getHeader();

		// Build type options
		const typeOptions: Array<{ label: string; value: string }> =
			context.typeEnum?.map((type: string) => {
				const desc: string = context.typeDescriptions?.[type]?.description ?? "";
				const emoji: string = context.typeDescriptions?.[type]?.emoji ?? "";

				let cleanDesc: string = desc;

				if (emoji && desc.startsWith(emoji)) {
					cleanDesc = desc.slice(emoji.length).trim();
				}

				const label: string = emoji ? `${type} ${emoji}: ${cleanDesc}` : `${type}: ${cleanDesc}`;

				return { label, value: type };
			}) ?? [];

		const newType: string = await this.CLI_INTERFACE.select<string>(context.typeDescription ?? "Select the type of change:", typeOptions, header.getType());

		const newHeader: CommitHeader = new CommitHeader(newType, header.getSubject(), header.getScope());
		const newMessage: CommitMessage = commitMessage.withHeader(newHeader);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle AI regeneration of commit message
	 * @param {CommitMessage} commitMessage - The current commit message before regeneration.
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration} llmConfig - The LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the regenerated commit message
	 */
	private async handleRegenerate(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig: LLMConfiguration): Promise<CommitMessage> {
		this.CLI_INTERFACE.startSpinner("🔄 Regenerating commit message with AI...");

		try {
			const newCommitMessage: CommitMessage = await this.LLM_SERVICE.generateCommitMessage(context, llmConfig);

			this.CLI_INTERFACE.stopSpinner();

			// Add ticket ID from branch if exists
			let finalMessage: CommitMessage = newCommitMessage;
			const ticketId: string | undefined = await this.COMMIT_REPOSITORY.getTicketIdFromBranch();

			if (ticketId) {
				finalMessage = addTicketIdToCommitMessage(newCommitMessage, ticketId);
			}

			// Validate the new message
			const validation: ICommitValidationResult = await this.VALIDATOR.validate(finalMessage);

			this.CLI_INTERFACE.success("✅ New commit message generated successfully!");
			this.CLI_INTERFACE.log("\nRegenerated commit message:");
			this.CLI_INTERFACE.note("New Commit", finalMessage.toString());

			if (validation.isValid) {
				this.CLI_INTERFACE.success("✅ Validation: PASSED");
			} else {
				this.CLI_INTERFACE.warn("❌ Validation: FAILED");

				if (validation.errors) {
					for (const error of validation.errors) {
						this.CLI_INTERFACE.error(`  - ${error}`);
					}
				}
			}

			// Continue editing with the new message
			return await this.execute(finalMessage, context, llmConfig);
		} catch (error) {
			this.CLI_INTERFACE.stopSpinner();
			this.CLI_INTERFACE.error("Failed to regenerate commit message");
			this.CLI_INTERFACE.handleError("Error:", error);

			// Ask if user wants to try again or go back to editing
			const isRetryRequested: boolean = await this.CLI_INTERFACE.confirm("Would you like to try regenerating again?", false);

			if (isRetryRequested) {
				return await this.handleRegenerate(commitMessage, context, llmConfig);
			}

			// Return to edit menu with original message
			return await this.execute(commitMessage, context, llmConfig);
		}
	}

	/**
	 * Handle toggling breaking change status
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleToggleBreaking(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const body: CommitBody = commitMessage.getBody();

		if (commitMessage.isBreakingChange()) {
			// Remove breaking change
			const newBody: CommitBody = new CommitBody(body.getContent(), undefined, body.getFooter());
			const newMessage: CommitMessage = commitMessage.withBody(newBody);

			this.CLI_INTERFACE.success("✅ Removed breaking change marker");

			return this.execute(newMessage, context, llmConfig);
		} else {
			// Add breaking change
			const breakingDescription: string = await this.CLI_INTERFACE.text("Describe the breaking change:", "", "");

			const finalBreaking: string = breakingDescription.trim() === "" ? "BREAKING CHANGE" : breakingDescription.trim();
			const newBody: CommitBody = new CommitBody(body.getContent(), finalBreaking, body.getFooter());
			const newMessage: CommitMessage = commitMessage.withBody(newBody);

			this.CLI_INTERFACE.success("✅ Added breaking change marker");

			return this.execute(newMessage, context, llmConfig);
		}
	}
}
