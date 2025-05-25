/* eslint-disable @elsikora/typescript/restrict-template-expressions */
import type { PromptsInterface } from "../promptsInterface.js";

import type { CommitConfig, CommitMode, LLMConfig, LLMConfigStorage, LLMPromptContext, LLMProvider } from "./types.js";

import { exec } from "node:child_process";
import { promisify } from "node:util";

import chalk from "chalk";

import { generateCommitWithAnthropic } from "./anthropic.js";
import { getLLMConfig, setLLMConfig } from "./config.js";
import { ANTHROPIC_MODEL_CHOICES, OPENAI_MODEL_CHOICES } from "./models.js";
import { generateCommitWithOpenAI } from "./openai.js";

const execAsync = promisify(exec);

export { getLLMConfig, setLLMConfig } from "./config.js";
export type * from "./types.js";

export async function generateCommitMessage(context: LLMPromptContext): Promise<CommitConfig> {
	const config: ({ apiKey: string } & LLMConfigStorage) | null = getLLMConfig();

	if (!config) {
		throw new Error("LLM not configured. Please run selectLLMProvider first.");
	}

	// Check if we're in manual mode
	if (config.mode === "manual") {
		throw new Error("Manual mode enabled. Skipping AI generation.");
	}

	// Validate provider only, not model
	if (!isValidProvider(config.provider)) {
		throw new Error(`Invalid LLM provider: ${config.provider}. Please reconfigure with a valid provider.`);
	}

	// Get git diff for better context
	try {
		// Get staged files for scope inference
		const { stdout: stagedFiles } = await execAsync("git diff --name-only --cached");
		context.files = stagedFiles;

		// Get directory structure for better scope inference
		if (stagedFiles.trim()) {
			const directories: string = stagedFiles
				.split("\n")
				.filter(Boolean)
				.map((file: string) => {
					const parts: Array<string> = file.split("/");

					return parts.length > 1 ? parts[0] : "root";
				})
				.filter((v: string, index: number, a: Array<string>) => a.indexOf(v) === index) // Remove duplicates
				.join(", ");

			context.files += `\n\nModified directories: ${directories}`;
		}

		// Get the diff for content analysis
		const { stdout: diff } = await execAsync("git diff --cached");

		context.diff ??= diff;
	} catch {
		console.warn("Failed to get git diff information, continuing without it");
	}

	// Generate commit with selected provider
	if (config.provider === "openai") {
		return generateCommitWithOpenAI(config.apiKey, config.model, context);
	} else if (config.provider === "anthropic") {
		return generateCommitWithAnthropic(config.apiKey, config.model, context);
	} else {
		// This shouldn't happen due to the validation above, but just in case
		throw new Error(`Unsupported provider: ${config.provider}`);
	}
}

// eslint-disable-next-line @elsikora/sonar/cognitive-complexity
export async function selectLLMProvider(promptsInterface: PromptsInterface): Promise<void> {
	// Check if we have a partial config
	const existingConfig: ({ apiKey: string } & LLMConfigStorage) | null = getLLMConfig();

	let provider: string;
	let model: string;
	let mode: string = "auto"; // Default mode

	const isProviderExist: boolean = Boolean(existingConfig?.provider);
	const isModelExist: boolean = Boolean(existingConfig?.model) && existingConfig?.model !== "undefined";

	if (existingConfig && isProviderExist && isModelExist) {
		// We have a saved config
		provider = existingConfig.provider;
		model = existingConfig.model;
		mode = existingConfig.mode ?? "auto";

		const modelDisplay: string = model ?? "[not set]";
		// eslint-disable-next-line @elsikora/sonar/no-nested-conditional
		const providerDisplay: string = provider ? (provider === "openai" ? "OpenAI" : "Anthropic") : "[not set]";
		const modeDisplay: string = mode || "auto";

		// First check if we want to use the existing config at all
		const useExistingResponse = await promptsInterface.prompt({
			default: true,
			message: `Use saved configuration? (Provider: ${providerDisplay}, Model: ${modelDisplay}, Mode: ${modeDisplay})`,
			name: "useExisting",
			type: "confirm",
		});
		const useExisting = useExistingResponse.useExisting as boolean;

		if (useExisting) {
			// We're using existing config, but we need to check if it's complete

			// We have a provider but it's invalid
			if (provider && !isValidProvider(provider)) {
				console.warn(chalk.yellow(`Provider "${provider}" is not supported. Please select a valid provider below.`));
				// Fall through to ask for a new provider
			} else if (!provider) {
				console.warn(chalk.yellow(`No AI provider specified in configuration. Please select a provider below.`));
				// Fall through to ask for a provider
			} else if (!model && mode === "auto") {
				// We have a valid provider but no model in auto mode
				console.warn(chalk.yellow("No model saved in configuration. Please select a model."));

				if (provider === "openai") {
					const response = await promptsInterface.prompt([
						{
							choices: OPENAI_MODEL_CHOICES,
							message: "Select an OpenAI model:",
							name: "model",
							type: "list",
						},
					]);

					if (response.model === "custom") {
						const customResponse = await promptsInterface.prompt([
							{
								message: "Enter the OpenAI model name:",
								name: "customModel",
								type: "input",

								validate: (input: string) => {
									if (!input) return "Model name is required";

									return true;
								},
							},
						]);
						model = customResponse.customModel as string;
					} else {
						model = response.model as string;
					}
				} else if (provider === "anthropic") {
					const response = await promptsInterface.prompt([
						{
							choices: ANTHROPIC_MODEL_CHOICES,
							message: "Select an Anthropic model:",
							name: "model",
							type: "list",
						},
					]);

					if (response.model === "custom") {
						const customResponse = await promptsInterface.prompt([
							{
								message: "Enter the Anthropic model name:",
								name: "customModel",
								type: "input",

								validate: (input: string) => {
									if (!input) return "Model name is required";

									return true;
								},
							},
						]);
						model = customResponse.customModel as string;
					} else {
						model = response.model as string;
					}
				}

				// Update the existing config with the selected model
				existingConfig.model = model;

				// Save the updated config to file with the selected model
				setLLMConfig({
					apiKey: existingConfig.apiKey || "",
					mode: existingConfig.mode ?? "auto",
					model,
					provider: existingConfig.provider,
				});
			}

			// In manual mode, we don't need a model or provider, so skip forward
			if (mode === "manual") {
				// Even in manual mode, save the config to remember the mode choice
				// eslint-disable-next-line @elsikora/typescript/no-non-null-assertion
				const oldConfig: LLMConfig = getLLMConfig()!;
				setLLMConfig({
					...oldConfig,
					mode: "manual",
				});

				console.warn(chalk.green(`✅ Manual commit mode configured successfully!`));

				return;
			}

			// Now check if we need an API key (only in auto mode)
			if (existingConfig.apiKey) {
				// We have a complete config with API key
				console.warn(chalk.green(`✅ Using existing configuration.`));

				return;
			} else {
				// Double-check environment variables again
				const environmentVariableName: string = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
				let environmentApiKey: string | undefined;

				try {
					if (typeof process !== "undefined" && process?.env) {
						environmentApiKey = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
					}
				} catch {
					// Ignore error
				}

				if (environmentApiKey) {
					// Found API key in environment variable
					console.warn(chalk.green(`✅ Found ${provider === "openai" ? "OpenAI" : "Anthropic"} API key in environment variable ${environmentVariableName}`));
					existingConfig.apiKey = environmentApiKey;
					setLLMConfig(existingConfig);

					return;
				}

				console.warn(chalk.yellow(`No ${provider === "openai" ? "OpenAI" : "Anthropic"} API key found in environment.`));
				console.warn(chalk.blue(`Tip: Set the ${environmentVariableName} environment variable to avoid entering your API key each time.`));
				console.warn(chalk.blue(`You can create a .env file in your project root with ${environmentVariableName}=your-key-here`));

				const { apiKey } = await promptsInterface.prompt([
					{
						message: `Enter your ${provider === "openai" ? "OpenAI" : "Anthropic"} API key:`,
						name: "apiKey",
						type: "password",
						// eslint-disable-next-line @elsikora/sonar/function-return-type
						validate: (input: string) => {
							if (!input) return "API key is required";

							if (provider === "openai" && !input.startsWith("sk-")) {
								return 'OpenAI API keys typically start with "sk-"';
							}

							return true;
						},
					},
				]);

				// Update the config with the API key for this session only
				const config: LLMConfig = { apiKey: apiKey as string, mode: mode as CommitMode, model, provider: provider as LLMProvider };
				setLLMConfig(config);

				console.warn(chalk.green(`✅ Configuration completed successfully!`));

				return;
			}
		} else {
			// User wants to change the config, fall through to the setup section
		}
	}

	// No config or user wants to change it, run the full setup

	// First ask for commit mode preference
	const modeResponse = await promptsInterface.prompt([
		{
			choices: [
				{ name: "Manual (traditional commitizen)", title: "Manual (traditional commitizen)", value: "manual" },
				{ name: "AI-powered (auto)", title: "AI-powered (auto)", value: "auto" },
			],
			default: "manual",
			message: "Select your preferred commit mode:",
			name: "mode",
			type: "list",
		},
	]);

	mode = modeResponse.mode as string;

	// If the user selected manual mode, we don't need provider or model
	if (mode === "manual") {
		// Save minimal config with just the mode
		// Note: explicit provider/model values to make debugging easier

		// eslint-disable-next-line @elsikora/typescript/no-non-null-assertion
		const oldConfig: LLMConfig = getLLMConfig()!;
		setLLMConfig({
			...oldConfig,
			mode: "manual",
		});

		console.warn(chalk.green(`✅ Manual commit mode configured successfully!`));

		return;
	}

	// Only proceed with provider/model selection if in auto mode
	const providerResponse = await promptsInterface.prompt([
		{
			choices: [
				{ name: "OpenAI", title: "OpenAI", value: "openai" },
				{ name: "Anthropic", title: "Anthropic", value: "anthropic" },
			],
			message: "Select an LLM provider:",
			name: "provider",
			type: "list",
		},
	]);

	provider = providerResponse.provider as string;

	// Check if API key is in environment variables
	let environmentApiKey: null | string = null;
	const environmentVariableName: string = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";

	try {
		if (typeof process !== "undefined" && process?.env) {
			environmentApiKey = provider === "openai" ? (process.env.OPENAI_API_KEY ?? null) : (process.env.ANTHROPIC_API_KEY ?? null);
		}
	} catch (error) {
		console.warn("Error accessing environment variables:", error);
	}

	let apiKey: string;

	if (environmentApiKey) {
		console.warn(chalk.green(`✅ Found ${provider === "openai" ? "OpenAI" : "Anthropic"} API key in environment variable ${environmentVariableName}`));
		apiKey = environmentApiKey;
	} else {
		console.warn(chalk.yellow(`No ${provider === "openai" ? "OpenAI" : "Anthropic"} API key found in environment.`));
		console.warn(chalk.blue(`Tip: Set the ${environmentVariableName} environment variable to avoid entering your API key each time.`));

		const response = await promptsInterface.prompt([
			{
				message: `Enter your ${provider === "openai" ? "OpenAI" : "Anthropic"} API key:`,
				name: "apiKey",
				type: "password",
				// eslint-disable-next-line @elsikora/sonar/function-return-type
				validate: (input: string) => {
					if (!input) return "API key is required";

					if (provider === "openai" && !input.startsWith("sk-")) {
						return 'OpenAI API keys typically start with "sk-"';
					}

					return true;
				},
			},
		]);

		apiKey = response.apiKey as string;
	}

	// Now get models based on provider
	if (provider === "openai") {
		// Display model selection
		const response = await promptsInterface.prompt([
			{
				choices: OPENAI_MODEL_CHOICES,
				message: "Select an OpenAI model:",
				name: "model",
				type: "list",
			},
		]);

		// If user selected custom, ask for model name
		if (response.model === "custom") {
			const customResponse = await promptsInterface.prompt([
				{
					message: "Enter the OpenAI model name:",
					name: "customModel",
					type: "input",

					validate: (input: string) => {
						if (!input) return "Model name is required";

						return true;
					},
				},
			]);
			model = customResponse.customModel as string;
		} else {
			model = response.model as string;
		}
	} else if (provider === "anthropic") {
		// For Anthropic, use hardcoded list
		const response = await promptsInterface.prompt([
			{
				choices: ANTHROPIC_MODEL_CHOICES,
				message: "Select an Anthropic model:",
				name: "model",
				type: "list",
			},
		]);

		// If user selected custom, ask for model name
		if (response.model === "custom") {
			const customResponse = await promptsInterface.prompt([
				{
					message: "Enter the Anthropic model name:",
					name: "customModel",
					type: "input",

					validate: (input: string) => {
						if (!input) return "Model name is required";

						return true;
					},
				},
			]);
			model = customResponse.customModel as string;
		} else {
			model = response.model as string;
		}
	} else {
		throw new Error(`Invalid provider: ${provider}`);
	}

	// Save the complete config
	const config: LLMConfig = { apiKey, mode: mode as CommitMode, model, provider: provider as LLMProvider };
	setLLMConfig(config);

	console.warn(chalk.green(`✅ AI-powered commit mode configured successfully!`));
}

// We'll only validate provider, not model
function isValidProvider(provider: string): boolean {
	return provider === "openai" || provider === "anthropic";
}
