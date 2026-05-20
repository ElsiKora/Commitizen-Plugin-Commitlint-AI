import type { ILlmPromptContext, ILlmService } from "@application/interface/llm-service.interface";
import type { LLMConfiguration } from "@domain/entity/llm-configuration.entity";
import type { AiCoreAdapter, IGenerateResult } from "@elsikora/ai-core";

import { NUMERIC_CONSTANT } from "@domain/constant/numeric.constant";
import { CommitMessage } from "@domain/entity/commit-message.entity";
import { CommitBody } from "@domain/value-object/commit-body.value-object";
import { CommitHeader } from "@domain/value-object/commit-header.value-object";
import { EGenerateMode, ELLMMessageRole } from "@elsikora/ai-core";

/**
 * Commit message LLM service backed by the unified AI-Core runtime.
 */
export class AiCoreLlmService implements ILlmService {
	private readonly AI_CORE_ADAPTER: AiCoreAdapter;

	private readonly MODULE_ID: string;

	constructor(aiCoreAdapter: AiCoreAdapter, moduleId: string) {
		this.AI_CORE_ADAPTER = aiCoreAdapter;
		this.MODULE_ID = moduleId;
	}

	async generateCommitMessage(context: ILlmPromptContext, configuration: LLMConfiguration): Promise<CommitMessage> {
		const result: IGenerateResult = await this.AI_CORE_ADAPTER.generate({
			credential: configuration.getApiKey().getValue(),
			messages: [
				{
					content: this.buildSystemPrompt(context),
					role: ELLMMessageRole.SYSTEM,
				},
				{
					content: this.buildUserPrompt(context),
					role: ELLMMessageRole.USER,
				},
			],
			mode: EGenerateMode.PROFILE,
			moduleId: this.MODULE_ID,
		});

		return this.parseCommitMessage(result.text);
	}

	private buildBodyFormattingRules(context: ILlmPromptContext): string {
		const bodyMaxLength: number | undefined = this.extractNumericRuleValue(context.rules, "body-max-line-length");
		const footerMaxLength: number | undefined = this.extractNumericRuleValue(context.rules, "footer-max-line-length");

		if (!bodyMaxLength && !footerMaxLength) {
			return "";
		}

		let prompt: string = "\n\nIMPORTANT: Body formatting rules:";
		prompt += "\n- The 'body' field in the JSON corresponds to the commit message body/footer";

		if (bodyMaxLength) {
			prompt += `\n- Each line in the body must be wrapped to not exceed ${String(bodyMaxLength)} characters`;
		}

		if (footerMaxLength) {
			prompt += `\n- Footer lines must be wrapped to not exceed ${String(footerMaxLength)} characters`;
		}

		prompt += "\n- The 'breaking' field also follows the same line length rules";
		prompt += "\n- Use line breaks (\\n) to wrap long lines";
		prompt += "\n- Empty lines between paragraphs are allowed";

		return prompt;
	}

	private buildSystemPrompt(context: ILlmPromptContext): string {
		const isFixing: boolean = this.isFixingValidationErrors(context);
		let prompt: string = isFixing ? "You are a helpful assistant that fixes commit messages to comply with validation rules. You should maintain the original meaning and content while fixing only the format issues.\n\n" : "You are a helpful assistant that generates conventional commit messages based on the provided context and rules.\n\n";

		if (context.rules?.validationErrors && Array.isArray(context.rules.validationErrors)) {
			prompt += "IMPORTANT: The previous commit message had validation errors that must be fixed:\n";

			for (const error of context.rules.validationErrors) {
				prompt += `- ${String(error)}\n`;
			}

			prompt += "\nMake sure the new commit message fixes all these errors.\n\n";
		}

		if (context.rules && typeof context.rules === "object" && !Array.isArray(context.rules)) {
			const formattedRules: string = this.formatCommitlintRules(context.rules);

			if (formattedRules) {
				prompt += `Commit message rules:\n${formattedRules}\n\n`;
			}
		}

		if (context.typeEnum && context.typeEnum.length > 0) {
			prompt += `Available commit types: ${context.typeEnum.join(", ")}\n`;
		}

		if (context.typeDescriptions) {
			prompt += "\nType descriptions:\n";

			for (const [type, description] of Object.entries(context.typeDescriptions)) {
				const emoji: string = description.emoji ? ` ${description.emoji}` : "";
				prompt += `- ${type}: ${description.description}${emoji}\n`;
			}
		}

		if (context.subject.maxLength) {
			prompt += `\nSubject must be at most ${String(context.subject.maxLength)} characters.`;
		}

		if (context.subject.minLength) {
			prompt += `\nSubject must be at least ${String(context.subject.minLength)} characters.`;
		}

		prompt += this.buildBodyFormattingRules(context);
		prompt += '\n\nGenerate a commit message in the following JSON format:\n{\n  "type": "commit type",\n  "scope": "optional scope",\n  "subject": "commit subject",\n  "body": "optional body",\n  "breaking": "optional breaking change description"\n}';
		prompt += "\n\nIMPORTANT: Respond ONLY with the JSON object. Do not include markdown code blocks, explanations, or any other text. Just the raw JSON.";
		prompt += "\n\nIMPORTANT: Follow ALL the rules listed above. The commit message MUST pass validation.";

		return prompt;
	}

	private buildUserPrompt(context: ILlmPromptContext): string {
		const isFixing: boolean = this.isFixingValidationErrors(context);
		let prompt: string = isFixing ? "Fix the following commit message to comply with the validation rules:\n\n" : "Generate a commit message for the following changes:\n\n";

		if (context.rules?.previousAttempt && typeof context.rules.previousAttempt === "string") {
			prompt += isFixing ? `Commit message to fix:\n${context.rules.previousAttempt}\n\n` : `Previous attempt (with errors):\n${context.rules.previousAttempt}\n\n`;
		}

		if (!isFixing) {
			if (context.diff) {
				prompt += `Diff:\n${context.diff}\n\n`;
			}

			if (context.files) {
				prompt += `Files changed:\n${context.files}\n\n`;
			}
		}

		if (context.rules && typeof context.rules === "object" && !Array.isArray(context.rules) && context.rules.instructions && typeof context.rules.instructions === "string") {
			prompt += `${context.rules.instructions}\n\n`;
		}

		return prompt + (isFixing ? "Please fix the commit message to pass validation while keeping the same meaning and content." : "Please generate an appropriate commit message following the conventional commit format.");
	}

	private extractNumericRuleValue(rules: Record<string, unknown> | undefined, ruleName: string): number | undefined {
		if (!rules) {
			return undefined;
		}

		const ruleConfig: unknown = rules[ruleName];

		const level: unknown = Array.isArray(ruleConfig) ? ruleConfig[0] : undefined;

		const ruleValue: unknown = Array.isArray(ruleConfig) ? ruleConfig[NUMERIC_CONSTANT.RULE_VALUE_INDEX] : undefined;

		if (Array.isArray(ruleConfig) && ruleConfig.length >= NUMERIC_CONSTANT.RULE_CONFIG_LENGTH && typeof level === "number" && level > NUMERIC_CONSTANT.VALIDATION_LEVEL_DISABLED && typeof ruleValue === "number") {
			return ruleValue;
		}

		return undefined;
	}

	private formatCommitlintRules(rules: Record<string, unknown>): string {
		const formattedRules: Array<string> = [];

		for (const [ruleName, ruleConfig] of Object.entries(rules)) {
			if (!Array.isArray(ruleConfig) || ruleConfig.length < NUMERIC_CONSTANT.MIN_RULE_LENGTH) {
				continue;
			}

			const [level, condition, value]: [unknown, unknown, unknown] = ruleConfig as [unknown, unknown, unknown];

			if (level === NUMERIC_CONSTANT.VALIDATION_LEVEL_DISABLED) {
				continue;
			}

			const prefix: string = level === NUMERIC_CONSTANT.VALIDATION_LEVEL_ERROR ? "MUST" : "SHOULD";
			const conditionString: string = String(condition);

			this.pushFormattedRule(formattedRules, ruleName, prefix, conditionString, value);
		}

		return formattedRules.join("\n");
	}

	private isFixingValidationErrors(context: ILlmPromptContext): boolean {
		return Boolean(context.rules && typeof context.rules === "object" && !Array.isArray(context.rules) && context.rules.validationErrors && context.rules.previousAttempt && context.diff === undefined);
	}

	private normalizeBreakingChange(value: string | undefined): string | undefined {
		if (!value?.startsWith("BREAKING CHANGE:")) {
			return value;
		}

		return value.slice("BREAKING CHANGE:".length).trim();
	}

	private parseCommitMessage(content: string): CommitMessage {
		try {
			let cleanContent: string = content
				.trim()
				.replace(/^```(?:json)?\s*/i, "")
				.replace(/```$/m, "");
			const firstBrace: number = cleanContent.indexOf("{");
			const lastBrace: number = cleanContent.lastIndexOf("}");

			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				cleanContent = cleanContent.slice(firstBrace, lastBrace + 1);
			}

			const parsed: { body?: string; breaking?: string; scope?: string; subject?: string; type?: string } = JSON.parse(cleanContent) as { body?: string; breaking?: string; scope?: string; subject?: string; type?: string };

			if (!parsed.type || !parsed.subject) {
				throw new Error("Missing required fields: type and subject");
			}

			return new CommitMessage(new CommitHeader(parsed.type, parsed.subject, parsed.scope), new CommitBody(parsed.body, this.normalizeBreakingChange(parsed.breaking)));
		} catch {
			return this.parsePlainTextCommitMessage(content);
		}
	}

	private parsePlainTextCommitMessage(content: string): CommitMessage {
		const lines: Array<string> = content.trim().split("\n");
		const headerLine: string | undefined = lines[0];

		if (!headerLine) {
			throw new Error("No content to parse");
		}

		const headerMatch: null | RegExpExecArray = /^(\w+)(?:\(([^)]+)\))?: (.+)$/.exec(headerLine);

		if (!headerMatch) {
			throw new Error(`Invalid commit message format. Could not parse: "${headerLine}"`);
		}

		const headerTypeIndex: number = 1;
		const headerScopeIndex: number = 2;
		const headerSubjectIndex: number = 3;
		const type: string | undefined = headerMatch[headerTypeIndex];
		const scope: string | undefined = headerMatch[headerScopeIndex];
		const subject: string | undefined = headerMatch[headerSubjectIndex];

		if (!type || !subject) {
			throw new Error("Missing required fields: type and subject");
		}

		let bodyContent: string = "";
		let breakingChange: string | undefined;

		for (let index: number = 1; index < lines.length; index++) {
			const line: string | undefined = lines[index];

			if (!line) {
				continue;
			}

			if (line.startsWith("BREAKING CHANGE:")) {
				breakingChange = line.slice("BREAKING CHANGE:".length).trim();
			} else if (line.trim()) {
				bodyContent += `${line}\n`;
			}
		}

		return new CommitMessage(new CommitHeader(type, subject, scope), new CommitBody(bodyContent.trim() || undefined, breakingChange));
	}

	private pushFormattedRule(formattedRules: Array<string>, ruleName: string, prefix: string, conditionString: string, value: unknown): void {
		switch (ruleName) {
			case "body-max-line-length": {
				if (typeof value === "number") {
					formattedRules.push(`Body lines ${prefix} be at most ${String(value)} characters (wrap long lines with line breaks)`);
				}

				break;
			}

			case "footer-max-line-length": {
				if (typeof value === "number") {
					formattedRules.push(`Footer lines ${prefix} be at most ${String(value)} characters (Note: the 'body' field is treated as footer, wrap long lines)`);
				}

				break;
			}

			case "header-max-length": {
				if (typeof value === "number") {
					formattedRules.push(`Header (type(scope): subject) ${prefix} be at most ${String(value)} characters`);
				}

				break;
			}

			case "scope-case": {
				if (Array.isArray(value)) {
					formattedRules.push(`scope ${prefix} be in ${value.join(" or ")} case`);
				}

				break;
			}

			case "scope-enum": {
				if (conditionString === "always" && Array.isArray(value)) {
					formattedRules.push(`scope ${prefix} be one of: ${value.join(", ")}`);
				}

				break;
			}

			case "subject-case": {
				if (Array.isArray(value)) {
					formattedRules.push(`subject ${prefix} be in ${value.join(" or ")} case`);
				}

				break;
			}

			case "subject-empty": {
				formattedRules.push(`Subject ${prefix} ${conditionString === "never" ? "not be empty" : "be empty"}`);

				break;
			}

			case "subject-full-stop": {
				formattedRules.push(`Subject ${prefix} ${conditionString === "never" ? "not end with a period" : "end with a period"}`);

				break;
			}

			case "subject-max-length": {
				if (typeof value === "number") {
					formattedRules.push(`Subject ${prefix} be at most ${String(value)} characters`);
				}

				break;
			}

			case "subject-min-length": {
				if (typeof value === "number") {
					formattedRules.push(`Subject ${prefix} be at least ${String(value)} characters`);
				}

				break;
			}

			case "type-case": {
				if (Array.isArray(value)) {
					formattedRules.push(`type ${prefix} be in ${value.join(" or ")} case`);
				}

				break;
			}

			case "type-enum": {
				if (conditionString === "always" && Array.isArray(value)) {
					formattedRules.push(`type ${prefix} be one of: ${value.join(", ")}`);
				}

				break;
			}

			default: {
				if (conditionString && value !== undefined) {
					formattedRules.push(`${ruleName}: ${conditionString} ${JSON.stringify(value)}`);
				}
			}
		}
	}
}
