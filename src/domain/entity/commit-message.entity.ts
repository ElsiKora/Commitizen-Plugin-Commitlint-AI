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
	 */
	getBody(): CommitBody {
		return this.BODY;
	}

	/**
	 * Get the commit header
	 */
	getHeader(): CommitHeader {
		return this.HEADER;
	}

	/**
	 * Check if the commit has a breaking change
	 */
	hasBreakingChange(): boolean {
		return this.BODY.hasBreakingChange();
	}

	/**
	 * Format the complete commit message
	 */
	toString(): string {
		const parts: Array<string> = [this.HEADER.toString()];

		if (!this.BODY.isEmpty()) {
			parts.push(this.BODY.toString());
		}

		return parts.join("\n\n");
	}

	/**
	 * Create a new commit message with updated body
	 */
	withBody(body: CommitBody): CommitMessage {
		return new CommitMessage(this.HEADER, body);
	}

	/**
	 * Create a new commit message with updated header
	 */
	withHeader(header: CommitHeader): CommitMessage {
		return new CommitMessage(header, this.BODY);
	}
}
