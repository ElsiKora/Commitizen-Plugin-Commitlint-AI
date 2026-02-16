/**
 * Parse ticket ID from branch name
 * Extracts ticket ID in format LETTERS-NUMBERS (e.g., CAS-25, PROJ-123)
 * @param {string} branchName - The git branch name to parse
 * @returns {string | undefined} The ticket ID if found, undefined otherwise
 * @example
 * parseTicketIdFromBranch("fix/CAS-25-login-error") // returns "CAS-25"
 * parseTicketIdFromBranch("feature/auth") // returns undefined
 */
export function parseTicketIdFromBranch(branchName: string): string | undefined {
	// Use limited quantifiers to prevent ReDoS vulnerability
	// Matches 1-10 uppercase letters, a dash, and 1-10 digits (e.g., CAS-25, PROJ-123)
	const ticketIdPattern: RegExp = /[A-Z]{1,10}-\d{1,10}/u;
	const match: null | RegExpExecArray = ticketIdPattern.exec(branchName);

	return match ? match[0] : undefined;
}
