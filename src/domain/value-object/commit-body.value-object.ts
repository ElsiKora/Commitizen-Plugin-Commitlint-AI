/**
 * Value object representing a commit message body
 */
export class CommitBody {
	private readonly content: string;
	private readonly breakingChange: string | undefined;

	constructor(content?: string, breakingChange?: string) {
		this.content = content?.trim() || "";
		this.breakingChange = breakingChange?.trim();
	}

	/**
	 * Get the body content
	 */
	getContent(): string {
		return this.content;
	}

	/**
	 * Get the breaking change description
	 */
	getBreakingChange(): string | undefined {
		return this.breakingChange;
	}

	/**
	 * Check if there is a breaking change
	 */
	hasBreakingChange(): boolean {
		return !!this.breakingChange;
	}

	/**
	 * Format the body as a string
	 */
	toString(): string {
		const parts: string[] = [];

		if (this.breakingChange) {
			parts.push(`BREAKING CHANGE: ${this.breakingChange}`);
		}

		if (this.content) {
			parts.push(this.content);
		}

		return parts.join("\n\n");
	}

	/**
	 * Check if the body is empty
	 */
	isEmpty(): boolean {
		return !this.content && !this.breakingChange;
	}

	/**
	 * Check if two bodies are equal
	 */
	equals(other: CommitBody): boolean {
		return this.content === other.content && this.breakingChange === other.breakingChange;
	}
} 