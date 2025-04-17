/* eslint-disable @elsikora/typescript/naming-convention */
/* eslint-disable @elsikora/typescript/typedef */
/* eslint-disable @elsikora/typescript/no-unsafe-assignment */

import type { CommitConfig, LLMPromptContext } from "./llm";

import chalk from "chalk";
import inquirer from "inquirer";

import { constructCommitMessage } from "./commitlintValidator";

const switcher = async (typeOfChange: string, promptContext: LLMPromptContext, commitConfig: CommitConfig): Promise<CommitConfig> => {
	const newCommitConfig: CommitConfig = { ...commitConfig };

	if (typeOfChange === "changeType") {
		const { type } = await inquirer.prompt([
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
		]);

		newCommitConfig.type = type;
	}

	if (typeOfChange === "changeScope") {
		const { scope } = await inquirer.prompt([
			{
				message: promptContext.scopeDescription ?? 'What is the scope of this change:\n  - Use component, directory or area of codebase\n  - Use comma-separated list for multiple areas\n  - Type "global" for project-wide changes\n',
				name: "scope",
				type: "input",
			},
		]);

		newCommitConfig.scope = scope;
	}

	if (typeOfChange === "changeMessage") {
		const { message } = await inquirer.prompt([
			{
				message: promptContext.subject.description ?? "Write a short, imperative mood description of the change:",
				name: "message",
				type: "input",
			},
		]);

		newCommitConfig.subject = message;
	}

	if (typeOfChange === "changeDescription") {
		const { descr } = await inquirer.prompt([
			{
				message: promptContext.body?.description ?? "Provide a longer description of the change",
				name: "descr",
				type: "input",
			},
		]);

		newCommitConfig.body = descr;
	}

	if (typeOfChange === "markBreaking") {
		if (newCommitConfig.isBreaking) {
			newCommitConfig.isBreaking = false;
			newCommitConfig.breakingBody = "";
		} else {
			const { brakingMsg } = await inquirer.prompt([
				{
					message: "Provide a longer description of the breaking change. (Press enter to skip)",
					name: "brakingMsg",
					type: "input",
				},
			]);

			newCommitConfig.isBreaking = true;
			newCommitConfig.breakingBody = brakingMsg;
		}
	}

	return newCommitConfig;
};

export const commitConfirmation = async (promptContext: LLMPromptContext, commitConfig: CommitConfig): Promise<string> => {
	const { editCommit }: { editCommit: string } = await inquirer.prompt([
		{
			choices: [
				{ name: "Edit commit type", value: "changeType" },
				{ name: "Edit commit scope", value: "changeScope" },
				{ name: "Edit commit message", value: "changeMessage" },
				{ name: "Edit commit description", value: "changeDescription" },
				{ name: commitConfig.isBreaking ? "Unmark as containing braking changes" : "Mark as containing braking changes", value: "markBreaking" },
			],
			message: "What do you want to do with the commit?",
			name: "editCommit",
			type: "list",
		},
	]);

	const newCommitConfig = await switcher(editCommit, promptContext, commitConfig);
	const newMessage = constructCommitMessage(newCommitConfig);

	console.log(chalk.green("Commit edited successfully"));

	// Show the generated message to the user
	console.log("\n" + chalk.yellow("Edited commit message:"));
	console.log(chalk.white("-----------------------------------"));
	console.log(chalk.white(newMessage));
	console.log(chalk.white("-----------------------------------\n"));

	const { isConfirmCommit }: { isConfirmCommit: boolean } = await inquirer.prompt([
		{
			default: true,
			message: "Are you sure you want to proceed with the commit above?",
			name: "isConfirmCommit",
			type: "confirm",
		},
	]);

	if (isConfirmCommit) return newMessage;
	else return commitConfirmation(promptContext, newCommitConfig);
};
