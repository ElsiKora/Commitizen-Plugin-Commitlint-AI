import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";

import type { LLMPromptContext } from "./services/llm/index.js";
import type { PromptsAnswers, PromptsQuestion } from "./services/promptsInterface.js";

import chalk from "chalk";

import { extractLLMPromptContext } from "./services/commitlintConfig.js";
import { promptsInterface } from "./services/promptsInterface.js";
import { setPromptConfig } from "./store/prompts.js";
import { setRules } from "./store/rules.js";

export default async function ManualProcess(
	rules: QualifiedRules,
	prompts: UserPromptConfig,
	// Legacy inquirer parameter kept for backward compatibility
	_inquirer?: unknown,
): Promise<string> {
	setRules(rules);
	setPromptConfig(prompts);

	// Extract context from commitlint config
	const promptContext: LLMPromptContext = extractLLMPromptContext(rules, prompts);

	// Message removed as it's now handled in the index.ts file

	// Manual entry prompts
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
						// eslint-disable-next-line @elsikora/sonar/no-nested-template-literals
						title: `${type}${emoji ? ` ${emoji}` : ""}: ${cleanDesc}`,
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

			validate: (input: string) => {
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
	// eslint-disable-next-line @elsikora/sonar/no-nested-template-literals
	const header: string = `${answers.type as string}${answers.scope ? `(${answers.scope as string})` : ""}: ${answers.subject as string}`;

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
