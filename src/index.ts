import { config as loadDotEnvironment } from "dotenv";

import { CommitizenAdapter } from "./presentation/commitizen.adapter.js";

// Load environment variables from .env file
try {
	loadDotEnvironment();
} catch {
	// Silently continue if .env file is not found or cannot be loaded
}

// Create a singleton instance of the adapter
const adapter = new CommitizenAdapter();

/**
 * Entry point for commitizen
 * @param inquirerIns - Instance passed by commitizen
 * @param commit - Callback to execute with complete commit message
 * @return {void}
 */
export async function prompter(
	inquirerIns: any,
	commit: (message: string) => void,
): Promise<void> {
	return adapter.prompter(inquirerIns, commit);
}

// Re-export types and utilities that might be needed by consumers
export * from "./domain/index.js";
export * from "./application/index.js";
