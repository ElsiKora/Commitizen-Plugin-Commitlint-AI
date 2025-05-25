import { MIN_API_KEY_LENGTH, REDACTED_LENGTH } from "../constant/numeric.constant.js";

/**
 * Value object representing an API key
 */
export class ApiKey {
	private readonly VALUE: string;

	constructor(value: string) {
		if (!value || value.trim().length === 0) {
			throw new Error("API key cannot be empty");
		}
		this.VALUE = value.trim();
	}

	/**
	 * Check if two API keys are equal
	 */
	equals(other: ApiKey): boolean {
		return this.VALUE === other.VALUE;
	}

	/**
	 * Get the API key value
	 * @returns The API key value
	 */
	getValue(): string {
		return this.VALUE;
	}

	/**
	 * Check if the API key is valid
	 * @returns True if the API key appears to be valid
	 */
	isValid(): boolean {
		// Basic validation - just check it's not a placeholder
		return this.VALUE.length > MIN_API_KEY_LENGTH && !this.VALUE.includes("your-api-key");
	}

	/**
	 * Get a redacted version of the API key for display
	 * @returns Redacted API key
	 */
	toRedacted(): string {
		if (this.VALUE.length <= REDACTED_LENGTH) return "****";

		return this.VALUE.slice(0, REDACTED_LENGTH) + "..." + this.VALUE.slice(-REDACTED_LENGTH);
	}
}
