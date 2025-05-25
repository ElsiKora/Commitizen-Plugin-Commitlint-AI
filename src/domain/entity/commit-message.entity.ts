import type { CommitBody } from "../value-object/commit-body.value-object.js";
import type { CommitHeader } from "../value-object/commit-header.value-object.js";

/**
 * Entity representing a complete commit message
 */
export class CommitMessage {
	private readonly header: CommitHeader;
	private readonly body: CommitBody;

	constructor(header: CommitHeader, body: CommitBody) {
		this.header = header;
		this.body = body;
	}

	/**
	 * Get the commit header
	 */
	getHeader(): CommitHeader {
		return this.header;
	}

	/**
	 * Get the commit body
	 */
	getBody(): CommitBody {
		return this.body;
	}

	/**
	 * Format the complete commit message
	 */
	toString(): string {
		const parts: string[] = [this.header.toString()];

		if (!this.body.isEmpty()) {
			parts.push(this.body.toString());
		}

		return parts.join("\n\n");
	}

	/**
	 * Check if the commit has a breaking change
	 */
	hasBreakingChange(): boolean {
		return this.body.hasBreakingChange();
	}

	/**
	 * Create a new commit message with updated header
	 */
	withHeader(header: CommitHeader): CommitMessage {
		return new CommitMessage(header, this.body);
	}

	/**
	 * Create a new commit message with updated body
	 */
	withBody(body: CommitBody): CommitMessage {
		return new CommitMessage(this.header, body);
	}
} 