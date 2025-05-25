import type { LintOutcome, QualifiedRules } from "@commitlint/types";

import type { ICommitValidationResult, ICommitValidator } from "../../application/interface/commit-validator.interface.js";
import type { ILlmPromptContext, ILlmService } from "../../application/interface/llm-service.interface.js";
import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

import lint from "@commitlint/lint";
import load from "@commitlint/load";

import { ELLIPSIS_LENGTH } from "../../domain/constant/numeric.constant.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

/**
 * Commitlint implementation of the commit validator
 */
export class CommitlintValidatorService implements ICommitValidator {
	private readonly LLM_SERVICES?: Array<ILlmService>;

	private llmConfiguration?: LLMConfiguration;

	constructor(llmServices?: Array<ILlmService>) {
		this.LLM_SERVICES = llmServices;
	}

	/**
	 * Attempt to fix a commit message based on validation errors
	 * @param {CommitMessage} message - The commit message to fix
	 * @param {ICommitValidationResult} validationResult - The validation result containing errors
	 * @param {ILlmPromptContext} context - Optional original context for LLM-based fixing
	 * @returns {Promise<CommitMessage | null>} Promise resolving to the fixed commit message or null if unfixable
	 */
	async fix(message: CommitMessage, validationResult: ICommitValidationResult, context?: ILlmPromptContext): Promise<CommitMessage | null> {
		if (!validationResult.errors || validationResult.errors.length === 0) {
			return message;
		}

		// If we have context and LLM services, use LLM to regenerate
		if (context && this.LLM_SERVICES && this.llmConfiguration) {
			const service: ILlmService | undefined = this.LLM_SERVICES.find((s: ILlmService) => {
				const config: LLMConfiguration | undefined = this.llmConfiguration;

				return config ? s.supports(config) : false;
			});

			if (service) {
				process.stdout.write("Using LLM to intelligently fix validation errors...\n");

				try {
					// Create a minimal context for fixing - no need to send diff again
					const fixContext: ILlmPromptContext = {
						body: context.body,
						// Explicitly exclude diff and files
						diff: undefined,
						files: undefined,
						rules: {
							...(typeof context.rules === "object" && !Array.isArray(context.rules) ? context.rules : {}),
							instructions: "Fix the commit message to comply with the validation rules. Do not change the meaning or content, only fix the format to pass validation.",
							previousAttempt: message.toString(),
							validationErrors: validationResult.errors,
						},
						scopeDescription: context.scopeDescription,
						subject: context.subject,
						typeDescription: context.typeDescription,
						typeDescriptions: context.typeDescriptions,
						typeEnum: context.typeEnum,
					};

					// Generate a new commit message with the minimal context
					const fixedMessage: CommitMessage = await service.generateCommitMessage(fixContext, this.llmConfiguration);

					// Validate the new message
					const fixedValidation: ICommitValidationResult = await this.validate(fixedMessage);

					if (fixedValidation.isValid) {
						process.stdout.write("LLM fix successful!\n");

						return fixedMessage;
					} else {
						process.stdout.write("LLM fix still has validation errors, falling back to simple fixes\n");
					}
				} catch (error) {
					process.stderr.write(`Failed to fix commit message with LLM: ${error instanceof Error ? error.message : String(error)}\n`);
					// Fall through to simple fixes
				}
			}
		}

		process.stdout.write("Attempting simple rule-based fixes...\n");
		// Fallback to simple fixes
		let fixedMessage: CommitMessage = message;

		// Try to fix common errors
		for (const error of validationResult.errors) {
			if (error.includes("subject may not be empty")) {
				// Can't fix empty subject
				return null;
			}

			if (error.includes("type may not be empty")) {
				// Can't fix empty type
				return null;
			}

			// Fix subject case issues
			if (error.includes("subject must not be sentence-case")) {
				const header: CommitHeader = fixedMessage.getHeader();
				const subject: string = header.getSubject();
				const fixedSubject: string = subject.charAt(0).toLowerCase() + subject.slice(1);
				const newHeader: CommitHeader = new CommitHeader(header.getType(), fixedSubject, header.getScope());
				fixedMessage = fixedMessage.withHeader(newHeader);
			}

			// Fix subject trailing period
			if (error.includes("subject may not end with period")) {
				const header: CommitHeader = fixedMessage.getHeader();
				const subject: string = header.getSubject();
				const fixedSubject: string = subject.replace(/\.$/, "");
				const newHeader: CommitHeader = new CommitHeader(header.getType(), fixedSubject, header.getScope());
				fixedMessage = fixedMessage.withHeader(newHeader);
			}

			// Fix header max length
			if (error.includes("header must not be longer than")) {
				const maxLengthNumbers: Array<string> = error.match(/\d+/g) ?? [];

				if (maxLengthNumbers.length > 0 && maxLengthNumbers[0]) {
					const maxLength: number = Number.parseInt(maxLengthNumbers[0], 10);
					const header: CommitHeader = fixedMessage.getHeader();
					const currentLength: number = header.toString().length;

					if (currentLength > maxLength) {
						// Try to shorten the subject
						const overhead: number = currentLength - maxLength;
						const subject: string = header.getSubject();
						const shortenedSubject: string = subject.slice(0, Math.max(0, subject.length - overhead - ELLIPSIS_LENGTH)) + "...";
						const newHeader: CommitHeader = new CommitHeader(header.getType(), shortenedSubject, header.getScope());
						fixedMessage = fixedMessage.withHeader(newHeader);
					}
				}
			}

			// Fix body/footer line length
			if (error.includes("footer's lines must not be longer than") || error.includes("body's lines must not be longer than")) {
				const maxLengthNumbers: Array<string> = error.match(/\d+/g) ?? [];

				if (maxLengthNumbers.length > 0 && maxLengthNumbers[0]) {
					const maxLength: number = Number.parseInt(maxLengthNumbers[0], 10);
					const body: CommitBody = fixedMessage.getBody();

					// Wrap body lines
					const wrappedBody: string | undefined = this.wrapText(body.getContent(), maxLength);
					const wrappedBreaking: string | undefined = this.wrapText(body.getBreakingChange(), maxLength);

					const newBody: CommitBody = new CommitBody(wrappedBody, wrappedBreaking);
					fixedMessage = fixedMessage.withBody(newBody);
				}
			}
		}

		// Validate the fixed message
		const fixedValidation: ICommitValidationResult = await this.validate(fixedMessage);

		if (fixedValidation.isValid) {
			process.stdout.write("Simple fixes successful!\n");

			return fixedMessage;
		}

		// If still invalid, return null
		process.stdout.write("Simple fixes failed to resolve all validation errors\n");

		return null;
	}

	/**
	 * Set the LLM configuration for this validator
	 * @param {LLMConfiguration} configuration - The LLM configuration to set
	 */
	setLLMConfiguration(configuration: LLMConfiguration): void {
		this.llmConfiguration = configuration;
	}

	/**
	 * Validate a commit message using commitlint
	 * @param {CommitMessage} message - The commit message to validate
	 * @returns {Promise<ICommitValidationResult>} Promise resolving to the validation result
	 */
	async validate(message: CommitMessage): Promise<ICommitValidationResult> {
		const loadResult: { rules?: QualifiedRules } = await load();
		const { rules = {} }: { rules: QualifiedRules } = loadResult as { rules: QualifiedRules };
		const result: LintOutcome = await lint(message.toString(), rules);

		return {
			errors: result.errors.map((error: { message: string }) => error.message),
			isValid: result.valid,
			warnings: result.warnings.map((warning: { message: string }) => warning.message),
		};
	}

	/**
	 * Wrap text to ensure no line exceeds the specified length
	 * @param {string | undefined} text - The text to wrap
	 * @param {number} maxLength - Maximum line length
	 * @returns {string | undefined} The wrapped text
	 */
	private wrapText(text: string | undefined, maxLength: number): string | undefined {
		if (!text) {
			return text;
		}

		const lines: Array<string> = text.split("\n");
		const wrappedLines: Array<string> = [];

		for (const line of lines) {
			if (line.length <= maxLength) {
				wrappedLines.push(line);
			} else {
				// Simple word wrap
				const words: Array<string> = line.split(" ");
				let currentLine: string = "";

				for (const word of words) {
					if (currentLine.length + word.length + 1 <= maxLength) {
						currentLine += (currentLine ? " " : "") + word;
					} else {
						if (currentLine) {
							wrappedLines.push(currentLine);
						}
						currentLine = word;
					}
				}

				if (currentLine) {
					wrappedLines.push(currentLine);
				}
			}
		}

		return wrappedLines.join("\n");
	}
}
