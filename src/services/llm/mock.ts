/* eslint-disable @elsikora/jsdoc/require-param-type */
/* eslint-disable @elsikora/jsdoc/require-param-description */
/* eslint-disable @elsikora/jsdoc/require-returns */
/**
 * Mock LLM provider for testing without real API calls
 * Set MOCK_LLM=true environment variable to use this mock
 */

import type { CommitConfig, LLMPromptContext } from "./types.js";

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync: ReturnType<typeof promisify> = promisify(exec);

/**
 * Generate a mock commit message based on git diff analysis
 * @param context
 */
export async function generateCommitWithMock(context: LLMPromptContext): Promise<CommitConfig> {
	console.log("🎭 Using MOCK LLM provider (no real API calls)");

	// Try to get git diff for smart mock generation
	let diffContent: string = "";
	let filesChanged: Array<string> = [];

	try {
		const { stdout: diff }: any = await execAsync("git diff --cached");
		diffContent = diff;

		const { stdout: files }: any = await execAsync("git diff --name-only --cached");
		filesChanged = files
			.split("\n")
			.filter(Boolean)
			.map((file: string) => file.trim());
	} catch {
		// Ignore git errors in mock
	}

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
		type = context.typeEnum[0] || "feat";
	}

	// Determine scope from files
	let scope: string = "";

	if (filesChanged.length > 0) {
		const firstFile: string = filesChanged[0];
		const parts: Array<string> = firstFile.split("/");

		if (parts.length > 1) {
			// Remove leading dots and special characters from scope
			scope = parts[0].replace(/^\.+/, "").replaceAll(/[^\w-]/g, "-");

			// If scope is empty after cleaning, use the next part or default
			if (!scope && parts.length > 1) {
				scope = parts[1].replaceAll(/[^\w-]/g, "-");
			}

			// If still empty, use "core" as default
			if (!scope) {
				scope = "core";
			}
		} else {
			// Single file without directory, extract scope from filename
			const filename: string = parts[0].split(".")[0];
			scope = filename.replaceAll(/[^\w-]/g, "-").toLowerCase();
		}

		// Apply scope case rules
		if (context.scopeCase?.includes("lower-case")) {
			scope = scope.toLowerCase();
		}

		// Apply scope max length
		if (context.scopeMaxLength && scope.length > context.scopeMaxLength) {
			scope = scope.slice(0, context.scopeMaxLength);
		}

		// Remove trailing dashes
		// eslint-disable-next-line @elsikora/sonar/slow-regex
		scope = scope.replace(/-+$/, "");
	}

	// Generate subject
	let subject: string = "";

	if (hasNewFile) {
		subject = filesChanged.length > 1 ? `add ${filesChanged.length} new files` : `add ${filesChanged[0].split("/").pop()}`;
	} else if (hasDeletedFile) {
		subject = "remove obsolete files";
	} else if (hasDocument) {
		subject = "update documentation";
	} else if (hasTest) {
		subject = "update tests";
	} else {
		subject = "update implementation";
	}

	// Apply subject case rules
	if (context.subject.case?.includes("lower-case")) {
		subject = subject.toLowerCase();
	} else if (context.subject.case?.includes("sentence-case")) {
		subject = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
	}

	// Apply subject length rules
	if (context.subject.maxLength && subject.length > context.subject.maxLength) {
		subject = subject.slice(0, context.subject.maxLength - 3) + "...";
	}

	// Ensure minimum length
	if (context.subject.minLength && subject.length < context.subject.minLength) {
		subject = subject + " " + "changes".repeat(Math.ceil((context.subject.minLength - subject.length) / 8));

		// Trim to exact max length if we exceeded it
		if (context.subject.maxLength && subject.length > context.subject.maxLength) {
			subject = subject.slice(0, context.subject.maxLength);
		}
	}

	// Remove trailing full stop if not allowed
	if (context.subject.fullStop && !context.subject.fullStop.required) {
		subject = subject.replace(/\.$/, "");
	}

	// Generate body
	let body: string = "";

	if (filesChanged.length > 0) {
		body = `Modified files:\n${filesChanged.slice(0, 5).join("\n")}`;

		if (filesChanged.length > 5) {
			body += `\n... and ${filesChanged.length - 5} more files`;
		}
	}

	// Apply body length rules
	if (context.body?.maxLength && body.length > context.body.maxLength) {
		body = body.slice(0, context.body.maxLength - 3) + "...";
	}

	// Apply body full stop rule
	if (context.body?.fullStop?.required && body && !body.endsWith(context.body.fullStop.value)) {
		body += context.body.fullStop.value;
	}

	const commitConfig: CommitConfig = {
		body,
		isBreaking: false,
		scope,
		subject,
		type,
	};

	console.log("🎭 Mock generated commit config:", JSON.stringify(commitConfig, null, 2));

	return commitConfig;
}

/**
 * Check if mock mode is enabled
 */
export function isMockEnabled(): boolean {
	return process.env.MOCK_LLM === "true" || process.env.MOCK_LLM === "1";
}
