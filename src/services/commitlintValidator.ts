/* eslint-disable @elsikora/typescript/prefer-nullish-coalescing */

import type { CommitConfig, LLMPromptContext } from "./llm";

import { exec } from "node:child_process";
import { promisify } from "node:util";

import chalk from "chalk";

import { generateCommitMessage } from "./llm";

const execAsync: ReturnType<typeof promisify> = promisify(exec);

interface ValidationResult {
	errors?: string;
	isValid: boolean;
}

/**
 * Constructs a commit message from a CommitConfig object
 * @param commitConfig The commit configuration
 * @returns The formatted commit message
 */
export function constructCommitMessage(commitConfig: CommitConfig): string {
	const type: string = commitConfig.type;
	const scope: string = commitConfig.scope ? `(${commitConfig.scope})` : "";
	const subject: string = commitConfig.subject;
	const header: string = `${type}${scope}: ${subject}`;

	// Body with optional breaking change
	let body: string = "";

	if (commitConfig.isBreaking) {
		body = `BREAKING CHANGE: ${commitConfig.breakingBody || "This commit introduces breaking changes."}\n\n`;
	}

	if (commitConfig.body) {
		body += commitConfig.body;
	}

	// Footer with issue references
	let footer: string = "";

	if (commitConfig.issues && commitConfig.issues.length > 0) {
		footer = `Issues: ${commitConfig.issues.join(", ")}`;
	}

	if (commitConfig.references && commitConfig.references.length > 0) {
		if (footer) footer += "\n";
		footer += `References: ${commitConfig.references.join(", ")}`;
	}

	// Combine all parts
	return [header, body, footer].filter(Boolean).join("\n\n");
}

/**
 * Validates a commit message and retries with LLM if there are errors
 * @param commitConfig The original commit configuration
 * @param promptContext The prompt context used to generate the commit
 * @returns A promise that resolves to a valid commit message or null if manual entry is needed
 */
export async function validateAndFixCommitMessage(commitConfig: CommitConfig, promptContext: LLMPromptContext): Promise<null | string> {
	// Initial commit message
	const commitMessage: string = constructCommitMessage(commitConfig);

	// Validate with commitlint
	const validation: ValidationResult = await validateWithCommitlint(commitMessage);

	// If valid, return the message
	if (validation.isValid) {
		return commitMessage;
	}

	// If not valid and we have errors, try to fix with LLM
	if (!validation.isValid && validation.errors) {
		console.warn(chalk.yellow("Commit message failed validation. Attempting to fix..."));
		const MAX_RETRIES: number = 3;
		let currentConfig: CommitConfig = commitConfig;
		const allErrors: Array<string> = [];

		// Attempt to fix the commit message up to MAX_RETRIES times

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			// Add the current validation error to our history
			if (validation.errors) {
				allErrors.push(validation.errors);
			}

			try {
				// Generate a fixed commit message with accumulated errors
				currentConfig = await fixCommitMessageWithLLM(
					currentConfig,
					validation.errors ?? "",
					promptContext,
					allErrors.slice(0, -1), // Pass previous errors (all except current one)
				);

				// Construct and validate the new commit message
				const fixedCommitMessage: string = constructCommitMessage(currentConfig);
				const fixedValidation: ValidationResult = await validateWithCommitlint(fixedCommitMessage);

				// If valid, return the successful message
				if (fixedValidation.isValid) {
					console.warn(chalk.green(`Commit message fixed successfully on attempt ${attempt + 1}!`));

					return fixedCommitMessage;
				}

				// If we still have errors, continue with next attempt
				if (fixedValidation.errors) {
					console.warn(chalk.yellow(`Fix attempt ${attempt + 1} still has errors. ${MAX_RETRIES - attempt - 1} retries left.`));
					// Update the validation errors for the next iteration
					validation.errors = fixedValidation.errors;
				}
			} catch (error) {
				console.error(chalk.red(`Error while trying to fix commit message (attempt ${attempt + 1}):`, error));

				break; // Exit retry loop on error
			}
		}

		// If we exhausted all retries and still have issues
		console.error(chalk.red(`Unable to fix commit message automatically after ${MAX_RETRIES} attempts.`));
		console.warn(chalk.yellow("Switching to manual commit entry mode..."));

		return null; // Signal to switch to manual mode
	}

	// Default case, return original even if there were issues
	return commitMessage;
}

/**
 * Validates a commit message with commitlint
 * @param commitMessage The commit message to validate
 * @returns A promise that resolves to an object with the validation result
 */
export async function validateWithCommitlint(commitMessage: string): Promise<ValidationResult> {
	try {
		// Create temporary file with commit message
		const cmd: string = `echo "${commitMessage}" | npx commitlint`;
		// eslint-disable-next-line @elsikora/typescript/no-unsafe-call
		await execAsync(cmd);

		return { isValid: true };
	} catch (error) {
		// If commitlint exits with non-zero code, it means there are validation errors
		const typedError: { message?: string; stderr?: string; stdout?: string } = error as { message?: string; stderr?: string; stdout?: string };

		return {
			errors: typedError.stdout ?? typedError.stderr ?? typedError.message,
			isValid: false,
		};
	}
}

/**
 * Sends a commit message to the LLM for correction with provided errors
 * @param commitConfig The original commit configuration
 * @param errors The errors from commitlint
 * @param promptContext The prompt context to use for regeneration
 * @param previousErrors Optional accumulated errors from previous attempts
 * @returns A promise that resolves to a new commit configuration
 */
async function fixCommitMessageWithLLM(commitConfig: CommitConfig, errors: string, promptContext: LLMPromptContext, previousErrors: Array<string> = []): Promise<CommitConfig> {
	// Create a history of all errors to help the LLM understand what needs fixing
	const errorHistory: string = [...previousErrors, errors].map((error: string, index: number) => `Attempt ${index + 1} errors:\n${error}`).join("\n\n");

	// Create an enhanced context that includes the original commit and errors
	const enhancedContext: LLMPromptContext = {
		...promptContext,
		// Add a note about the previous attempt and errors
		diff: `${promptContext.diff ?? ""}\n\nCommit message failed validation with these errors:\n${errorHistory}\n\nOriginal commit structure:\n${JSON.stringify(commitConfig, null)}`,
	};

	console.warn(chalk.yellow(`Commit message had validation errors. Asking LLM to fix... (Attempt ${previousErrors.length + 1})`));

	// Generate a new commit message with the enhanced context
	return await generateCommitMessage(enhancedContext);
}
