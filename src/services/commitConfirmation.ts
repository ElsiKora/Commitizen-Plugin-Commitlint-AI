import type { CommitConfig, LLMPromptContext } from "./llm";

import chalk from "chalk";

import { constructCommitMessage } from "./commitlintValidator";
import { promptsInterface } from "./promptsInterface";

const switcher = async (typeOfChange: string, promptContext: LLMPromptContext, commitConfig: CommitConfig): Promise<CommitConfig> => {
	const newCommitConfig: CommitConfig = { ...commitConfig };

	if (typeOfChange === "changeType") {
		const response = await promptsInterface.prompt({
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
		});
		const { type } = response as { type: string };

		newCommitConfig.type = type;
	}

	if (typeOfChange === "changeScope") {
		const scopeResponse = await promptsInterface.prompt({
			message: promptContext.scopeDescription ?? 'What is the scope of this change:\n  - Use component, directory or area of codebase\n  - Use comma-separated list for multiple areas\n  - Type "global" for project-wide changes\n',
			name: "scope",
			type: "input",
		});
		const { scope } = scopeResponse as { scope: string };

		newCommitConfig.scope = scope;
	}

	if (typeOfChange === "changeMessage") {
		const messageResponse = await promptsInterface.prompt({
			message: promptContext.subject.description ?? "Write a short, imperative mood description of the change:",
			name: "message",
			type: "input",
		});
		const { message } = messageResponse as { message: string };

		newCommitConfig.subject = message;
	}

	if (typeOfChange === "changeDescription") {
		const descrResponse = await promptsInterface.prompt({
			message: promptContext.body?.description ?? "Provide a longer description of the change",
			name: "descr",
			type: "input",
		});
		const { descr } = descrResponse as { descr: string };

		newCommitConfig.body = descr;
	}

	if (typeOfChange === "markBreaking") {
		if (newCommitConfig.isBreaking) {
			newCommitConfig.isBreaking = false;
			newCommitConfig.breakingBody = "";
		} else {
			const brakingResponse = await promptsInterface.prompt({
				message: "Provide a longer description of the breaking change. (Press enter to skip)",
				name: "brakingMsg",
				type: "input",
			});
			const { brakingMsg } = brakingResponse as { brakingMsg: string };

			newCommitConfig.isBreaking = true;
			newCommitConfig.breakingBody = brakingMsg;
		}
	}

	return newCommitConfig;
};

export const commitConfirmation = async (promptContext: LLMPromptContext, commitConfig: CommitConfig): Promise<string> => {
	const editResponse = await promptsInterface.prompt({
		choices: [
			{ title: "Edit commit type", value: "changeType" },
			{ title: "Edit commit scope", value: "changeScope" },
			{ title: "Edit commit message", value: "changeMessage" },
			{ title: "Edit commit description", value: "changeDescription" },
			{ title: commitConfig.isBreaking ? "Unmark as containing braking changes" : "Mark as containing braking changes", value: "markBreaking" },
		],
		message: "What do you want to do with the commit?",
		name: "editCommit",
		type: "list",
	});
	const { editCommit } = editResponse as { editCommit: string };

	const newCommitConfig = await switcher(editCommit, promptContext, commitConfig);
	const newMessage = constructCommitMessage(newCommitConfig);

	console.warn(chalk.green("Commit edited successfully"));

	// Show the generated message to the user
	console.warn("\n" + chalk.yellow("Edited commit message:"));
	console.warn(chalk.white("-----------------------------------"));
	console.warn(chalk.white(newMessage));
	console.warn(chalk.white("-----------------------------------\n"));

	const confirmResponse = await promptsInterface.prompt({
		default: true,
		message: "Are you sure you want to proceed with the commit above?",
		name: "isConfirmCommit",
		type: "confirm",
	});
	const { isConfirmCommit } = confirmResponse as { isConfirmCommit: boolean };

	if (isConfirmCommit) return newMessage;
	else return commitConfirmation(promptContext, newCommitConfig);
};
