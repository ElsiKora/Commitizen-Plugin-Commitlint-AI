import type { Answers, DistinctQuestion } from "inquirer";

import load from "@commitlint/load";

import process from "./Process.js";
export { setLLMConfig, getLLMConfig } from "./services/llm/index.js";
export type { LLMConfig, LLMProvider, LLMModel } from "./services/llm/types.js";

type Commit = (message: string) => void;

/**
 * Entry point for commitizen
 * @param  inquirerIns instance passed by commitizen, unused
 * @param commit callback to execute with complete commit message
 * @return {void}
 */
export function prompter(
	inquirerIns: {
		prompt(questions: Array<DistinctQuestion>): Promise<Answers>;
	},
	commit: Commit,
): void {
	load().then(({ prompt = {}, rules }) => {
		process(rules, prompt, inquirerIns).then(commit);
	});
}
