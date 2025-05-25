/**
 * Value object representing a commit message header
 */
export class CommitHeader {
	private readonly SCOPE: string | undefined;

	private readonly SUBJECT: string;

	private readonly TYPE: string;

	constructor(type: string, subject: string, scope?: string) {
		if (!type || type.trim().length === 0) {
			throw new Error("Commit type cannot be empty");
		}

		if (!subject || subject.trim().length === 0) {
			throw new Error("Commit subject cannot be empty");
		}

		this.TYPE = type.trim();
		this.SUBJECT = subject.trim();
		this.SCOPE = scope?.trim();
	}

	/**
	 * Check if two headers are equal
	 */
	equals(other: CommitHeader): boolean {
		return this.TYPE === other.getType() && this.SCOPE === other.getScope() && this.SUBJECT === other.getSubject();
	}

	/**
	 * Get the commit scope
	 */
	getScope(): string | undefined {
		return this.SCOPE;
	}

	/**
	 * Get the commit subject
	 */
	getSubject(): string {
		return this.SUBJECT;
	}

	/**
	 * Get the commit type
	 */
	getType(): string {
		return this.TYPE;
	}

	/**
	 * Format the header as a string
	 */
	toString(): string {
		if (this.SCOPE) {
			return `${this.TYPE}(${this.SCOPE}): ${this.SUBJECT}`;
		}

		return `${this.TYPE}: ${this.SUBJECT}`;
	}
}
