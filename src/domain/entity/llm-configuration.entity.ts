import type { ApiKey } from "@domain/value-object/api-key.value-object";

import { NUMERIC_CONSTANT } from "@domain/constant/numeric.constant";
import { ECommitMode } from "@domain/enum/commit-mode.enum";

/**
 * Entity representing LLM configuration
 */
export class LLMConfiguration {
	private readonly API_KEY: ApiKey;

	private readonly MAX_RETRIES: number;

	private readonly MODE: ECommitMode;

	private readonly VALIDATION_MAX_RETRIES: number;

	constructor(apiKey: ApiKey, mode: ECommitMode, maxRetries: number = NUMERIC_CONSTANT.DEFAULT_MAX_RETRIES, validationMaxRetries: number = NUMERIC_CONSTANT.DEFAULT_VALIDATION_MAX_RETRIES) {
		this.API_KEY = apiKey;
		this.MODE = mode;
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
	 * Create a new configuration with a different mode
	 * @param {ECommitMode} mode - The new mode
	 * @returns {LLMConfiguration} A new configuration with the updated mode
	 */
	withMode(mode: ECommitMode): LLMConfiguration {
		return new LLMConfiguration(this.API_KEY, mode, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}
}
