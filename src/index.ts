import { createAppContainer } from "./infrastructure/di/container.js";
import { CommitizenAdapter } from "./presentation/commitizen.adapter.js";

import "dotenv/config";

// Initialize the DI container
createAppContainer();

// Create adapter instance
const adapter: CommitizenAdapter = new CommitizenAdapter();

// Main adapter function - explicitly typed for module export
export function prompter(inquirerInstance: unknown, commit: (message: string) => void): void {
	void adapter.prompter(inquirerInstance, commit);
}

export * from "./application/index.js";
// Re-export types and utilities that might be needed by consumers
export * from "./domain/index.js";
