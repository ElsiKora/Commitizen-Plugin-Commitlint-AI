import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { Answers, DistinctQuestion } from "inquirer";

import type { CommitConfig, LLMConfigStorage, LLMPromptContext } from "./services/llm/index.js";

import chalk from "chalk";

import { extractLLMPromptContext } from "./services/commitlintConfig.js";
import { validateAndFixCommitMessage } from "./services/commitlintValidator.js";
// eslint-disable-next-line no-duplicate-imports
import { generateCommitMessage, getLLMConfig, selectLLMProvider } from "./services/llm/index.js";
import { setPromptConfig } from "./store/prompts.js";
import { setRules } from "./store/rules.js";

export default async function Process(
	rules: QualifiedRules,
	prompts: UserPromptConfig,
	inquirer: {
		prompt(questions: Array<DistinctQuestion>): Promise<Answers>;
	},
): Promise<string> {
	setRules(rules);
	setPromptConfig(prompts);

	// First, ask for LLM provider and API key
	await selectLLMProvider(inquirer);

	// Extract context from commitlint config
	const promptContext: LLMPromptContext = extractLLMPromptContext(rules, prompts);

	// Check if manual mode is enabled in config
	const config: ({ apiKey: string } & LLMConfigStorage) | null = getLLMConfig();

	// If manual mode is enabled, skip AI generation and go straight to manual entry
	if (config && config.mode === "manual") {
		console.log(chalk.blue("Using manual commit entry mode..."));
	} else {
		try {
			console.log(chalk.blue("Generating commit message with AI..."));

			// Generate commit message using LLM
			const commitConfig: CommitConfig = await generateCommitMessage(promptContext);

			// Validate the commit message with commitlint and fix if needed
			const validatedCommitMessage: null | string = await validateAndFixCommitMessage(commitConfig, promptContext);

			// If validation returned null, it means we should switch to manual mode
			if (validatedCommitMessage === null) {
				console.log(chalk.yellow("Switching to manual commit entry after failed validation attempts."));
			} else {
				console.log(chalk.green("AI generated commit message successfully!"));

				// Show the generated message to the user
				console.log("\n" + chalk.yellow("Generated commit message:"));
				console.log(chalk.white("-----------------------------------"));
				console.log(chalk.white(validatedCommitMessage));
				console.log(chalk.white("-----------------------------------\n"));

				// Ask for confirmation
				const { confirmCommit }: Answers = await inquirer.prompt([
					{
						// eslint-disable-next-line @elsikora-typescript/naming-convention
						default: true,
						message: "Do you want to proceed with this commit message?",
						name: "confirmCommit",
						type: "confirm",
					},
				]);

				if (confirmCommit) {
					return validatedCommitMessage;
				} else {
					// If user rejects the generated message, fall through to the manual entry option
					console.log(chalk.yellow("AI-generated message rejected. Switching to manual commit entry."));
				}
			}
		} catch (error) {
			// Only show error for AI mode errors, not when manual mode is intentionally used
			if (config?.mode !== "manual") {
				console.error(chalk.red("Error generating commit with AI:"), error);
				console.log(chalk.yellow("Falling back to manual commit entry..."));
			}
		}
	}

	// Fallback to regular prompts if LLM fails or in manual mode
	const commitQuestions: Array<
		| {
				// eslint-disable-next-line @elsikora-typescript/naming-convention
				default: boolean;
				message: string;
				name: string;
				type: string;
		  }
		| {
				choices: Array<{ name: string; value: string }>;
				message: string;
				name: string;
				type: string;
		  }
		| {
				message: string;
				name: string;
				type: string;
				validate: (input: string) => boolean | string;
		  }
		| { message: string; name: string; type: string; when: (answers: Answers) => any }
		| { message: string; name: string; type: string }
	> = [
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
						name: type + (emoji ? " " + emoji : "") + ": " + cleanDesc,
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
			// eslint-disable-next-line @elsikora-sonar/function-return-type
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
			// eslint-disable-next-line @elsikora-typescript/naming-convention
			default: false,
			message: "Are there any breaking changes?",
			name: "isBreaking",
			type: "confirm",
		},
		{
			message: "Describe the breaking changes:",
			name: "breakingBody",
			type: "input",
			// eslint-disable-next-line @elsikora-typescript/no-unsafe-return
			when: (answers: Answers) => answers.isBreaking,
		},
	];

	// First get all commit details
	// @ts-ignore
	const answers: Answers = await inquirer.prompt(commitQuestions);

	// Construct message from manual answers
	// eslint-disable-next-line @elsikora-typescript/no-unsafe-argument,@elsikora-typescript/restrict-plus-operands
	const header: string = "".concat(answers.type, answers.scope ? "(" + answers.scope + ")" : "", ": ", answers.subject);

	let body: string = "";

	if (answers.isBreaking) {
		// eslint-disable-next-line @elsikora-typescript/restrict-template-expressions
		body = `BREAKING CHANGE: ${answers.breakingBody || "This commit introduces breaking changes."}\n\n`;
	}

	if (answers.body) {
		// eslint-disable-next-line @elsikora-typescript/restrict-plus-operands
		body += answers.body;
	}

	const commitMessage: string = [header, body].filter(Boolean).join("\n\n");

	// Display the commit message to the user
	console.log("\n" + chalk.yellow("Your commit message:"));
	console.log(chalk.white("-----------------------------------"));
	console.log(chalk.white(commitMessage));
	console.log(chalk.white("-----------------------------------\n"));

	// Now ask for confirmation
	const { confirmCommit }: Answers = await inquirer.prompt([
		{
			// eslint-disable-next-line @elsikora-typescript/naming-convention
			default: true,
			message: "Are you sure you want to proceed with the commit above?",
			name: "confirmCommit",
			type: "confirm",
		},
	]);

	// Check confirmation
	if (!confirmCommit) {
		console.log(chalk.yellow("Commit canceled."));

		throw new Error("User canceled the commit");
	}

	return commitMessage;
}
