import type { CommitBody } from "../value-object/commit-body.value-object.js";
import type { CommitHeader } from "../value-object/commit-header.value-object.js";

/**
 * Entity representing a complete commit message
 */
export class CommitMessage {
	private readonly BODY: CommitBody;

	private readonly HEADER: CommitHeader;

	constructor(header: CommitHeader, body: CommitBody) {
		this.HEADER = header;
		this.BODY = body;
	}

	/**
	 * Get the commit body
	 * @returns {CommitBody} The commit body
	 */
	getBody(): CommitBody {
		return this.BODY;
	}

	/**
	 * Get breaking change text if present
	 * @returns {string | undefined} The breaking change text or undefined
	 */
	getBreakingChange(): string | undefined {
		return this.BODY.getBreakingChange();
	}

	/**
	 * Get the commit header
	 * @returns {CommitHeader} The commit header
	 */
	getHeader(): CommitHeader {
		return this.HEADER;
	}

	/**
	 * Check if this is a breaking change
	 * @returns {boolean} True if breaking change
	 */
	isBreakingChange(): boolean {
		return this.BODY.hasBreakingChange();
	}

	/**
	 * Format the complete commit message
	 * @returns {string} The formatted commit message
	 */
	toString(): string {
		const parts: Array<string> = [this.HEADER.toString()];

		if (!this.BODY.isEmpty()) {
			parts.push(this.BODY.toString());
		}

		return parts.join("\n\n");
	}

	/**
	 * Create a new CommitMessage with a different body
	 * @param {CommitBody} body - The new body
	 * @returns {CommitMessage} A new CommitMessage instance with the updated body
	 */
	withBody(body: CommitBody): CommitMessage {
		return new CommitMessage(this.HEADER, body);
	}

	/**
	 * Create a new CommitMessage with a different header
	 * @param {CommitHeader} header - The new header
	 * @returns {CommitMessage} A new CommitMessage instance with the updated header
	 */
	withHeader(header: CommitHeader): CommitMessage {
		return new CommitMessage(header, this.BODY);
	}
}
