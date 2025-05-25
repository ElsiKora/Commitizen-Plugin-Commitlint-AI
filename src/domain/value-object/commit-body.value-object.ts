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
	 */
	equals(other: CommitBody): boolean {
		return this.CONTENT === other.CONTENT && this.BREAKING_CHANGE === other.BREAKING_CHANGE;
	}

	/**
	 * Get the breaking change description
	 */
	getBreakingChange(): string | undefined {
		return this.BREAKING_CHANGE;
	}

	/**
	 * Get the body content
	 */
	getContent(): string | undefined {
		return this.CONTENT;
	}

	/**
	 * Check if there is a breaking change
	 */
	hasBreakingChange(): boolean {
		return !!this.BREAKING_CHANGE;
	}

	/**
	 * Check if the body is empty
	 */
	isEmpty(): boolean {
		return !this.CONTENT && !this.BREAKING_CHANGE;
	}

	/**
	 * Format the body as a string
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
