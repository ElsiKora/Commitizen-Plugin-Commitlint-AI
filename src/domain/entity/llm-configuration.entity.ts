import type { ELLMProvider } from "../enum/llm-provider.enum.js";
import type { ApiKey } from "../value-object/api-key.value-object.js";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../constant/numeric.constant.js";
import { ECommitMode } from "../enum/commit-mode.enum.js";

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
	 * @returns {ApiKey} The API key
	 */
	getApiKey(): ApiKey {
		return this.API_KEY;
	}

	/**
	 * Get the maximum retries
	 * @returns {number} The maximum retries
	 */
	getMaxRetries(): number {
		return this.MAX_RETRIES;
	}

	/**
	 * Get the commit mode
	 * @returns {ECommitMode} The commit mode
	 */
	getMode(): ECommitMode {
		return this.MODE;
	}

	/**
	 * Get the model name
	 * @returns {string | undefined} The model name or undefined
	 */
	getModel(): string | undefined {
		return this.MODEL;
	}

	/**
	 * Get the LLM provider
	 * @returns {ELLMProvider} The LLM provider
	 */
	getProvider(): ELLMProvider {
		return this.PROVIDER;
	}

	/**
	 * Get the validation max retries
	 * @returns {number} The validation max retries
	 */
	getValidationMaxRetries(): number {
		return this.VALIDATION_MAX_RETRIES;
	}

	/**
	 * Check if mode is auto
	 * @returns {boolean} True if mode is auto
	 */
	isAutoMode(): boolean {
		return this.MODE === ECommitMode.AUTO;
	}

	/**
	 * Check if mode is manual
	 * @returns {boolean} True if mode is manual
	 */
	isManualMode(): boolean {
		return this.MODE === ECommitMode.MANUAL;
	}

	/**
	 * Create a new configuration with a different API key
	 * @param {ApiKey} apiKey - The new API key
	 * @returns {LLMConfiguration} A new configuration with the updated API key
	 */
	withApiKey(apiKey: ApiKey): LLMConfiguration {
		return new LLMConfiguration(this.PROVIDER, apiKey, this.MODE, this.MODEL, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}

	/**
	 * Create a new configuration with a different mode
	 * @param {ECommitMode} mode - The new mode
	 * @returns {LLMConfiguration} A new configuration with the updated mode
	 */
	withMode(mode: ECommitMode): LLMConfiguration {
		return new LLMConfiguration(this.PROVIDER, this.API_KEY, mode, this.MODEL, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}

	/**
	 * Create a new configuration with updated model
	 * @param {string} model - The new model name
	 * @returns {LLMConfiguration} A new configuration with the updated model
	 */
	withModel(model: string): LLMConfiguration {
		return new LLMConfiguration(this.PROVIDER, this.API_KEY, this.MODE, model, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}
}
