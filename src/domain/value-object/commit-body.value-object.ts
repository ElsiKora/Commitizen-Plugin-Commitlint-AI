/**
 * Value object representing a commit message body
 */
export class CommitBody {
	private readonly BREAKING_CHANGE: string | undefined;

	private readonly CONTENT: string | undefined;

	constructor(content?: string, breakingChange?: string) {
		this.CONTENT = content?.trim() ?? undefined;
		this.BREAKING_CHANGE = breakingChange?.trim() ?? undefined;
	}

	/**
	 * Check if two bodies are equal
	 * @param {CommitBody} other - The other commit body to compare with
	 * @returns {boolean} True if the bodies are equal
	 */
	equals(other: CommitBody): boolean {
		return this.CONTENT === other.CONTENT && this.BREAKING_CHANGE === other.BREAKING_CHANGE;
	}

	/**
	 * Get the breaking change description
	 * @returns {string | undefined} The breaking change description or undefined
	 */
	getBreakingChange(): string | undefined {
		return this.BREAKING_CHANGE;
	}

	/**
	 * Get the body content
	 * @returns {string | undefined} The body content or undefined
	 */
	getContent(): string | undefined {
		return this.CONTENT;
	}

	/**
	 * Check if there is a breaking change
	 * @returns {boolean} True if there is a breaking change
	 */
	hasBreakingChange(): boolean {
		return !!this.BREAKING_CHANGE;
	}

	/**
	 * Check if the body is empty
	 * @returns {boolean} True if the body is empty
	 */
	isEmpty(): boolean {
		return !this.CONTENT && !this.BREAKING_CHANGE;
	}

	/**
	 * Format the body as a string
	 * @returns {string} The formatted body text
	 */
	toString(): string {
		const parts: Array<string> = [];

		if (this.BREAKING_CHANGE) {
			parts.push(`BREAKING CHANGE: ${this.BREAKING_CHANGE}`);
		}

		if (this.CONTENT) {
			parts.push(this.CONTENT);
		}

		return parts.join("\n\n");
	}
}
