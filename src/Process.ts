import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";

import type { CommitConfig, LLMConfigStorage, LLMPromptContext } from "./services/llm/index.js";
import type { PromptsAnswers, PromptsQuestion } from "./services/promptsInterface.js";

import chalk from "chalk";

import { commitConfirmation } from "./services/commitConfirmation.js";
import { extractLLMPromptContext } from "./services/commitlintConfig.js";
import { validateAndFixCommitMessage } from "./services/commitlintValidator.js";
import { generateCommitMessage, getLLMConfig, selectLLMProvider } from "./services/llm/index.js";
import { promptsInterface } from "./services/promptsInterface.js";
import { setPromptConfig } from "./store/prompts.js";
import { setRules } from "./store/rules.js";

export default async function Process(
	rules: QualifiedRules,
	prompts: UserPromptConfig,
	// Legacy inquirer parameter kept for backward compatibility
	_inquirer?: unknown,
): Promise<string> {
	setRules(rules);
	setPromptConfig(prompts);

	// First, ask for LLM provider and API key
	try {
		await selectLLMProvider(promptsInterface);
	} catch (error) {
		if (error instanceof Error && error.message === "PROMPT_CANCELLED") {
			throw error; // Re-throw to let the parent handle it
		}
		console.error(chalk.red("Error during LLM provider selection:"), error);

		throw error;
	}

	// Extract context from commitlint config
	const promptContext: LLMPromptContext = extractLLMPromptContext(rules, prompts);

	// Check if manual mode is enabled in config
	const config: ({ apiKey: string } & LLMConfigStorage) | null = getLLMConfig();

	// If manual mode is enabled, skip AI generation and go straight to manual entry
	if (config && config.mode === "manual") {
		console.warn(chalk.blue("Using manual commit entry mode..."));
	} else {
		try {
			console.warn(chalk.blue("Generating commit message with AI..."));

			// Generate commit message using LLM
			const commitConfig: CommitConfig = await generateCommitMessage(promptContext);

			// Validate the commit message with commitlint and fix if needed
			const validatedCommitMessage: null | string = await validateAndFixCommitMessage(commitConfig, promptContext);

			// If validation returned null, it means we should switch to manual mode
			if (validatedCommitMessage === null) {
				console.warn(chalk.yellow("Switching to manual commit entry after failed validation attempts."));
			} else {
				console.warn(chalk.green("AI generated commit message successfully!"));

				// Show the generated message to the user
				console.warn("\n" + chalk.yellow("Generated commit message:"));
				console.warn(chalk.white("-----------------------------------"));
				console.warn(chalk.white(validatedCommitMessage));
				console.warn(chalk.white("-----------------------------------\n"));

				// Ask for confirmation
				const response = (await promptsInterface.prompt([
					{
						default: true,
						message: "Do you want to proceed with this commit message?",
						name: "confirmCommit",
						type: "confirm",
					},
				])) as { confirmCommit: boolean };
				const { confirmCommit } = response;

				if (confirmCommit) {
					return validatedCommitMessage;
				} else {
					console.warn(chalk.yellow("AI generated message rejected. Switching to commit edit mode."));
					const confirmedCommitMessage: string = await commitConfirmation(promptContext, { ...commitConfig, scope: extractCommitScope(validatedCommitMessage) });

					return confirmedCommitMessage;
					// If user rejects the generated message, fall through to the manual entry option
				}
			}
		} catch (error) {
			// Only show error for AI mode errors, not when manual mode is intentionally used
			if (config?.mode !== "manual") {
				console.error(chalk.red("Error generating commit with AI:"), error);
				console.warn(chalk.yellow("Falling back to manual commit entry..."));
			}
		}
	}

	// Fallback to regular prompts if LLM fails or in manual mode
	const commitQuestions: Array<PromptsQuestion> = [
		{
			choices:
				promptContext.typeEnum?.map((type: string) => {
					const desc: string = promptContext.typeDescriptions?.[type]?.description ?? "";
					const emoji: string = promptContext.typeDescriptions?.[type]?.emoji ?? "";

					// Remove emoji from description if it already appears at the beginning
					let cleanDesc: string = desc;

					if (emoji && desc.startsWith(emoji)) {
						cleanDesc = desc.slice(emoji.length).trim();
					}

					return {
						title: type + (emoji ? " " + emoji : "") + ": " + cleanDesc,
						value: type,
					};
				}) ?? [],
			message: promptContext.typeDescription ?? "Select the type of change that you're committing:",
			name: "type",
			type: "list",
		},
		{
			message: promptContext.scopeDescription ?? 'What is the scope of this change:\n  - Use component, directory or area of codebase\n  - Use comma-separated list for multiple areas\n  - Type "global" for project-wide changes\n  - Press enter to skip if scope is not applicable',
			name: "scope",
			type: "input",
		},
		{
			message: promptContext.subject.description ?? "Write a short, imperative mood description of the change:",
			name: "subject",
			type: "input",
			// eslint-disable-next-line @elsikora/sonar/function-return-type
			validate: (input: string): boolean | string => {
				if (!input) return "Subject is required";

				return true;
			},
		},
		{
			message: promptContext.body?.description ?? "Provide a longer description of the change: (press enter to skip)",
			name: "body",
			type: "input",
		},
		{
			default: false,
			message: "Are there any breaking changes?",
			name: "isBreaking",
			type: "confirm",
		},
		{
			message: "Describe the breaking changes:",
			name: "breakingBody",
			type: "input",

			when: (answers: PromptsAnswers) => answers.isBreaking as boolean,
		},
	];

	// First get all commit details
	const answers: PromptsAnswers = await promptsInterface.prompt(commitQuestions);

	// Construct message from manual answers

	const header: string = "".concat(answers.type as string, answers.scope ? "(" + (answers.scope as string) + ")" : "", ": ", answers.subject as string);

	let body: string = "";

	if (answers.isBreaking) {
		body = `BREAKING CHANGE: ${(answers.breakingBody as string) ?? "This commit introduces breaking changes."}\n\n`;
	}

	if (answers.body) {
		body += answers.body as string;
	}

	const commitMessage: string = [header, body].filter(Boolean).join("\n\n");

	// Display the commit message to the user
	console.warn("\n" + chalk.yellow("Your commit message:"));
	console.warn(chalk.white("-----------------------------------"));
	console.warn(chalk.white(commitMessage));
	console.warn(chalk.white("-----------------------------------\n"));

	// Now ask for confirmation
	const confirmResponse = await promptsInterface.prompt({
		default: true,
		message: "Are you sure you want to proceed with the commit above?",
		name: "confirmCommit",
		type: "confirm",
	});
	const confirmCommit = confirmResponse.confirmCommit as boolean;

	// Check confirmation
	if (!confirmCommit) {
		console.warn(chalk.yellow("Commit canceled."));

		throw new Error("User canceled the commit");
	}

	return commitMessage;
}

function extractCommitScope(commitMessage: string): string {
	const scopeRegex: RegExp = /^[^(\n]+(\([^)\n]+\))?:/;
	const match: null | RegExpExecArray = scopeRegex.exec(commitMessage);

	if (match?.[1]) {
		return match[1].slice(1, -1);
	}

	return "";
}
