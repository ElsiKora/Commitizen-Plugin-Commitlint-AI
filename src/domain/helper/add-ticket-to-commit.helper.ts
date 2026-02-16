import type { CommitMessage } from "../entity/commit-message.entity.js";

import { CommitBody } from "../value-object/commit-body.value-object.js";

/**
 * Add ticket ID to commit message footer
 * If footer exists, appends the ticket reference to the end
 * If footer is empty, creates a new footer with the ticket reference
 * @param {CommitMessage} message - The commit message to update
 * @param {string} ticketId - The ticket ID to add (e.g., "CAS-25")
 * @returns {CommitMessage} A new CommitMessage instance with the updated footer
 * @example
 * // Without existing footer
 * addTicketIdToCommitMessage(commitMessage, "CAS-25")
 * // footer becomes: "Refs CAS-25"
 *
 * // With existing footer
 * addTicketIdToCommitMessage(commitMessage, "CAS-25")
 * // footer becomes: "Closes #123\nRefs CAS-25"
 */
export function addTicketIdToCommitMessage(message: CommitMessage, ticketId: string): CommitMessage {
	const body: CommitBody = message.getBody();
	const currentFooter: string | undefined = body.getFooter();

	// Create the ticket reference
	const ticketReference: string = `Refs ${ticketId}`;

	// Determine the new footer
	let newFooter: string;

	if (currentFooter && currentFooter.trim().length > 0) {
		// Append to existing footer
		newFooter = `${currentFooter}\n${ticketReference}`;
	} else {
		// Create new footer
		newFooter = ticketReference;
	}

	// Create new CommitBody with updated footer
	const newBody: CommitBody = new CommitBody(body.getContent(), body.getBreakingChange(), newFooter);

	// Return new CommitMessage with updated body
	return message.withBody(newBody);
}
