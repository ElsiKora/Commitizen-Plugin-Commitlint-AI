import type { Answers, DistinctQuestion } from "inquirer";

import { existsSync } from "node:fs";
import { join } from "node:path";

import load from "@commitlint/load";
import chalk from "chalk";
import { config as loadDotEnvironment } from "dotenv";

import process from "./Process.js";
export { getLLMConfig, setLLMConfig } from "./services/llm/index.js";
export type { CommitMode, LLMConfig, LLMConfigStorage, LLMModel, LLMProvider } from "./services/llm/types.js";

// Load environment variables from .env file
try {
	loadDotEnvironment();
} catch {
	// Silently continue if .env file is not found or cannot be loaded
}

type Commit = (message: string) => void;

import type { CommitMode } from "./services/llm/types.js";

import { getLLMConfig } from "./services/llm/index.js";

// Check what commit mode to use based on config, environment variable, and fallback file
const getCommitMode = (): CommitMode => {
	try {
		// First check environment variable (highest priority)
		if (process?.env) {
			if (process.env.COMMITIZEN_AI_MANUAL === "true") {
				return "manual";
			}

			if (process.env.COMMITIZEN_AI_MODE === "manual") {
				return "manual";
			}

			if (process.env.COMMITIZEN_AI_MODE === "auto") {
				return "auto";
			}
		}

		// Next check for manual flag file
		if (existsSync(join("./.elsikora", "manual"))) {
			return "manual";
		}

		// Finally check config file
		const config = getLLMConfig();

		if (
			config &&
			config.mode && // Validation is now done in config.ts to avoid duplicate messages
			(config.mode === "auto" || config.mode === "manual")
		) {
			return config.mode;
		}

		// Default to auto if not specified
		return "auto";
	} catch {
		// In case of any errors, default to auto
		return "auto";
	}
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
		const commitMode = getCommitMode();

		if (commitMode === "manual") {
			console.log(chalk.blue("Using manual commit mode..."));
			// Import manualProcess dynamically to avoid loading AI deps when not needed
			import("./ManualProcess.js").then(({ default: manualProcess }) => {
				manualProcess(rules, prompt, inquirerIns).then(commit);
			});
		} else {
			console.log(chalk.blue("Using AI-powered commit mode..."));
			process(rules, prompt, inquirerIns).then(commit);
		}
	});
}
