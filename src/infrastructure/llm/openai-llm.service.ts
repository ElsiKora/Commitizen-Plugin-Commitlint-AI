import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ILLMPromptContext, ILLMService } from "../../application/interface/llm-service.interface.js";

import OpenAI from "openai";

import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";
import { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";
import { EOpenAIModel } from "../../domain/enum/openai-model.enum.js";

/**
 * OpenAI implementation of the LLM service
 */
export class OpenAILLMService implements ILLMService {
	/**
	 * Generate a commit message using OpenAI
	 * @param context - The context for generating the commit message
	 * @param configuration - The LLM configuration
	 * @returns Promise resolving to the generated commit message
	 */
	async generateCommitMessage(context: ILLMPromptContext, configuration: LLMConfiguration): Promise<CommitMessage> {
		const openai = new OpenAI({
			apiKey: configuration.getApiKey().getValue(),
		});

		const systemPrompt = this.buildSystemPrompt(context);
		const userPrompt = this.buildUserPrompt(context);

		const response = await openai.chat.completions.create({
			model: configuration.getModel() || EOpenAIModel.GPT_4O,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.7,
			max_tokens: 2048,
		});

		const content = response.choices[0]?.message?.content;
		if (!content) {
			throw new Error("No response from OpenAI");
		}

		return this.parseCommitMessage(content);
	}

	/**
	 * Check if the service supports the given configuration
	 * @param configuration - The LLM configuration to check
	 * @returns True if the service supports the configuration
	 */
	supports(configuration: LLMConfiguration): boolean {
		return configuration.getProvider() === ELLMProvider.OPENAI;
	}

	/**
	 * Format commitlint rules into human-readable instructions
	 * @param rules - The commitlint rules object
	 * @returns Formatted rules as string
	 */
	private formatCommitlintRules(rules: Record<string, any>): string {
		const formattedRules: string[] = [];

		for (const [ruleName, ruleConfig] of Object.entries(rules)) {
			if (!Array.isArray(ruleConfig) || ruleConfig.length < 2) continue;

			const [level, condition, value] = ruleConfig;
			if (level === 0) continue; // Skip disabled rules

			const isError = level === 2;
			const prefix = isError ? "MUST" : "SHOULD";

			switch (ruleName) {
				case "type-enum":
					if (condition === "always" && Array.isArray(value)) {
						formattedRules.push(`Type ${prefix} be one of: ${value.join(", ")}`);
					}
					break;
				case "scope-enum":
					if (condition === "always" && Array.isArray(value)) {
						formattedRules.push(`Scope ${prefix} be one of: ${value.join(", ")}`);
					}
					break;
				case "subject-empty":
					formattedRules.push(`Subject ${prefix} ${condition === "never" ? "not be empty" : "be empty"}`);
					break;
				case "subject-case":
					if (Array.isArray(value)) {
						formattedRules.push(`Subject ${prefix} be in ${value.join(" or ")} case`);
					}
					break;
				case "subject-full-stop":
					formattedRules.push(`Subject ${prefix} ${condition === "never" ? "not end with a period" : "end with a period"}`);
					break;
				case "subject-max-length":
					if (typeof value === "number") {
						formattedRules.push(`Subject ${prefix} be at most ${value} characters`);
					}
					break;
				case "subject-min-length":
					if (typeof value === "number") {
						formattedRules.push(`Subject ${prefix} be at least ${value} characters`);
					}
					break;
				case "header-max-length":
					if (typeof value === "number") {
						formattedRules.push(`Header (type(scope): subject) ${prefix} be at most ${value} characters`);
					}
					break;
				case "body-max-line-length":
					if (typeof value === "number") {
						formattedRules.push(`Body lines ${prefix} be at most ${value} characters (wrap long lines with line breaks)`);
					}
					break;
				case "footer-max-line-length":
					if (typeof value === "number") {
						formattedRules.push(`Footer lines ${prefix} be at most ${value} characters (Note: the 'body' field is treated as footer, wrap long lines)`);
					}
					break;
				case "type-case":
					if (Array.isArray(value)) {
						formattedRules.push(`Type ${prefix} be in ${value.join(" or ")} case`);
					}
					break;
				case "scope-case":
					if (Array.isArray(value)) {
						formattedRules.push(`Scope ${prefix} be in ${value.join(" or ")} case`);
					}
					break;
				default:
					// Handle other rules generically
					if (condition && value !== undefined) {
						formattedRules.push(`${ruleName}: ${condition} ${JSON.stringify(value)}`);
					}
			}
		}

		return formattedRules.join("\n");
	}

	/**
	 * Build the system prompt for OpenAI
	 * @param context - The prompt context
	 * @returns The system prompt
	 */
	private buildSystemPrompt(context: ILLMPromptContext): string {
		let prompt = "";

		// Check if this is a fix operation
		const isFixing = !!(context.rules && typeof context.rules === 'object' && 
			!Array.isArray(context.rules) && 
			context.rules.validationErrors && 
			context.rules.previousAttempt &&
			context.diff === undefined);

		if (isFixing) {
			prompt = "You are a helpful assistant that fixes commit messages to comply with validation rules. You should maintain the original meaning and content while fixing only the format issues.\n\n";
		} else {
			prompt = "You are a helpful assistant that generates conventional commit messages based on the provided context and rules.\n\n";
		}

		// Add validation error context if present
		if (context.rules?.validationErrors) {
			prompt += "IMPORTANT: The previous commit message had validation errors that must be fixed:\n";
			for (const error of context.rules.validationErrors) {
				prompt += `- ${error}\n`;
			}
			prompt += "\nMake sure the new commit message fixes all these errors.\n\n";
		}

		// Add all commitlint rules
		if (context.rules && typeof context.rules === 'object' && !Array.isArray(context.rules)) {
			const formattedRules = this.formatCommitlintRules(context.rules);
			if (formattedRules) {
				prompt += "Commit message rules:\n" + formattedRules + "\n\n";
			}
		}

		if (context.typeEnum && context.typeEnum.length > 0) {
			prompt += `Available commit types: ${context.typeEnum.join(", ")}\n`;
		}

		if (context.typeDescriptions) {
			prompt += "\nType descriptions:\n";
			for (const [type, desc] of Object.entries(context.typeDescriptions)) {
				prompt += `- ${type}: ${desc.description}${desc.emoji ? ` ${desc.emoji}` : ""}\n`;
			}
		}

		if (context.subject.maxLength) {
			prompt += `\nSubject must be at most ${context.subject.maxLength} characters.`;
		}

		if (context.subject.minLength) {
			prompt += `\nSubject must be at least ${context.subject.minLength} characters.`;
		}

		// Extract body/footer line length rules
		let bodyMaxLength: number | undefined;
		let footerMaxLength: number | undefined;
		
		if (context.rules && typeof context.rules === 'object' && !Array.isArray(context.rules)) {
			// Extract body-max-line-length
			const bodyRule = context.rules['body-max-line-length'];
			if (Array.isArray(bodyRule) && bodyRule.length >= 3 && bodyRule[0] > 0 && typeof bodyRule[2] === 'number') {
				bodyMaxLength = bodyRule[2];
			}
			
			// Extract footer-max-line-length
			const footerRule = context.rules['footer-max-line-length'];
			if (Array.isArray(footerRule) && footerRule.length >= 3 && footerRule[0] > 0 && typeof footerRule[2] === 'number') {
				footerMaxLength = footerRule[2];
			}
		}

		// Add body formatting rules if line length rules exist
		if (bodyMaxLength || footerMaxLength) {
			prompt += "\n\nIMPORTANT: Body formatting rules:";
			prompt += "\n- The 'body' field in the JSON corresponds to the commit message body/footer";
			
			if (bodyMaxLength) {
				prompt += `\n- Each line in the body must be wrapped to not exceed ${bodyMaxLength} characters`;
			}
			if (footerMaxLength) {
				prompt += `\n- Footer lines must be wrapped to not exceed ${footerMaxLength} characters`;
			}
			
			prompt += "\n- The 'breaking' field also follows the same line length rules";
			prompt += "\n- Use line breaks (\\n) to wrap long lines";
			prompt += "\n- Empty lines between paragraphs are allowed";
		}

		prompt += "\n\nGenerate a commit message in the following JSON format:\n";
		prompt += '{\n  "type": "commit type",\n  "scope": "optional scope",\n  "subject": "commit subject",\n  "body": "optional body",\n  "breaking": "optional breaking change description"\n}';
		prompt += "\n\nIMPORTANT: Respond ONLY with the JSON object. Do not include markdown code blocks, explanations, or any other text. Just the raw JSON.";
		prompt += "\n\nIMPORTANT: Follow ALL the rules listed above. The commit message MUST pass validation.";

		return prompt;
	}

	/**
	 * Build the user prompt for OpenAI
	 * @param context - The prompt context
	 * @returns The user prompt
	 */
	private buildUserPrompt(context: ILLMPromptContext): string {
		let prompt = "";

		// Check if this is a fix operation
		const isFixing = !!(context.rules && typeof context.rules === 'object' && 
			!Array.isArray(context.rules) && 
			context.rules.validationErrors && 
			context.rules.previousAttempt &&
			context.diff === undefined);

		if (isFixing) {
			prompt = "Fix the following commit message to comply with the validation rules:\n\n";
			
			// Include previous attempt
			if (context.rules?.previousAttempt) {
				prompt += `Commit message to fix:\n${context.rules.previousAttempt}\n\n`;
			}
		} else {
			prompt = "Generate a commit message for the following changes:\n\n";

			// Include previous attempt if this is a retry with diff
			if (context.rules?.previousAttempt) {
				prompt += `Previous attempt (with errors):\n${context.rules.previousAttempt}\n\n`;
			}

			if (context.diff) {
				prompt += `Diff:\n${context.diff}\n\n`;
			}

			if (context.files) {
				prompt += `Files changed:\n${context.files}\n\n`;
			}
		}

		if (context.rules && typeof context.rules === 'object' && !Array.isArray(context.rules) && context.rules.instructions) {
			prompt += `${context.rules.instructions}\n\n`;
		}

		if (isFixing) {
			prompt += "Please fix the commit message to pass validation while keeping the same meaning and content.";
		} else {
			prompt += "Please generate an appropriate commit message following the conventional commit format.";
		}

		return prompt;
	}

	/**
	 * Parse the commit message from the LLM response
	 * @param content - The response content
	 * @returns The parsed commit message
	 */
	private parseCommitMessage(content: string): CommitMessage {
		try {
			// Clean up the content - remove markdown code blocks if present
			let cleanContent = content.trim();
			
			// Remove markdown code blocks
			cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
			cleanContent = cleanContent.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
			
			// Try to extract JSON if it's wrapped in other text
			const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				cleanContent = jsonMatch[0];
			}
			
			// Try to parse as JSON
			const parsed = JSON.parse(cleanContent);
			
			// Validate required fields
			if (!parsed.type || !parsed.subject) {
				throw new Error("Missing required fields: type and subject");
			}
			
			const header = new CommitHeader(
				parsed.type,
				parsed.subject,
				parsed.scope
			);

			const body = new CommitBody(
				parsed.body,
				parsed.breaking
			);

			return new CommitMessage(header, body);
		} catch (jsonError) {
			// Fallback: try to parse as plain text
			const lines = content.trim().split("\n");
			const headerLine = lines[0];

			// Parse header: type(scope): subject
			const headerMatch = headerLine.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
			if (!headerMatch) {
				throw new Error(`Invalid commit message format. Could not parse: "${headerLine}"`);
			}

			const [, type, scope, subject] = headerMatch;
			const header = new CommitHeader(type, subject, scope);

			// Parse body and breaking changes
			let bodyContent = "";
			let breakingChange: string | undefined;

			for (let i = 1; i < lines.length; i++) {
				const line = lines[i];
				if (line.startsWith("BREAKING CHANGE:")) {
					breakingChange = line.substring("BREAKING CHANGE:".length).trim();
				} else if (line.trim()) {
					bodyContent += line + "\n";
				}
			}

			const body = new CommitBody(bodyContent.trim() || undefined, breakingChange);

			return new CommitMessage(header, body);
		}
	}
} 