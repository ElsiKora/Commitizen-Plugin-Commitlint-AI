/**
 * Value object representing a commit message header
 */
export class CommitHeader {
	private readonly type: string;
	private readonly scope: string | undefined;
	private readonly subject: string;

	constructor(type: string, subject: string, scope?: string) {
		if (!type || type.trim().length === 0) {
			throw new Error("Commit type cannot be empty");
		}
		if (!subject || subject.trim().length === 0) {
			throw new Error("Commit subject cannot be empty");
		}

		this.type = type.trim();
		this.subject = subject.trim();
		this.scope = scope?.trim();
	}

	/**
	 * Get the commit type
	 */
	getType(): string {
		return this.type;
	}

	/**
	 * Get the commit scope
	 */
	getScope(): string | undefined {
		return this.scope;
	}

	/**
	 * Get the commit subject
	 */
	getSubject(): string {
		return this.subject;
	}

	/**
	 * Format the header as a string
	 */
	toString(): string {
		if (this.scope) {
			return `${this.type}(${this.scope}): ${this.subject}`;
		}
		return `${this.type}: ${this.subject}`;
	}

	/**
	 * Check if two headers are equal
	 */
	equals(other: CommitHeader): boolean {
		return this.type === other.type && this.scope === other.scope && this.subject === other.subject;
	}
} 