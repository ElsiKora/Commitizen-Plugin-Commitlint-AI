/**
 * Value object representing an API key
 */
export class ApiKey {
	private readonly value: string;

	constructor(value: string) {
		if (!value || value.trim().length === 0) {
			throw new Error("API key cannot be empty");
		}
		this.value = value.trim();
	}

	/**
	 * Get the API key value
	 */
	getValue(): string {
		return this.value;
	}

	/**
	 * Get masked version of the API key for display
	 */
	getMasked(): string {
		if (this.value.length <= 8) {
			return "****";
		}
		return `${this.value.substring(0, 4)}...${this.value.substring(this.value.length - 4)}`;
	}

	/**
	 * Check if two API keys are equal
	 */
	equals(other: ApiKey): boolean {
		return this.value === other.value;
	}
} 