import type { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import type { ICommitValidator, ICommitValidationResult } from "../../application/interface/commit-validator.interface.js";
import type { ILLMPromptContext, ILLMService } from "../../application/interface/llm-service.interface.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

import load from "@commitlint/load";
import lint from "@commitlint/lint";

import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";

/**
 * Commitlint implementation of the commit validator
 */
export class CommitlintValidatorService implements ICommitValidator {
	private readonly llmServices?: ILLMService[];
	private llmConfiguration?: LLMConfiguration;

	constructor(llmServices?: ILLMService[]) {
		this.llmServices = llmServices;
	}

	/**
	 * Set the LLM configuration for context-aware fixing
	 * @param configuration - The LLM configuration
	 */
	setLLMConfiguration(configuration: LLMConfiguration): void {
		this.llmConfiguration = configuration;
	}

	/**
	 * Validate a commit message using commitlint
	 * @param message - The commit message to validate
	 * @returns Promise resolving to the validation result
	 */
	async validate(message: CommitMessage): Promise<ICommitValidationResult> {
		const { rules } = await load();
		const result = await lint(message.toString(), rules);

		return {
			isValid: result.valid,
			errors: result.errors.map((e) => e.message),
			warnings: result.warnings.map((w) => w.message),
		};
	}

	/**
	 * Attempt to fix a commit message based on validation errors
	 * @param message - The commit message to fix
	 * @param validationResult - The validation result containing errors
	 * @param context - Optional original context for LLM-based fixing
	 * @returns Promise resolving to the fixed commit message or null if unfixable
	 */
	async fix(
		message: CommitMessage, 
		validationResult: ICommitValidationResult,
		context?: ILLMPromptContext
	): Promise<CommitMessage | null> {
		if (!validationResult.errors || validationResult.errors.length === 0) {
			return message;
		}

		// If we have context and LLM services, use LLM to regenerate
		if (context && this.llmServices && this.llmConfiguration) {
			const service = this.llmServices.find((s) => s.supports(this.llmConfiguration!));
			if (service) {
				console.log("Using LLM to intelligently fix validation errors...");
				try {
					// Create a minimal context for fixing - no need to send diff again
					const fixContext: ILLMPromptContext = {
						subject: context.subject,
						typeEnum: context.typeEnum,
						typeDescriptions: context.typeDescriptions,
						typeDescription: context.typeDescription,
						scopeDescription: context.scopeDescription,
						body: context.body,
						// Explicitly exclude diff and files
						diff: undefined,
						files: undefined,
						rules: {
							...(typeof context.rules === 'object' && !Array.isArray(context.rules) ? context.rules : {}),
							validationErrors: validationResult.errors,
							previousAttempt: message.toString(),
							instructions: "Fix the commit message to comply with the validation rules. Do not change the meaning or content, only fix the format to pass validation.",
						},
					};

					// Generate a new commit message with the minimal context
					const fixedMessage = await service.generateCommitMessage(fixContext, this.llmConfiguration);
					
					// Validate the new message
					const fixedValidation = await this.validate(fixedMessage);
					if (fixedValidation.isValid) {
						console.log("LLM fix successful!");
						return fixedMessage;
					} else {
						console.log("LLM fix still has validation errors, falling back to simple fixes");
					}
				} catch (error) {
					console.warn("Failed to fix commit message with LLM:", error);
					// Fall through to simple fixes
				}
			}
		}

		console.log("Attempting simple rule-based fixes...");
		// Fallback to simple fixes
		let fixedMessage = message;

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
				const header = fixedMessage.getHeader();
				const subject = header.getSubject();
				const fixedSubject = subject.charAt(0).toLowerCase() + subject.slice(1);
				const newHeader = new CommitHeader(header.getType(), fixedSubject, header.getScope());
				fixedMessage = fixedMessage.withHeader(newHeader);
			}

			// Fix subject trailing period
			if (error.includes("subject may not end with period")) {
				const header = fixedMessage.getHeader();
				const subject = header.getSubject();
				const fixedSubject = subject.replace(/\.$/, "");
				const newHeader = new CommitHeader(header.getType(), fixedSubject, header.getScope());
				fixedMessage = fixedMessage.withHeader(newHeader);
			}

			// Fix header max length
			if (error.includes("header must not be longer than")) {
				const maxLengthMatch = error.match(/(\d+) characters/);
				if (maxLengthMatch) {
					const maxLength = parseInt(maxLengthMatch[1], 10);
					const header = fixedMessage.getHeader();
					const currentLength = header.toString().length;

					if (currentLength > maxLength) {
						// Try to shorten the subject
						const overhead = currentLength - maxLength;
						const subject = header.getSubject();
						const shortenedSubject = subject.substring(0, subject.length - overhead - 3) + "...";
						const newHeader = new CommitHeader(header.getType(), shortenedSubject, header.getScope());
						fixedMessage = fixedMessage.withHeader(newHeader);
					}
				}
			}

			// Fix body/footer line length
			if (error.includes("footer's lines must not be longer than") || error.includes("body's lines must not be longer than")) {
				const maxLengthMatch = error.match(/(\d+) characters/);
				if (maxLengthMatch) {
					const maxLength = parseInt(maxLengthMatch[1], 10);
					const body = fixedMessage.getBody();
					
					// Wrap body lines
					const wrappedBody = this.wrapText(body.getContent(), maxLength);
					const wrappedBreaking = this.wrapText(body.getBreakingChange(), maxLength);
					
					const newBody = new CommitBody(wrappedBody, wrappedBreaking);
					fixedMessage = fixedMessage.withBody(newBody);
				}
			}
		}

		// Validate the fixed message
		const fixedValidation = await this.validate(fixedMessage);
		if (fixedValidation.isValid) {
			console.log("Simple fixes successful!");
			return fixedMessage;
		}

		// If still invalid, return null
		console.log("Simple fixes failed to resolve all validation errors");
		return null;
	}

	/**
	 * Wrap text to ensure no line exceeds the specified length
	 * @param text - The text to wrap
	 * @param maxLength - Maximum line length
	 * @returns The wrapped text
	 */
	private wrapText(text: string | undefined, maxLength: number): string | undefined {
		if (!text) {
			return text;
		}
		
		const lines = text.split('\n');
		const wrappedLines: string[] = [];

		for (const line of lines) {
			if (line.length <= maxLength) {
				wrappedLines.push(line);
			} else {
				// Simple word wrap
				const words = line.split(' ');
				let currentLine = '';

				for (const word of words) {
					if (currentLine.length + word.length + 1 <= maxLength) {
						currentLine += (currentLine ? ' ' : '') + word;
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

		return wrappedLines.join('\n');
	}
} 