const MIN_PART_LENGTH: number = 1;
const TICKET_PARTS_COUNT: number = 2;
const TICKET_SEPARATOR: string = "-";

/**
 * Value object representing a ticket identifier in KEY-NUMBER format.
 */
export class TicketId {
	private readonly KEY: string;

	private readonly NUMBER: string;

	private constructor(key: string, numericPart: string) {
		this.KEY = key;
		this.NUMBER = numericPart;
	}

	/**
	 * Try to create TicketId from raw string.
	 * @param {string} value - Raw ticket id value.
	 * @returns {TicketId | undefined} TicketId when format is valid.
	 */
	static tryCreate(value: string): TicketId | undefined {
		const normalizedValue: string = value.trim();
		const parts: Array<string> = normalizedValue.split(TICKET_SEPARATOR);

		if (parts.length !== TICKET_PARTS_COUNT) {
			return undefined;
		}

		const key: string = parts[0]?.trim() ?? "";
		const numericPart: string = parts[1]?.trim() ?? "";

		if (!isAsciiLettersWithinBounds(key) || !isAsciiDigitsWithinBounds(numericPart)) {
			return undefined;
		}

		return new TicketId(key, numericPart);
	}

	/**
	 * Compare two ticket identifiers.
	 * @param {TicketId} other - Ticket id to compare with.
	 * @returns {boolean} True when both ids are equal.
	 */
	equals(other: TicketId): boolean {
		return this.KEY === other.KEY && this.NUMBER === other.NUMBER;
	}

	/**
	 * Get ticket key part.
	 * @returns {string} Alphabetic key.
	 */
	getKey(): string {
		return this.KEY;
	}

	/**
	 * Get ticket numeric part.
	 * @returns {string} Numeric part.
	 */
	getNumber(): string {
		return this.NUMBER;
	}

	/**
	 * Format ticket id as string.
	 * @returns {string} Ticket id in KEY-NUMBER format.
	 */
	toString(): string {
		return `${this.KEY}${TICKET_SEPARATOR}${this.NUMBER}`;
	}
}

/**
 * Check if value consists only of ASCII digits and matches length constraints.
 * @param {string} value - Candidate value.
 * @returns {boolean} True when value is valid numeric ticket part.
 */
function isAsciiDigitsWithinBounds(value: string): boolean {
	if (value.length < MIN_PART_LENGTH) {
		return false;
	}

	for (const character of value) {
		const isDigit: boolean = character >= "0" && character <= "9";

		if (!isDigit) {
			return false;
		}
	}

	return true;
}

/**
 * Check if value consists only of ASCII letters and matches length constraints.
 * @param {string} value - Candidate value.
 * @returns {boolean} True when value is valid key ticket part.
 */
function isAsciiLettersWithinBounds(value: string): boolean {
	if (value.length < MIN_PART_LENGTH) {
		return false;
	}

	for (const character of value) {
		const isUppercaseLetter: boolean = character >= "A" && character <= "Z";
		const isLowercaseLetter: boolean = character >= "a" && character <= "z";

		if (!isUppercaseLetter && !isLowercaseLetter) {
			return false;
		}
	}

	return true;
}
