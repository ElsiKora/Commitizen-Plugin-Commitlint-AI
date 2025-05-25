import type { ECommitMode } from "../enum/commit-mode.enum.js";
import type { ELLMProvider } from "../enum/llm-provider.enum.js";
import type { ApiKey } from "../value-object/api-key.value-object.js";

/**
 * Entity representing LLM configuration
 */
export class LLMConfiguration {
	private readonly provider: ELLMProvider;
	private readonly apiKey: ApiKey;
	private readonly mode: ECommitMode;
	private readonly model?: string;
	private readonly maxRetries: number;
	private readonly validationMaxRetries: number;

	constructor(
		provider: ELLMProvider, 
		apiKey: ApiKey, 
		mode: ECommitMode, 
		model?: string,
		maxRetries: number = 3,
		validationMaxRetries: number = 3
	) {
		this.provider = provider;
		this.apiKey = apiKey;
		this.mode = mode;
		this.model = model;
		this.maxRetries = maxRetries;
		this.validationMaxRetries = validationMaxRetries;
	}

	/**
	 * Get the LLM provider
	 */
	getProvider(): ELLMProvider {
		return this.provider;
	}

	/**
	 * Get the API key
	 */
	getApiKey(): ApiKey {
		return this.apiKey;
	}

	/**
	 * Get the commit mode
	 */
	getMode(): ECommitMode {
		return this.mode;
	}

	/**
	 * Get the model name
	 */
	getModel(): string | undefined {
		return this.model;
	}

	/**
	 * Get the max retries for LLM generation
	 */
	getMaxRetries(): number {
		return this.maxRetries;
	}

	/**
	 * Get the max retries for validation fixes
	 */
	getValidationMaxRetries(): number {
		return this.validationMaxRetries;
	}

	/**
	 * Check if auto mode is enabled
	 */
	isAutoMode(): boolean {
		return this.mode === "auto";
	}

	/**
	 * Check if manual mode is enabled
	 */
	isManualMode(): boolean {
		return this.mode === "manual";
	}

	/**
	 * Create a new configuration with updated mode
	 */
	withMode(mode: ECommitMode): LLMConfiguration {
		return new LLMConfiguration(this.provider, this.apiKey, mode, this.model, this.maxRetries, this.validationMaxRetries);
	}

	/**
	 * Create a new configuration with updated model
	 */
	withModel(model: string): LLMConfiguration {
		return new LLMConfiguration(this.provider, this.apiKey, this.mode, model, this.maxRetries, this.validationMaxRetries);
	}
} 