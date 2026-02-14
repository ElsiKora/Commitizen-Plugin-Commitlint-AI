import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ICliInterfaceService } from "../interface/cli-interface-service.interface.js";
import type { ICommitValidator } from "../interface/commit-validator.interface.js";
import type { ILlmPromptContext } from "../interface/llm-service.interface.js";
import type { ILlmService } from "../interface/llm-service.interface.js";

import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

/**
 * Use case for editing existing commit messages with point editing capabilities
 */
export class EditCommitUseCase {
	private readonly CLI_INTERFACE: ICliInterfaceService;

	private readonly LLM_SERVICES: Array<ILlmService>;

	private readonly VALIDATOR: ICommitValidator;

	constructor(cliInterface: ICliInterfaceService, validator: ICommitValidator, llmServices: Array<ILlmService>) {
		this.CLI_INTERFACE = cliInterface;
		this.VALIDATOR = validator;
		this.LLM_SERVICES = llmServices;
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
		const validation = await this.VALIDATOR.validate(commitMessage);

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
		const editOptions = [
			{ label: "✅ Confirm and use this commit message", value: "confirm" },
			{ isDisabled: true, label: "─────────────────────────────────", value: "separator1" },
			{ label: "🏷️  Edit commit type", value: "changeType" },
			{ label: "🎯 Edit commit scope", value: "changeScope" },
			{ label: "💬 Edit commit subject", value: "changeSubject" },
			{ label: commitMessage.getBody().getContent() ? "📄 Edit commit body" : "➕ Add commit body", value: "changeBody" },
			{ isDisabled: true, label: "─────────────────────────────────", value: "separator2" },
			{
				label: commitMessage.getBody().getFooter() ? "➖ Remove footer/issues" : "➕ Add footer/issues",
				value: "toggleFooter",
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

		const action = await this.CLI_INTERFACE.select<string>("What would you like to do?", editOptions);

		switch (action) {
			case "changeBody": {
				return this.handleChangeBody(commitMessage, context, llmConfig);
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
				return this.handleRegenerate(context, llmConfig!);
			}

			case "toggleBreaking": {
				return this.handleToggleBreaking(commitMessage, context, llmConfig);
			}

			case "toggleFooter": {
				return this.handleToggleFooter(commitMessage, context, llmConfig);
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
		const body = commitMessage.getBody();

		this.CLI_INTERFACE.info("💡 Leave empty to remove body (clear all text and press Enter)");
		const newBodyContent = await this.CLI_INTERFACE.text(context.body?.description ?? "Body description (optional):", body.getContent() ?? "");

		const finalBodyContent = newBodyContent.trim() === "" ? undefined : newBodyContent.trim();
		const newBody = new CommitBody(finalBodyContent, body.getBreakingChange(), body.getFooter());
		const newMessage = commitMessage.withBody(newBody);

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
		const header = commitMessage.getHeader();

		// Scope is optional, use placeholder to allow deletion
		const newScope = await this.CLI_INTERFACE.text(context.scopeDescription ?? "What is the scope of this change?", header.getScope() ?? "");

		const finalScope = newScope.trim() === "" ? undefined : newScope.trim();
		const newHeader = new CommitHeader(header.getType(), header.getSubject(), finalScope);
		const newMessage = commitMessage.withHeader(newHeader);

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
		const header = commitMessage.getHeader();

		// Subject is required by commitlint rules, use initialValue to prevent deletion
		const newSubject = await this.CLI_INTERFACE.text(context.subject?.description ?? "Write a short, imperative description of the change:", "", header.getSubject());

		const newHeader = new CommitHeader(header.getType(), newSubject.trim(), header.getScope());
		const newMessage = commitMessage.withHeader(newHeader);

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
		const header = commitMessage.getHeader();

		// Build type options
		const typeOptions =
			context.typeEnum?.map((type: string) => {
				const desc = context.typeDescriptions?.[type]?.description ?? "";
				const emoji = context.typeDescriptions?.[type]?.emoji ?? "";

				let cleanDesc = desc;

				if (emoji && desc.startsWith(emoji)) {
					cleanDesc = desc.slice(emoji.length).trim();
				}

				const label = emoji ? `${type} ${emoji}: ${cleanDesc}` : `${type}: ${cleanDesc}`;

				return { label, value: type };
			}) ?? [];

		const newType = await this.CLI_INTERFACE.select<string>(context.typeDescription ?? "Select the type of change:", typeOptions, header.getType());

		const newHeader = new CommitHeader(newType, header.getSubject(), header.getScope());
		const newMessage = commitMessage.withHeader(newHeader);

		return this.execute(newMessage, context, llmConfig);
	}

	/**
	 * Handle AI regeneration of commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration} llmConfig - The LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the regenerated commit message
	 */
	private async handleRegenerate(context: ILlmPromptContext, llmConfig: LLMConfiguration): Promise<CommitMessage> {
		this.CLI_INTERFACE.startSpinner("🔄 Regenerating commit message with AI...");

		try {
			const service = this.LLM_SERVICES.find((s) => s.supports(llmConfig));

			if (!service) {
				throw new Error(`No LLM service found for provider: ${llmConfig.getProvider()}`);
			}

			const newCommitMessage = await service.generateCommitMessage(context, llmConfig);

			this.CLI_INTERFACE.stopSpinner();

			// Validate the new message
			const validation = await this.VALIDATOR.validate(newCommitMessage);

			this.CLI_INTERFACE.success("✅ New commit message generated successfully!");
			this.CLI_INTERFACE.log("\nRegenerated commit message:");
			this.CLI_INTERFACE.note("New Commit", newCommitMessage.toString());

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
			return this.execute(newCommitMessage, context, llmConfig);
		} catch (error) {
			this.CLI_INTERFACE.stopSpinner();
			this.CLI_INTERFACE.error("Failed to regenerate commit message");
			this.CLI_INTERFACE.handleError("Error:", error);

			// Ask if user wants to try again or go back to editing
			const retry = await this.CLI_INTERFACE.confirm("Would you like to try regenerating again?", false);

			if (retry) {
				return this.handleRegenerate(context, llmConfig);
			}

			// Return to edit menu with original message
			return this.execute(new CommitMessage(new CommitHeader(context.typeEnum?.[0] || "feat", "fix: update"), new CommitBody()), context, llmConfig);
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
		const body = commitMessage.getBody();

		if (commitMessage.isBreakingChange()) {
			// Remove breaking change
			const newBody = new CommitBody(body.getContent(), undefined, body.getFooter());
			const newMessage = commitMessage.withBody(newBody);

			this.CLI_INTERFACE.success("✅ Removed breaking change marker");

			return this.execute(newMessage, context, llmConfig);
		} else {
			// Add breaking change
			const breakingDescription = await this.CLI_INTERFACE.text("Describe the breaking change:", "", "");

			const finalBreaking = breakingDescription.trim() === "" ? "BREAKING CHANGE" : breakingDescription.trim();
			const newBody = new CommitBody(body.getContent(), finalBreaking, body.getFooter());
			const newMessage = commitMessage.withBody(newBody);

			this.CLI_INTERFACE.success("✅ Added breaking change marker");

			return this.execute(newMessage, context, llmConfig);
		}
	}

	/**
	 * Handle toggling footer/issues
	 * @param {CommitMessage} commitMessage - The current commit message
	 * @param {ILlmPromptContext} context - The LLM prompt context
	 * @param {LLMConfiguration | undefined} llmConfig - Optional LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the edited commit message
	 */
	private async handleToggleFooter(commitMessage: CommitMessage, context: ILlmPromptContext, llmConfig?: LLMConfiguration): Promise<CommitMessage> {
		const body = commitMessage.getBody();

		if (body.getFooter()) {
			// Remove footer
			const newBody = new CommitBody(body.getContent(), body.getBreakingChange(), undefined);
			const newMessage = commitMessage.withBody(newBody);

			this.CLI_INTERFACE.success("✅ Footer/issues removed");

			return this.execute(newMessage, context, llmConfig);
		}

		// Add footer
		this.CLI_INTERFACE.info("💡 Examples: 'Closes #123', 'Fixes #456', 'Refs #789'");
		const footer = await this.CLI_INTERFACE.text("Footer (issues, references):", "");

		if (footer.trim() === "") {
			this.CLI_INTERFACE.warn("Footer cannot be empty. Skipping...");

			return this.execute(commitMessage, context, llmConfig);
		}

		const newBody = new CommitBody(body.getContent(), body.getBreakingChange(), footer.trim());
		const newMessage = commitMessage.withBody(newBody);

		this.CLI_INTERFACE.success("✅ Footer/issues added");

		return this.execute(newMessage, context, llmConfig);
	}
}
