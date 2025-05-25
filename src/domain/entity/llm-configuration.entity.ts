import type { ECommitMode } from "../enum/commit-mode.enum.js";
import type { ELLMProvider } from "../enum/llm-provider.enum.js";
import type { ApiKey } from "../value-object/api-key.value-object.js";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../constant/numeric.constant.js";

/**
 * Entity representing LLM configuration
 */
export class LLMConfiguration {
	private readonly API_KEY: ApiKey;

	private readonly MAX_RETRIES: number;

	private readonly MODE: ECommitMode;

	private readonly MODEL: string | undefined;

	private readonly PROVIDER: ELLMProvider;

	private readonly VALIDATION_MAX_RETRIES: number;

	constructor(provider: ELLMProvider, apiKey: ApiKey, mode: ECommitMode, model?: string, maxRetries: number = DEFAULT_MAX_RETRIES, validationMaxRetries: number = DEFAULT_VALIDATION_MAX_RETRIES) {
		this.PROVIDER = provider;
		this.API_KEY = apiKey;
		this.MODE = mode;
		this.MODEL = model;
		this.MAX_RETRIES = maxRetries;
		this.VALIDATION_MAX_RETRIES = validationMaxRetries;
	}

	/**
	 * Get the API key
	 * @returns The API key
	 */
	getApiKey(): ApiKey {
		return this.API_KEY;
	}

	/**
	 * Get the maximum number of retries for LLM calls
	 * @returns The maximum number of retries
	 */
	getMaxRetries(): number {
		return this.MAX_RETRIES;
	}

	/**
	 * Get the commit mode
	 * @returns The commit mode
	 */
	getMode(): ECommitMode {
		return this.MODE;
	}

	/**
	 * Get the model name
	 * @returns The model name
	 */
	getModel(): string | undefined {
		return this.MODEL;
	}

	/**
	 * Get the LLM provider
	 * @returns The LLM provider
	 */
	getProvider(): ELLMProvider {
		return this.PROVIDER;
	}

	/**
	 * Get the maximum number of retries for validation fixes
	 * @returns The maximum number of retries for validation
	 */
	getValidationMaxRetries(): number {
		return this.VALIDATION_MAX_RETRIES;
	}

	/**
	 * Check if configuration is in auto mode
	 * @returns True if in auto mode
	 */
	isAutoMode(): boolean {
		return this.MODE === ("auto" as ECommitMode);
	}

	/**
	 * Check if configuration is in manual mode
	 * @returns True if in manual mode
	 */
	isManualMode(): boolean {
		return this.MODE === ("manual" as ECommitMode);
	}

	/**
	 * Create a new configuration with a different mode
	 * @param mode - The new mode
	 * @returns New configuration with the updated mode
	 */
	withMode(mode: ECommitMode): LLMConfiguration {
		return new LLMConfiguration(this.PROVIDER, this.API_KEY, mode, this.MODEL, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}

	/**
	 * Create a new configuration with updated model
	 */
	withModel(model: string): LLMConfiguration {
		return new LLMConfiguration(this.PROVIDER, this.API_KEY, this.MODE, model, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}
}
