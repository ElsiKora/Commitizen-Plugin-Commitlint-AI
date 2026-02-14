/* eslint-disable @elsikora/typescript/typedef */
/* eslint-disable @elsikora/typescript/no-magic-numbers */
/* eslint-disable @elsikora/typescript/prefer-nullish-coalescing */
/* eslint-disable @elsikora/sonar/slow-regex */
/* eslint-disable @elsikora/node/no-unsupported-features/es-syntax */
/* eslint-disable @elsikora/typescript/no-explicit-any */
/* eslint-disable @elsikora/typescript/no-unsafe-assignment */

import type { ILlmPromptContext, ILlmService } from "../../application/interface/llm-service.interface.js";
import type { LLMConfiguration } from "../../domain/entity/llm-configuration.entity.js";

import { CommitMessage } from "../../domain/entity/commit-message.entity.js";
import { CommitBody } from "../../domain/value-object/commit-body.value-object.js";
import { CommitHeader } from "../../domain/value-object/commit-header.value-object.js";

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
		await new Promise((resolve) => setTimeout(resolve, 500));

		const filesChanged: Array<string> = context.files ? context.files.split("\n").filter(Boolean) : [];
		const diffContent: string = context.diff ?? "";

		// Analyze changes to determine type
		const hasNewFile: boolean = diffContent.includes("new file mode");
		const hasDeletedFile: boolean = diffContent.includes("deleted file mode");
		const hasTest: boolean = filesChanged.some((f: string) => f.includes("test") || f.includes("spec"));
		const hasDocument: boolean = filesChanged.some((f: string) => f.includes("README") || f.includes(".md") || f.includes("doc"));
		const hasSource: boolean = filesChanged.some((f: string) => f.includes("src/") || f.includes("lib/"));
		const hasConfig: boolean = filesChanged.some((f: string) => f.includes("config") || f.includes(".json") || f.includes(".yml"));

		// Determine type based on changes
		let type: string = "chore";

		if (hasNewFile && hasSource) {
			type = "feat";
		} else if (hasDocument) {
			type = "docs";
		} else if (hasTest) {
			type = "test";
		} else if (hasSource && !hasNewFile) {
			type = "fix";
		} else if (hasConfig) {
			// eslint-disable-next-line @elsikora/sonar/no-redundant-assignments
			type = "chore";
		}

		// Ensure type is in allowed enum
		if (context.typeEnum && !context.typeEnum.includes(type)) {
			type = context.typeEnum[0] ?? "feat";
		}

		// Determine scope from files - ALWAYS provide scope (scope-empty: never)
		let scope: string = "core"; // Default scope if nothing else works

		if (filesChanged.length > 0) {
			const firstFile: string = filesChanged[0] ?? "";
			const parts: Array<string> = firstFile.split("/");

			if (parts.length > 1) {
				// Take first directory as scope
				const rawScope = parts[0]?.replace(/^\.+/, "").replaceAll(/[^\w-]/g, "-");

				if (rawScope && rawScope.length > 0) {
					scope = rawScope;
				} else if (parts.length > 1) {
					// Try second part
					const secondScope = parts[1]?.replaceAll(/[^\w-]/g, "-");

					if (secondScope && secondScope.length > 0) {
						scope = secondScope;
					}
				}
			} else if (parts[0]) {
				// Single file without directory - use filename without extension
				const filename: string = parts[0].split(".")[0] ?? "core";
				const cleanFilename = filename.replaceAll(/[^\w-]/g, "-");

				if (cleanFilename && cleanFilename.length > 0) {
					scope = cleanFilename;
				}
			}

			// Apply scope transformations
			// Always lowercase (scope-case: lower-case)
			scope = scope.toLowerCase();

			// Apply scope max length (default 30)
			const scopeMaxLength = this.extractRuleValue(context.rules, "scope-max-length") || 30;

			if (scope.length > scopeMaxLength) {
				scope = scope.slice(0, scopeMaxLength);
			}

			// Remove trailing/leading dashes
			scope = scope.replaceAll(/^-+|-+$/g, "");

			// If scope is empty after cleaning, use default
			if (!scope || scope.length === 0) {
				scope = "core";
			}
		}

		// Generate subject - ALWAYS lowercase (subject-case: lower-case)
		let subject: string = "";

		if (hasNewFile) {
			const lastFile = filesChanged.at(-1);
			const fileName = lastFile ? lastFile.split("/").pop() : "files";
			subject = filesChanged.length > 1 ? `add ${filesChanged.length} new files` : `add ${fileName}`;
		} else if (hasDeletedFile) {
			subject = "remove obsolete files";
		} else if (hasDocument) {
			subject = "update documentation";
		} else if (hasTest) {
			subject = "update tests";
		} else {
			subject = "update implementation";
		}

		// ALWAYS apply lowercase (subject-case: lower-case)
		subject = subject.toLowerCase();

		// Apply subject length rules (subject-max-length: 80, subject-min-length: 3)
		const subjectMaxLength = context.subject.maxLength || 80;
		const subjectMinLength = context.subject.minLength || 3;

		// Ensure minimum length first
		if (subject.length < subjectMinLength) {
			subject = subject + " with changes";
		}

		// Then apply max length (header-max-length includes type + scope, so be conservative)
		if (subject.length > subjectMaxLength) {
			subject = subject.slice(0, subjectMaxLength);
		}

		// Remove any trailing periods (subject-full-stop: never)
		subject = subject.replace(/\.+$/, "");

		// Ensure the complete header doesn't exceed limits (header-max-length: 100)
		// Format: type(scope): subject
		const headerLength = type.length + scope.length + subject.length + 4; // 4 for "(", ")", ":", " "

		if (headerLength > 100) {
			// Reduce subject length to fit
			const availableForSubject = 100 - type.length - scope.length - 4;
			subject = subject.slice(0, Math.max(availableForSubject, subjectMinLength));
		}

		// Final check for header minimum length (header-min-length: 10)
		if (headerLength < 10) {
			subject = subject + " changes";
		}

		// Generate body (optional, but with strict formatting rules)
		// body-full-stop: always "."
		// body-max-line-length: 100
		// body-leading-blank: always (handled by CommitMessage.toString())
		let body: string | undefined;

		if (filesChanged.length > 0 && filesChanged.length <= 10) {
			// Only add body for reasonable number of files
			const filesList = filesChanged
				.slice(0, 5)
				.map((f) => `- ${f}`)
				.join("\n");
			body = `modified files:\n${filesList}`;

			if (filesChanged.length > 5) {
				body += `\n- and ${filesChanged.length - 5} more files`;
			}

			// Add trailing period (body-full-stop: always)
			if (!body.endsWith(".")) {
				body += ".";
			}
		}

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

	/**
	 * Extract a numeric value from commitlint rules
	 * @param {unknown} rules - The commitlint rules
	 * @param {string} ruleName - The name of the rule to extract
	 * @returns {number | undefined} The numeric value or undefined
	 */
	private extractRuleValue(rules: unknown, ruleName: string): number | undefined {
		if (!Array.isArray(rules)) {
			return undefined;
		}

		const rule = rules.find((r: any) => Array.isArray(r) && r[0] === ruleName);

		if (rule && Array.isArray(rule) && rule.length > 2 && typeof rule[2] === "number") {
			return rule[2];
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
}
