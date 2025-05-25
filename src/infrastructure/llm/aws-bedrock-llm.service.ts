import type { InvokeModelCommandOutput } from "@aws-sdk/client-bedrock-runtime";

import type { ILlmPromptContext, ILlmService } from "../../application/interface/llm-service.interface.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";
import type { ELLMProvider } from "../../domain/enum/llm-provider.enum.js";

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

import { MIN_RULE_LENGTH, RULE_CONFIG_LENGTH, RULE_VALUE_INDEX, VALIDATION_LEVEL_DISABLED, VALIDATION_LEVEL_ERROR } from "../../domain/constant/numeric.constant.js";
import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { EAWSBedrockModel } from "../../domain/enum/aws-bedrock-model.enum.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

// Constants for model parameters
const DEFAULT_MAX_TOKENS: number = 4096;
const DEFAULT_TEMPERATURE: number = 0.7;
const DEFAULT_MAX_GEN_LEN: number = 2048;

/**
 * AWS Bedrock implementation of the LLM service
 */
export class AWSBedrockLlmService implements ILlmService {
	/**
	 * Generate a commit message using AWS Bedrock
	 * @param {ILlmPromptContext} context - The context for generating the commit message
	 * @param {LLMConfiguration} configuration - The LLM configuration
	 * @returns {Promise<CommitMessage>} Promise resolving to the generated commit message
	 */
	async generateCommitMessage(context: ILlmPromptContext, configuration: LLMConfiguration): Promise<CommitMessage> {
		// Extract AWS configuration
		const credential: string = configuration.getApiKey().getValue();
		const modelId: string = configuration.getModel() ?? EAWSBedrockModel.CLAUDE_3_5_SONNET_V2;

		// The API key should be in format: "region|access-key-id|secret-access-key"
		const [region, accessKeyId, secretAccessKey]: Array<string> = credential.split("|");

		if (!region || !accessKeyId || !secretAccessKey) {
			throw new Error("AWS Bedrock requires API key in format: 'region|access-key-id|secret-access-key'");
		}

		const client: BedrockRuntimeClient = new BedrockRuntimeClient({
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			region,
		});

		const systemPrompt: string = this.buildSystemPrompt(context);
		const userPrompt: string = this.buildUserPrompt(context);

		// Build the request body based on the model type
		const requestBody: Record<string, unknown> = this.buildRequestBody(modelId, systemPrompt, userPrompt);

		const command: InvokeModelCommand = new InvokeModelCommand({
			accept: "application/json",
			body: new TextEncoder().encode(JSON.stringify(requestBody)),
			contentType: "application/json",
			modelId,
		});

		const response: InvokeModelCommandOutput = await client.send(command);

		if (!response.body) {
			throw new Error("No response from AWS Bedrock");
		}

		const responseBody: unknown = JSON.parse(new TextDecoder().decode(response.body));
		const content: null | string = this.extractResponseContent(modelId, responseBody);

		if (!content) {
			throw new Error("No content in response from AWS Bedrock");
		}

		return this.parseCommitMessage(content);
	}

	/**
	 * Check if the service supports the given configuration
	 * @param {LLMConfiguration} configuration - The LLM configuration to check
	 * @returns {boolean} True if the service supports the configuration
	 */
	supports(configuration: LLMConfiguration): boolean {
		return configuration.getProvider() === ("aws-bedrock" as ELLMProvider);
	}

	/**
	 * Build the request body based on the model type
	 * @param {string} modelId - The model ID
	 * @param {string} systemPrompt - The system prompt
	 * @param {string} userPrompt - The user prompt
	 * @returns {Record<string, unknown>} The request body
	 */
	private buildRequestBody(modelId: string, systemPrompt: string, userPrompt: string): Record<string, unknown> {
		// Anthropic Claude models
		if (modelId.startsWith("anthropic.claude")) {
			return {
				anthropic_version: "bedrock-2023-05-31",
				max_tokens: DEFAULT_MAX_TOKENS,
				messages: [
					{
						content: `${systemPrompt}\n\n${userPrompt}`,
						role: "user",
					},
				],
				temperature: DEFAULT_TEMPERATURE,
			};
		}

		// Meta Llama models
		if (modelId.includes("meta.llama")) {
			return {
				max_gen_len: DEFAULT_MAX_GEN_LEN,
				prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
				temperature: DEFAULT_TEMPERATURE,
			};
		}

		// Amazon Nova models
		if (modelId.includes("amazon.nova")) {
			return {
				inferenceConfig: {
					max_new_tokens: DEFAULT_MAX_GEN_LEN,
					temperature: DEFAULT_TEMPERATURE,
				},
				messages: [
					{
						content: systemPrompt,
						role: "system",
					},
					{
						content: userPrompt,
						role: "user",
					},
				],
			};
		}

		// Amazon Titan models
		if (modelId.includes("amazon.titan")) {
			return {
				inputText: `${systemPrompt}\n\n${userPrompt}`,
				textGenerationConfig: {
					maxTokenCount: DEFAULT_MAX_GEN_LEN,
					temperature: DEFAULT_TEMPERATURE,
				},
			};
		}

		// Mistral models
		if (modelId.includes("mistral")) {
			return {
				max_tokens: DEFAULT_MAX_GEN_LEN,
				prompt: `<s>[INST] ${systemPrompt}\n\n${userPrompt} [/INST]`,
				temperature: DEFAULT_TEMPERATURE,
			};
		}

		// Cohere models
		if (modelId.includes("cohere")) {
			return {
				max_tokens: DEFAULT_MAX_GEN_LEN,
				prompt: `${systemPrompt}\n\n${userPrompt}`,
				temperature: DEFAULT_TEMPERATURE,
			};
		}

		// DeepSeek models
		if (modelId.includes("deepseek")) {
			return {
				max_tokens: DEFAULT_MAX_GEN_LEN,
				messages: [
					{
						content: systemPrompt,
						role: "system",
					},
					{
						content: userPrompt,
						role: "user",
					},
				],
				temperature: DEFAULT_TEMPERATURE,
			};
		}

		// Default format (Converse API style)
		return {
			max_tokens: DEFAULT_MAX_GEN_LEN,
			messages: [
				{
					content: systemPrompt,
					role: "system",
				},
				{
					content: userPrompt,
					role: "user",
				},
			],
			temperature: DEFAULT_TEMPERATURE,
		};
	}

	/**
	 * Build the system prompt for AWS Bedrock
	 * @param {ILlmPromptContext} context - The prompt context
	 * @returns {string} The system prompt
	 */
	private buildSystemPrompt(context: ILlmPromptContext): string {
		let prompt: string = "";

		// Check if this is a fix operation
		const isFixing: boolean = !!(context.rules && typeof context.rules === "object" && !Array.isArray(context.rules) && context.rules.validationErrors && context.rules.previousAttempt && context.diff === undefined);

		if (isFixing) {
			prompt = "You are a helpful assistant that fixes commit messages to comply with validation rules. You should maintain the original meaning and content while fixing only the format issues.\n\n";
		} else {
			prompt = "You are a helpful assistant that generates conventional commit messages based on the provided context and rules.\n\n";
		}

		// Add validation error context if present
		if (context.rules?.validationErrors && Array.isArray(context.rules.validationErrors)) {
			prompt += "IMPORTANT: The previous commit message had validation errors that must be fixed:\n";

			for (const error of context.rules.validationErrors) {
				prompt += `- ${error}\n`;
			}
			prompt += "\nMake sure the new commit message fixes all these errors.\n\n";
		}

		// Add all commitlint rules
		if (context.rules && typeof context.rules === "object" && !Array.isArray(context.rules)) {
			const formattedRules: string = this.formatCommitlintRules(context.rules);

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
				const emoji: string = desc.emoji ? ` ${desc.emoji}` : "";
				prompt += `- ${type}: ${desc.description}${emoji}\n`;
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

		if (context.rules && typeof context.rules === "object" && !Array.isArray(context.rules)) {
			// Extract body-max-line-length
			const bodyRule: unknown = context.rules["body-max-line-length"];

			if (Array.isArray(bodyRule) && bodyRule.length >= RULE_CONFIG_LENGTH && bodyRule[0] > VALIDATION_LEVEL_DISABLED && typeof bodyRule[RULE_VALUE_INDEX] === "number") {
				bodyMaxLength = bodyRule[RULE_VALUE_INDEX];
			}

			// Extract footer-max-line-length
			const footerRule: unknown = context.rules["footer-max-line-length"];

			if (Array.isArray(footerRule) && footerRule.length >= RULE_CONFIG_LENGTH && footerRule[0] > VALIDATION_LEVEL_DISABLED && typeof footerRule[RULE_VALUE_INDEX] === "number") {
				footerMaxLength = footerRule[RULE_VALUE_INDEX];
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
	 * Build the user prompt for AWS Bedrock
	 * @param {ILlmPromptContext} context - The prompt context
	 * @returns {string} The user prompt
	 */
	private buildUserPrompt(context: ILlmPromptContext): string {
		let prompt: string = "";

		// Check if this is a fix operation
		const isFixing: boolean = !!(context.rules && typeof context.rules === "object" && !Array.isArray(context.rules) && context.rules.validationErrors && context.rules.previousAttempt && context.diff === undefined);

		if (isFixing) {
			prompt = "Fix the following commit message to comply with the validation rules:\n\n";

			// Include previous attempt
			if (context.rules?.previousAttempt && typeof context.rules.previousAttempt === "string") {
				prompt += `Commit message to fix:\n${context.rules.previousAttempt}\n\n`;
			}
		} else {
			prompt = "Generate a commit message for the following changes:\n\n";

			// Include previous attempt if this is a retry with diff
			if (context.rules?.previousAttempt && typeof context.rules.previousAttempt === "string") {
				prompt += `Previous attempt (with errors):\n${context.rules.previousAttempt}\n\n`;
			}

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

		if (isFixing) {
			prompt += "Please fix the commit message to pass validation while keeping the same meaning and content.";
		} else {
			prompt += "Please generate an appropriate commit message following the conventional commit format.";
		}

		return prompt;
	}

	/**
	 * Extract the response content based on the model type
	 * @param {string} modelId - The model ID
	 * @param {any} responseBody - The response body
	 * @returns {null | string} The extracted content
	 */
	// eslint-disable-next-line @elsikora/typescript/no-explicit-any
	private extractResponseContent(modelId: string, responseBody: any): null | string {
		// Anthropic Claude models
		if (modelId.startsWith("anthropic.claude")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.content?.[0]?.text ?? null;
		}

		// Meta Llama models
		if (modelId.includes("meta.llama")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.generation ?? null;
		}

		// Amazon Nova models
		if (modelId.includes("amazon.nova")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.output?.message?.content?.[0]?.text ?? null;
		}

		// Amazon Titan models
		if (modelId.includes("amazon.titan")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.results?.[0]?.outputText ?? null;
		}

		// Mistral models
		if (modelId.includes("mistral")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.outputs?.[0]?.text ?? null;
		}

		// Cohere models
		if (modelId.includes("cohere")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.generations?.[0]?.text ?? null;
		}

		// DeepSeek models
		if (modelId.includes("deepseek")) {
			// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
			return responseBody.choices?.[0]?.message?.content ?? null;
		}

		// Default extraction attempts
		// eslint-disable-next-line @elsikora/typescript/no-unsafe-member-access, @elsikora/typescript/no-unsafe-return
		return responseBody.content ?? responseBody.text ?? responseBody.completion ?? null;
	}

	/**
	 * Format commitlint rules into human-readable instructions
	 * @param {Record<string, unknown>} rules - The commitlint rules object
	 * @returns {string} Formatted rules as string
	 */
	private formatCommitlintRules(rules: Record<string, unknown>): string {
		const formattedRules: Array<string> = [];

		for (const [ruleName, ruleConfig] of Object.entries(rules)) {
			if (!Array.isArray(ruleConfig) || ruleConfig.length < MIN_RULE_LENGTH) continue;

			const [level, condition, value]: [unknown, unknown, unknown] = ruleConfig as [unknown, unknown, unknown];

			if (level === VALIDATION_LEVEL_DISABLED) continue; // Skip disabled rules

			const isError: boolean = level === VALIDATION_LEVEL_ERROR;
			const prefix: string = isError ? "MUST" : "SHOULD";
			const conditionString: string = String(condition);

			switch (ruleName) {
				case "body-max-line-length": {
					if (typeof value === "number") {
						formattedRules.push(`Body lines ${prefix} be at most ${value} characters (wrap long lines with line breaks)`);
					}

					break;
				}

				case "footer-max-line-length": {
					if (typeof value === "number") {
						formattedRules.push(`Footer lines ${prefix} be at most ${value} characters (Note: the 'body' field is treated as footer, wrap long lines)`);
					}

					break;
				}

				case "header-max-length": {
					if (typeof value === "number") {
						formattedRules.push(`Header (type(scope): subject) ${prefix} be at most ${value} characters`);
					}

					break;
				}

				case "scope-case": {
					if (Array.isArray(value)) {
						formattedRules.push(`Scope ${prefix} be in ${value.join(" or ")} case`);
					}

					break;
				}

				case "scope-enum": {
					if (conditionString === "always" && Array.isArray(value)) {
						formattedRules.push(`Scope ${prefix} be one of: ${value.join(", ")}`);
					}

					break;
				}

				case "subject-case": {
					if (Array.isArray(value)) {
						formattedRules.push(`Subject ${prefix} be in ${value.join(" or ")} case`);
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
						formattedRules.push(`Subject ${prefix} be at most ${value} characters`);
					}

					break;
				}

				case "subject-min-length": {
					if (typeof value === "number") {
						formattedRules.push(`Subject ${prefix} be at least ${value} characters`);
					}

					break;
				}

				case "type-case": {
					if (Array.isArray(value)) {
						formattedRules.push(`Type ${prefix} be in ${value.join(" or ")} case`);
					}

					break;
				}

				case "type-enum": {
					if (conditionString === "always" && Array.isArray(value)) {
						formattedRules.push(`Type ${prefix} be one of: ${value.join(", ")}`);
					}

					break;
				}

				default: {
					// Handle other rules generically
					if (condition && value !== undefined) {
						formattedRules.push(`${ruleName}: ${conditionString} ${JSON.stringify(value)}`);
					}
				}
			}
		}

		return formattedRules.join("\n");
	}

	/**
	 * Parse the commit message from the LLM response
	 * @param {string} content - The response content
	 * @returns {CommitMessage} The parsed commit message
	 */
	private parseCommitMessage(content: string): CommitMessage {
		try {
			// Clean up the content - remove markdown code blocks if present
			let cleanContent: string = content.trim();

			// Remove markdown code blocks with more specific pattern - fixed regex
			cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/```$/m, "");

			// Try to extract JSON if it's wrapped in other text - use safer approach
			const firstBrace: number = cleanContent.indexOf("{");
			const lastBrace: number = cleanContent.lastIndexOf("}");

			if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
				cleanContent = cleanContent.slice(firstBrace, lastBrace + 1);
			}

			// Try to parse as JSON
			interface ICommitMessageJson {
				body?: string;
				breaking?: string;
				scope?: string;
				subject: string;
				type: string;
			}
			const parsed: ICommitMessageJson = JSON.parse(cleanContent) as ICommitMessageJson;

			// Validate required fields
			if (!parsed.type || !parsed.subject) {
				throw new Error("Missing required fields: type and subject");
			}

			const header: CommitHeader = new CommitHeader(parsed.type, parsed.subject, parsed.scope);

			// Strip "BREAKING CHANGE:" prefix if included in the breaking field
			let breakingChange: string | undefined = parsed.breaking;

			if (breakingChange?.startsWith("BREAKING CHANGE:")) {
				breakingChange = breakingChange.slice("BREAKING CHANGE:".length).trim();
			}

			const body: CommitBody = new CommitBody(parsed.body, breakingChange);

			return new CommitMessage(header, body);
		} catch {
			// Fallback: try to parse as plain text
			const lines: Array<string> = content.trim().split("\n");

			if (lines.length === 0 || !lines[0]) {
				throw new Error("No content to parse");
			}

			const headerLine: string = lines[0];

			// Parse header: type(scope): subject
			const headerMatch: null | RegExpExecArray = /^(\w+)(?:\(([^)]+)\))?: (.+)$/.exec(headerLine);

			if (!headerMatch) {
				throw new Error(`Invalid commit message format. Could not parse: "${headerLine}"`);
			}

			const HEADER_TYPE_INDEX: number = 1;
			const HEADER_SCOPE_INDEX: number = 2;
			const HEADER_SUBJECT_INDEX: number = 3;

			const type: string | undefined = headerMatch[HEADER_TYPE_INDEX];
			const scope: string | undefined = headerMatch[HEADER_SCOPE_INDEX];
			const subject: string | undefined = headerMatch[HEADER_SUBJECT_INDEX];

			if (!type || !subject) {
				throw new Error("Missing required fields: type and subject");
			}

			const header: CommitHeader = new CommitHeader(type, subject, scope);

			// Parse body and breaking changes
			let bodyContent: string = "";
			let breakingChange: string | undefined;

			for (let index: number = 1; index < lines.length; index++) {
				const line: string | undefined = lines[index];

				if (!line) continue;

				if (line.startsWith("BREAKING CHANGE:")) {
					breakingChange = line.slice("BREAKING CHANGE:".length).trim();
				} else if (line.trim()) {
					bodyContent += line + "\n";
				}
			}

			const body: CommitBody = new CommitBody(bodyContent.trim() || undefined, breakingChange);

			return new CommitMessage(header, body);
		}
	}
}
