import type { LLMConfig, LLMConfigStorage } from "./types.js";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
// eslint-disable-next-line @elsikora/unicorn/import-style
import { join } from "node:path";

import chalk from "chalk";

// Store config in project directory
const CONFIG_DIR: string = "./.elsikora";
const CONFIG_FILE: string = join(CONFIG_DIR, "commitlint-ai.config.js");

// In-memory cache
let llmConfig: LLMConfig | null = null;

// Track if we've already shown mode error

let modeErrorShown: boolean = false;

// Check for API keys in environment variables
const getApiKeyFromEnvironment = (provider: string): null | string => {
	try {
		if (typeof process === "undefined" || !process?.env) {
			return null;
		}

		if (provider === "openai") {
			return process.env.OPENAI_API_KEY ?? null;
		} else if (provider === "anthropic") {
			return process.env.ANTHROPIC_API_KEY ?? null;
		}
	} catch (error) {
		console.warn("Error accessing environment variables:", error);
	}

	return null;
};

// Try to load config from file
const loadConfigFromFile = (): LLMConfigStorage | null => {
	try {
		if (existsSync(CONFIG_FILE)) {
			// Check if there's an old JSON file and migrate it
			const oldJsonFile: string = join(CONFIG_DIR, "commitlint-ai.json");

			if (existsSync(oldJsonFile)) {
				try {
					const oldConfigString: string = readFileSync(oldJsonFile, "utf8");
					const oldConfig: LLMConfigStorage = JSON.parse(oldConfigString) as LLMConfigStorage;

					// Save to the new JS format
					saveConfigToFile({
						...oldConfig,
						apiKey: "",
					});

					return oldConfig;
				} catch {
					// Ignore errors with old file
				}
			}

			// Parse the ESM module format
			const configContent: string = readFileSync(CONFIG_FILE, "utf8");

			try {
				// Use a safer approach than regex + JSON.parse
				// Execute the file as a JavaScript module using Node's module system
				// This is a workaround since we can't directly import a dynamic path in ESM

				// Simple approach: parse the JS object manually
				const objectPattern: RegExp = /export\s+default\s+(\{[\s\S]*?\});/;
				const match: null | RegExpExecArray = objectPattern.exec(configContent);

				if (match?.[1]) {
					// Extract the object text
					const objectText: string = match[1];

					// Extract property assignments with a more robust approach
					const properties: Record<string, string> = {};

					// Match each property in the format: key: value,
					// eslint-disable-next-line @elsikora/sonar/slow-regex
					const propertyRegex: RegExp = /\s*(\w+)\s*:\s*["']?([^,"'}\s]+)["']?\s*,?/g;

					let propertyMatch;

					while ((propertyMatch = propertyRegex.exec(objectText)) !== null) {
						const [, key, value] = propertyMatch;
						// Remove quotes if present
						// eslint-disable-next-line @elsikora/sonar/anchor-precedence
						const cleanValue: string = value.replaceAll(/^["']|["']$/g, "");
						properties[key] = cleanValue;
					}

					// Validate mode if present (but only show the error once)
					if (properties.mode && properties.mode !== "auto" && properties.mode !== "manual") {
						if (!modeErrorShown) {
							console.warn(chalk.yellow(`Invalid mode "${properties.mode}" in config. Valid values are "auto" or "manual". Using default mode.`));
							modeErrorShown = true;
						}
						properties.mode = "auto";
					}

					return properties as LLMConfigStorage;
				}

				return null;
			} catch (parseError) {
				console.warn("Error parsing config file:", parseError);

				return null;
			}
		}
	} catch (error) {
		console.warn("Error loading LLM config from file:", error);
	}

	return null;
};

// Save config to file (without API key)
const saveConfigToFile = (config: LLMConfig): void => {
	try {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true });
		}

		// Only store provider, model, and mode (not the API key)
		const storageConfig: LLMConfigStorage = {
			mode: config.mode,
			model: config.model,
			provider: config.provider,
		};

		// Format as an ESM module with proper JS object format (no quotes around keys)
		// Always include the mode field, using 'auto' as default if not specified
		const jsContent: string = `export default {
  provider: ${JSON.stringify(storageConfig.provider)},
  model: ${JSON.stringify(storageConfig.model)},
  mode: ${JSON.stringify(storageConfig.mode ?? "auto")}
};`;

		writeFileSync(CONFIG_FILE, jsContent, "utf8");

		// Remove old JSON file if it exists
		const oldJsonFile: string = join(CONFIG_DIR, "commitlint-ai.json");

		if (existsSync(oldJsonFile)) {
			try {
				// Use fs.unlink to delete the file - but we'll use writeFileSync with empty content instead
				// to avoid needing to import fs.unlink
				writeFileSync(oldJsonFile, "", "utf8");
			} catch {
				// Ignore errors with old file deletion
			}
		}
	} catch (error) {
		console.warn("Error saving LLM config to file:", error);
	}
};

export const setLLMConfig = (config: LLMConfig | null): void => {
	llmConfig = config;

	if (config) {
		// For debugging
		console.warn("Saving config:", JSON.stringify({ ...config, apiKey: "[REDACTED]" }));
		saveConfigToFile(config);
	}
};

export const getLLMConfig = (): LLMConfig | null => {
	// If we already have a config in memory, return it
	if (llmConfig) {
		return llmConfig;
	}

	// Otherwise try to load from file
	const fileConfig: LLMConfigStorage | null = loadConfigFromFile();

	if (fileConfig) {
		// Check if we have API key in environment
		const apiKey: null | string = getApiKeyFromEnvironment(fileConfig.provider);

		// We have both the saved config and an API key
		if (apiKey) {
			llmConfig = {
				...fileConfig,
				apiKey,
			};

			return llmConfig;
		}

		// Return the partial config (without API key) so we can ask for it
		return {
			...fileConfig,
			apiKey: "", // Empty string signals that we need to ask for the key
		};
	}

	return null;
};

// Reset the mode error shown flag (useful for testing)
export const resetModeErrorFlag = (): void => {
	modeErrorShown = false;
};
