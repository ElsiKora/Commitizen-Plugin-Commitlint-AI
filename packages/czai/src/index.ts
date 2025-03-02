import type { Answers, DistinctQuestion } from "inquirer";
import load from "@commitlint/load";
import process from "./Process.js";
import { existsSync } from 'fs';
import { join } from 'path';
import { config as loadDotEnv } from 'dotenv';
export { setLLMConfig, getLLMConfig } from "./services/llm/index.js";
export type { LLMConfig, LLMProvider, LLMModel, LLMConfigStorage } from "./services/llm/types.js";

// Load environment variables from .env file
try {
  loadDotEnv();
} catch (error) {
  // Silently continue if .env file is not found or cannot be loaded
}

type Commit = (message: string) => void;

// Check if manual mode is enabled via environment variable
const isManualMode = (): boolean => {
  try {
    return typeof process !== 'undefined' && 
           process && 
           process.env && 
           process.env.COMMITIZEN_AI_MANUAL === 'true';
  } catch (e) {
    return false;
  }
};

// Check if .elsikora/manual file exists in project directory
const hasManualModeFile = (): boolean => {
  return existsSync(join('./.elsikora', 'manual'));
};

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
		// Use process (AI mode) unless manual mode is enabled
		if (isManualMode() || hasManualModeFile()) {
			// Import manualProcess dynamically to avoid loading AI deps when not needed
			import('./ManualProcess.js').then(({ default: manualProcess }) => {
				manualProcess(rules, prompt, inquirerIns).then(commit);
			});
		} else {
			process(rules, prompt, inquirerIns).then(commit);
		}
	});
}