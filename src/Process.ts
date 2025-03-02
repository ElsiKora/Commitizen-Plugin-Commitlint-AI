import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { Answers, DistinctQuestion } from "inquirer";

import chalk from "chalk";

import { combineCommitMessage as combineBody } from "./SectionBody.js";
import { combineCommitMessage as combineFooter } from "./SectionFooter.js";
import { combineCommitMessage as combineHeader } from "./SectionHeader.js";
import { extractLLMPromptContext } from "./services/commitlintConfig.js";
import { generateCommitMessage, getLLMConfig, selectLLMProvider } from "./services/llm/index.js";
import { setPromptConfig } from "./store/prompts.js";
import { setRules } from "./store/rules.js";

export default async function (
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
	const promptContext = extractLLMPromptContext(rules, prompts);

	// Check if manual mode is enabled in config
	const config = getLLMConfig();

	// If manual mode is enabled, skip AI generation and go straight to manual entry
	if (config && config.mode === "manual") {
		console.log(chalk.blue("Using manual commit entry mode..."));
	} else {
		try {
			console.log(chalk.blue("Generating commit message with AI..."));

			// Generate commit message using LLM
			const commitConfig = await generateCommitMessage(promptContext);

			// Construct the commit message based on AI response
			let commitMessage = "";

			// Construct header (type, scope, subject)
			const type = commitConfig.type;
			const scope = commitConfig.scope ? `(${commitConfig.scope})` : "";
			const subject = commitConfig.subject;
			const header = `${type}${scope}: ${subject}`;

			// Body with optional breaking change
			let body = "";

			if (commitConfig.isBreaking) {
				body = `BREAKING CHANGE: ${commitConfig.breakingBody || "This commit introduces breaking changes."}\n\n`;
			}

			if (commitConfig.body) {
				body += commitConfig.body;
			}

			// Footer with issue references
			let footer = "";

			if (commitConfig.issues && commitConfig.issues.length > 0) {
				footer = `Issues: ${commitConfig.issues.join(", ")}`;
			}

			if (commitConfig.references && commitConfig.references.length > 0) {
				if (footer) footer += "\n";
				footer += `References: ${commitConfig.references.join(", ")}`;
			}

			// Combine all parts
			commitMessage = [header, body, footer].filter(Boolean).join("\n\n");
			console.log(chalk.green("AI generated commit message successfully!"));

			// Show the generated message to the user
			console.log("\n" + chalk.yellow("Generated commit message:"));
			console.log(chalk.white("-----------------------------------"));
			console.log(chalk.white(commitMessage));
			console.log(chalk.white("-----------------------------------\n"));

			// Ask for confirmation
			const { confirmCommit } = await inquirer.prompt([
				{
					default: true,
					message: "Do you want to proceed with this commit message?",
					name: "confirmCommit",
					type: "confirm",
				},
			]);

			if (confirmCommit) {
				return commitMessage;
			} else {
				// If user rejects the generated message, fall through to the manual entry option
				console.log(chalk.yellow("AI-generated message rejected. Switching to manual commit entry."));
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
	const commitQuestions = [
		{
			choices:
				promptContext.typeEnum?.map((type) => {
					const desc = promptContext.typeDescriptions?.[type]?.description || "";
					const emoji = promptContext.typeDescriptions?.[type]?.emoji || "";

					// Remove emoji from description if it already appears at the beginning
					let cleanDesc = desc;

					if (emoji && desc.startsWith(emoji)) {
						cleanDesc = desc.slice(emoji.length).trim();
					}

					return {
						name: `${type}${emoji ? ` ${emoji}` : ""}: ${cleanDesc}`,
						value: type,
					};
				}) || [],
			message: promptContext.typeDescription || "Select the type of change that you're committing:",
			name: "type",
			type: "list",
		},
		{
			message: promptContext.scopeDescription || 'What is the scope of this change:\n  - Use component, directory or area of codebase\n  - Use comma-separated list for multiple areas\n  - Type "global" for project-wide changes\n  - Press enter to skip if scope is not applicable',
			name: "scope",
			type: "input",
		},
		{
			message: promptContext.subject.description || "Write a short, imperative mood description of the change:",
			name: "subject",
			type: "input",
			validate: (input: string) => {
				if (!input) return "Subject is required";

				return true;
			},
		},
		{
			message: promptContext.body?.description || "Provide a longer description of the change: (press enter to skip)",
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
			when: (answers: Answers) => answers.isBreaking,
		},
	];

	// First get all commit details
	const answers = await inquirer.prompt(commitQuestions);

	// Construct message from manual answers
	const header = `${answers.type}${answers.scope ? `(${answers.scope})` : ""}: ${answers.subject}`;

	let body = "";

	if (answers.isBreaking) {
		body = `BREAKING CHANGE: ${answers.breakingBody || "This commit introduces breaking changes."}\n\n`;
	}

	if (answers.body) {
		body += answers.body;
	}

	const commitMessage = [header, body].filter(Boolean).join("\n\n");

	// Display the commit message to the user
	console.log("\n" + chalk.yellow("Your commit message:"));
	console.log(chalk.white("-----------------------------------"));
	console.log(chalk.white(commitMessage));
	console.log(chalk.white("-----------------------------------\n"));

	// Now ask for confirmation
	const { confirmCommit } = await inquirer.prompt([
		{
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
