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
 * // footer becomes: "Refs CAS-25."
 *
 * // With existing footer
 * addTicketIdToCommitMessage(commitMessage, "CAS-25")
 * // footer becomes: "Closes #123\nRefs CAS-25."
 */
export function addTicketIdToCommitMessage(message: CommitMessage, ticketId: string): CommitMessage {
	const body: CommitBody = message.getBody();
	const currentFooter: string | undefined = body.getFooter();
	const normalizedTicketId: string = normalizeTicketId(ticketId);

	if (normalizedTicketId.length === 0) {
		return message;
	}

	// Create the ticket reference
	const ticketReference: string = `Refs ${normalizedTicketId}.`;

	const existingLines: Array<string> =
		currentFooter
			?.split("\n")
			.map((line: string) => line.trim())
			.filter((line: string) => line.length > 0) ?? [];

	if (hasTicketReference(existingLines, normalizedTicketId)) {
		return message;
	}

	const nextFooterLines: Array<string> = [...existingLines, ticketReference];
	const newFooter: string = nextFooterLines.join("\n");

	// Create new CommitBody with updated footer
	const newBody: CommitBody = new CommitBody(body.getContent(), body.getBreakingChange(), newFooter);

	// Return new CommitMessage with updated body
	return message.withBody(newBody);
}

/**
 * Check whether footer already contains a reference for the ticket.
 * @param {Array<string>} footerLines - Footer lines split by newline.
 * @param {string} ticketId - Normalized ticket identifier.
 * @returns {boolean} True when reference already exists.
 */
function hasTicketReference(footerLines: Array<string>, ticketId: string): boolean {
	const expectedReference: string = `refs ${ticketId}`.toLowerCase();

	for (const line of footerLines) {
		const normalizedLine: string = normalizeReferenceLine(line);

		if (normalizedLine === expectedReference) {
			return true;
		}
	}

	return false;
}

/**
 * Normalize footer reference line for stable comparison.
 * Supports "Refs CAS-25.", "Refs: CAS-25", "Refs #CAS-25", and legacy "Refs CAS-25" forms.
 * @param {string} line - Raw footer line.
 * @returns {string} Canonical reference form.
 */
function normalizeReferenceLine(line: string): string {
	const trimmedLine: string = line.trim();
	const lowerCaseLine: string = trimmedLine.toLowerCase();

	if (!lowerCaseLine.startsWith("refs")) {
		return lowerCaseLine;
	}

	const rawTail: string = trimmedLine.slice("refs".length).trimStart();
	let normalizedTail: string = rawTail;

	if (normalizedTail.startsWith(":")) {
		normalizedTail = normalizedTail.slice(1).trimStart();
	}

	const tailWithoutHash: string = normalizedTail.startsWith("#") ? normalizedTail.slice(1).trimStart() : normalizedTail;
	const tailWithoutPeriod: string = tailWithoutHash.endsWith(".") ? tailWithoutHash.slice(0, Math.max(0, tailWithoutHash.length - 1)).trimEnd() : tailWithoutHash;

	return `refs ${tailWithoutPeriod}`.toLowerCase();
}

/**
 * Normalize ticket id by trimming and removing internal whitespace.
 * @param {string} ticketId - Raw ticket identifier.
 * @returns {string} Normalized ticket identifier.
 */
function normalizeTicketId(ticketId: string): string {
	return removeWhitespace(ticketId.trim());
}

/**
 * Remove all whitespace characters from a string.
 * @param {string} value - Source value.
 * @returns {string} Value without whitespace.
 */
function removeWhitespace(value: string): string {
	let normalized: string = "";

	for (const character of value) {
		if (character.trim() === "") {
			continue;
		}
		normalized += character;
	}

	return normalized;
}
