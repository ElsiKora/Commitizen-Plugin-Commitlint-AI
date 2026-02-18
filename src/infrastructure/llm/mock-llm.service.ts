import type { ILlmPromptContext, ILlmService } from "../../application/interface/llm-service.interface.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

const SIMULATED_DELAY_MS: number = 500;
const DEFAULT_SCOPE: string = "core";
const DEFAULT_TYPE: string = "chore";
const DEFAULT_SUBJECT: string = "update implementation";
const DEFAULT_SCOPE_MAX_LENGTH: number = 30;
const DEFAULT_SUBJECT_MAX_LENGTH: number = 80;
const DEFAULT_SUBJECT_MIN_LENGTH: number = 3;
const HEADER_MAX_LENGTH: number = 100;
const HEADER_FORMAT_OVERHEAD: number = 4; // type + "(" + ")" + ": "
const RULE_VALUE_INDEX: number = 2;
const MAX_FILES_FOR_BODY: number = 10;
const MAX_FILES_LISTED_IN_BODY: number = 5;
const MIN_HEADER_LENGTH: number = 10;

/**
 * Mock LLM service for testing without real API calls
 * Activated when MOCK_LLM environment variable is set to "true"
 */
export class MockLlmService implements ILlmService {
	/**
	 * Generate a mock commit message based on context analysis
	 * @param {ILlmPromptContext} context - The context for generating the commit message
	 * @param {LLMConfiguration} _configuration - The LLM configuration (unused in mock)
	 * @returns {Promise<CommitMessage>} Promise resolving to the generated commit message
	 */
	async generateCommitMessage(context: ILlmPromptContext, _configuration: LLMConfiguration): Promise<CommitMessage> {
		process.stdout.write("🎭 Using MOCK LLM provider (no real API calls)\n");

		// Simulate API delay
		await new Promise<void>((resolve: () => void) => setTimeout(resolve, SIMULATED_DELAY_MS));

		const filesChanged: Array<string> =
			context.files
				?.split("\n")
				.map((file: string) => file.trim())
				.filter((file: string) => file.length > 0) ?? [];
		const diffContent: string = context.diff ?? "";

		const hasNewFile: boolean = diffContent.includes("new file mode");
		const hasDeletedFile: boolean = diffContent.includes("deleted file mode");
		const hasTest: boolean = filesChanged.some((file: string) => file.includes("test") || file.includes("spec"));
		const hasDocument: boolean = filesChanged.some((file: string) => file.includes("README") || file.includes(".md") || file.includes("doc"));
		const hasSource: boolean = filesChanged.some((file: string) => file.includes("src/") || file.includes("lib/"));

		const type: string = this.resolveType(context, hasNewFile, hasDocument, hasSource, hasTest);
		const scopeMaxLength: number = this.extractNumericRuleValue(context.rules, "scope-max-length") ?? DEFAULT_SCOPE_MAX_LENGTH;
		const scope: string = this.resolveScope(filesChanged, scopeMaxLength);
		const subjectMinLength: number = context.subject.minLength ?? DEFAULT_SUBJECT_MIN_LENGTH;
		const subjectMaxLength: number = context.subject.maxLength ?? DEFAULT_SUBJECT_MAX_LENGTH;
		const subject: string = this.resolveSubject(filesChanged, hasDeletedFile, hasDocument, hasNewFile, hasTest, scope, subjectMaxLength, subjectMinLength, type);
		const body: string | undefined = this.resolveBody(filesChanged);

		// Create commit message
		const header: CommitHeader = new CommitHeader(type, subject, scope);
		const commitBody: CommitBody = new CommitBody(body);
		const commitMessage: CommitMessage = new CommitMessage(header, commitBody);

		process.stdout.write(`🎭 Mock generated commit message:\n${commitMessage.toString()}\n\n`);

		return commitMessage;
	}

	/**
	 * Check if the service supports the given configuration
	 * Mock service supports all providers when MOCK_LLM is enabled
	 * @param {LLMConfiguration} _configuration - The LLM configuration (unused)
	 * @returns {boolean} True if mock mode is enabled
	 */
	supports(_configuration: LLMConfiguration): boolean {
		return this.isMockEnabled();
	}

	private extractFileName(filePath: string): string {
		const filePathSegments: Array<string> = filePath.split("/");
		const lastSegmentIndex: number = filePathSegments.length - 1;
		const fileName: string = lastSegmentIndex >= 0 ? (filePathSegments[lastSegmentIndex] ?? "file") : "file";

		return fileName.length > 0 ? fileName : "file";
	}

	/**
	 * Extract a numeric value from commitlint rules
	 * @param {unknown} rules - The commitlint rules
	 * @param {string} ruleName - The name of the rule to extract
	 * @returns {number | undefined} The numeric value or undefined
	 */
	private extractNumericRuleValue(rules: Record<string, unknown> | undefined, ruleName: string): number | undefined {
		if (!rules) {
			return undefined;
		}

		const rawRule: unknown = rules[ruleName];

		if (!Array.isArray(rawRule)) {
			return undefined;
		}

		const ruleItems: Array<unknown> = rawRule;
		const numericValue: unknown = ruleItems[RULE_VALUE_INDEX];

		if (typeof numericValue === "number") {
			return numericValue;
		}

		return undefined;
	}

	/**
	 * Check if mock mode is enabled via environment variable
	 * @returns {boolean} True if MOCK_LLM environment variable is set to "true" or "1"
	 */
	private isMockEnabled(): boolean {
		return process.env.MOCK_LLM === "true" || process.env.MOCK_LLM === "1";
	}

	private normalizeToken(rawToken: string): string {
		let normalized: string = "";

		for (const character of rawToken) {
			const isUppercase: boolean = character >= "A" && character <= "Z";
			const isLowercase: boolean = character >= "a" && character <= "z";
			const isDigit: boolean = character >= "0" && character <= "9";
			const isAllowedSymbol: boolean = character === "-" || character === "_";

			if (isUppercase || isLowercase || isDigit || isAllowedSymbol) {
				normalized += character;
			} else {
				normalized += "-";
			}
		}

		return normalized;
	}

	private resolveBody(filesChanged: Array<string>): string | undefined {
		if (filesChanged.length === 0 || filesChanged.length > MAX_FILES_FOR_BODY) {
			return undefined;
		}

		const listedFiles: string = filesChanged
			.slice(0, MAX_FILES_LISTED_IN_BODY)
			.map((file: string) => `- ${file}`)
			.join("\n");
		let body: string = `modified files:\n${listedFiles}`;

		if (filesChanged.length > MAX_FILES_LISTED_IN_BODY) {
			const remainingFilesCount: number = filesChanged.length - MAX_FILES_LISTED_IN_BODY;
			body += `\n- and ${remainingFilesCount} more files`;
		}

		return `${body}.`;
	}

	private resolveScope(filesChanged: Array<string>, scopeMaxLength: number): string {
		const firstFilePath: string = filesChanged[0] ?? "";
		const pathParts: Array<string> = firstFilePath.split("/");
		const preferredScopeToken: string = pathParts.length > 1 ? (pathParts[0] ?? DEFAULT_SCOPE) : ((pathParts[0] ?? DEFAULT_SCOPE).split(".")[0] ?? DEFAULT_SCOPE);
		const normalizedToken: string = this.normalizeToken(preferredScopeToken).toLowerCase();
		const trimmedToken: string = this.trimDashes(normalizedToken);
		const boundedScope: string = trimmedToken.length > scopeMaxLength ? trimmedToken.slice(0, scopeMaxLength) : trimmedToken;

		if (boundedScope.length === 0) {
			return DEFAULT_SCOPE;
		}

		return boundedScope;
	}

	private resolveSubject(filesChanged: Array<string>, hasDeletedFile: boolean, hasDocument: boolean, hasNewFile: boolean, hasTest: boolean, scope: string, subjectMaxLength: number, subjectMinLength: number, type: string): string {
		let subject: string = DEFAULT_SUBJECT;

		if (hasNewFile) {
			const lastFileIndex: number = filesChanged.length - 1;
			const lastFilePath: string = lastFileIndex >= 0 ? (filesChanged[lastFileIndex] ?? "") : "";
			const fileName: string = this.extractFileName(lastFilePath);
			subject = filesChanged.length > 1 ? `add ${filesChanged.length} new files` : `add ${fileName}`;
		} else if (hasDeletedFile) {
			subject = "remove obsolete files";
		} else if (hasDocument) {
			subject = "update documentation";
		} else if (hasTest) {
			subject = "update tests";
		}

		subject = this.trimTrailingDots(subject.toLowerCase());

		if (subject.length < subjectMinLength) {
			subject = `${subject} with changes`;
		}

		if (subject.length > subjectMaxLength) {
			subject = subject.slice(0, subjectMaxLength);
		}

		const calculatedHeaderLength: number = type.length + scope.length + subject.length + HEADER_FORMAT_OVERHEAD;

		if (calculatedHeaderLength > HEADER_MAX_LENGTH) {
			const availableSubjectLength: number = HEADER_MAX_LENGTH - type.length - scope.length - HEADER_FORMAT_OVERHEAD;
			const boundedLength: number = Math.max(availableSubjectLength, subjectMinLength);
			subject = subject.slice(0, boundedLength);
		}

		if (type.length + scope.length + subject.length + HEADER_FORMAT_OVERHEAD < MIN_HEADER_LENGTH) {
			subject = `${subject} changes`;
		}

		return subject;
	}

	private resolveType(context: ILlmPromptContext, hasNewFile: boolean, hasDocument: boolean, hasSource: boolean, hasTest: boolean): string {
		let resolvedType: string = DEFAULT_TYPE;

		if (hasNewFile && hasSource) {
			resolvedType = "feat";
		} else if (hasDocument) {
			resolvedType = "docs";
		} else if (hasTest) {
			resolvedType = "test";
		} else if (hasSource) {
			resolvedType = "fix";
		}

		const isAllowedType: boolean = context.typeEnum?.includes(resolvedType) ?? true;

		if (!isAllowedType) {
			return context.typeEnum?.[0] ?? "feat";
		}

		return resolvedType;
	}

	private trimDashes(value: string): string {
		let startIndex: number = 0;
		let endIndex: number = value.length;

		while (startIndex < endIndex && value[startIndex] === "-") {
			startIndex += 1;
		}

		while (endIndex > startIndex && value[endIndex - 1] === "-") {
			endIndex -= 1;
		}

		return value.slice(startIndex, endIndex);
	}

	private trimTrailingDots(value: string): string {
		let endIndex: number = value.length;

		while (endIndex > 0 && value[endIndex - 1] === ".") {
			endIndex -= 1;
		}

		return value.slice(0, endIndex);
	}
}
