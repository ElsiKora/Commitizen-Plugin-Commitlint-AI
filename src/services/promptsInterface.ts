import chalk from "chalk";
import prompts from "prompts";

export type PromptsAnswers = Record<string, unknown>;

export interface PromptsInterface {
	prompt(questions: Array<PromptsQuestion> | PromptsQuestion): Promise<PromptsAnswers>;
}

export interface PromptsQuestion {
	choices?: Array<{ name?: string; title: string; value: string }>;
	default?: boolean | number | string;
	max?: number;
	message: string;
	min?: number;
	name: string;
	type: "confirm" | "input" | "list" | "multiselect" | "password" | "select" | "text" | "toggle";
	validate?: (input: string) => boolean | string;
	when?: (answers: Record<string, unknown>) => boolean;
}

export class PromptsCliInterface implements PromptsInterface {
	async prompt(questions: Array<PromptsQuestion> | PromptsQuestion): Promise<PromptsAnswers> {
		const questionsArray = Array.isArray(questions) ? questions : [questions];
		const answers: PromptsAnswers = {};

		for (const question of questionsArray) {
			// Check if question should be shown based on when condition
			if (question.when && !question.when(answers)) {
				continue;
			}

			try {
				let promptConfig: prompts.PromptObject;

				switch (question.type) {
					case "confirm": {
						promptConfig = {
							initial: question.default as boolean,
							message: question.message,
							name: question.name,
							type: "confirm",
						};

						break;
					}

					case "input":

					// fallthrough
					case "text": {
						promptConfig = {
							initial: question.default as string,
							message: question.message,
							name: question.name,
							type: "text",
							validate: question.validate,
						};

						break;
					}

					case "list":

					// fallthrough
					case "select": {
						if (!question.choices) {
							throw new Error(`Choices required for ${question.type} question`);
						}

						// Find the initial index based on the default value
						let initialIndex = 0;

						if (question.default !== undefined) {
							const foundIndex = question.choices.findIndex((choice) => choice.value === question.default);

							if (foundIndex !== -1) {
								initialIndex = foundIndex;
							}
						}

						promptConfig = {
							choices: question.choices.map((choice) => ({
								title: choice.title ?? choice.name ?? choice.value,
								value: choice.value,
							})),
							initial: initialIndex,
							message: question.message,
							name: question.name,
							type: "select",
						};

						break;
					}

					case "multiselect": {
						if (!question.choices) {
							throw new Error("Choices required for multiselect question");
						}

						// For multiselect, default should be an array of values to pre-select
						const defaultValues: Array<string> = Array.isArray(question.default) ? (question.default as Array<string>) : [];

						promptConfig = {
							choices: question.choices.map((choice) => ({
								selected: defaultValues.includes(choice.value),
								title: choice.title ?? choice.name ?? choice.value,
								value: choice.value,
							})),
							instructions: false,
							max: question.max,
							message: question.message,
							min: question.min,
							name: question.name,
							type: "multiselect",
						};

						break;
					}

					case "password": {
						promptConfig = {
							message: question.message,
							name: question.name,
							type: "password",
							validate: question.validate,
						};

						break;
					}

					case "toggle": {
						promptConfig = {
							active: "Yes",
							inactive: "No",
							initial: question.default as boolean,
							message: question.message,
							name: question.name,
							type: "toggle",
						};

						break;
					}

					default: {
						throw new Error(`Unsupported question type: ${question.type as string}`);
					}
				}

				const response = await prompts(promptConfig);

				// Check if the user cancelled (Ctrl+C or Esc) - prompts returns empty object on cancel
				if (!Object.prototype.hasOwnProperty.call(response, question.name)) {
					// User cancelled the prompt
					throw new Error("PROMPT_CANCELLED");
				}

				answers[question.name] = response[question.name];
			} catch (error) {
				// Re-throw the error to let the caller handle it
				if (error instanceof Error && error.message === "PROMPT_CANCELLED") {
					console.error(chalk.red("Operation cancelled by user"));
					// eslint-disable-next-line @elsikora/unicorn/no-process-exit
					process.exit(0);
				}

				throw error;
			}
		}

		return answers;
	}
}

// Create a singleton instance
export const promptsInterface = new PromptsCliInterface();
