import type { TicketId } from "@domain/value-object/ticket-id.value-object";

/**
 * Interface for parsing ticket identifiers from branch names.
 */
export interface ITicketIdParser {
	/**
	 * Parse ticket id from branch name.
	 * @param {string} branchName - Branch name to parse.
	 * @returns {Promise<TicketId | undefined>} Parsed ticket id when present.
	 */
	parseFromBranchName(branchName: string): Promise<TicketId | undefined>;
}
