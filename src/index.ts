import type { Answers, DistinctQuestion } from "inquirer";

import { existsSync } from "node:fs";
// eslint-disable-next-line @elsikora-unicorn/import-style
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

// eslint-disable-next-line @elsikora-typescript/naming-convention
type Commit = (message: string) => void;

import type { CommitMode, LLMConfigStorage } from "./services/llm/types.js";

import { getLLMConfig } from "./services/llm/index.js";

// Check what commit mode to use based on config, environment variable, and fallback file
const getCommitMode = (): CommitMode => {
	try {
		// First check environment variable (highest priority)

		// Next check for manual flag file
		if (existsSync(join("./.elsikora", "manual"))) {
			return "manual";
		}

		// Finally check config file
		const config: ({ apiKey: string } & LLMConfigStorage) | null = getLLMConfig();

		if (
			config?.mode && // Validation is now done in config.ts to avoid duplicate messages
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
export async function prompter(
	inquirerIns: {
		prompt(questions: Array<DistinctQuestion>): Promise<Answers>;
	},
	commit: Commit,
): Promise<void> {
	// eslint-disable-next-line @elsikora-typescript/typedef
	await load().then(async ({ prompt = {}, rules }) => {
		// Use process (AI mode) unless manual mode is enabled
		const commitMode: "auto" | "manual" = getCommitMode();

		if (commitMode === "manual") {
			console.log(chalk.blue("Using manual commit mode..."));
			// Import manualProcess dynamically to avoid loading AI deps when not needed
			// eslint-disable-next-line @elsikora-typescript/typedef
			await import("./ManualProcess.js").then(async ({ default: manualProcess }) => {
				await manualProcess(rules, prompt, inquirerIns).then(commit);
			});
		} else {
			console.log(chalk.blue("Using AI-powered commit mode..."));
			await process(rules, prompt, inquirerIns).then(commit);
		}
	});
}
