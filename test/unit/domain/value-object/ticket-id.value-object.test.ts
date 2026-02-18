import { describe, expect, it } from "vitest";

import { TicketId } from "../../../../src/domain/value-object/ticket-id.value-object";

describe("TicketId", () => {
	describe("tryCreate", () => {
		it("creates ticket id for valid uppercase key", () => {
			const ticketId: TicketId | undefined = TicketId.tryCreate("LINER-123");

			expect(ticketId?.toString()).toBe("LINER-123");
		});

		it("creates ticket id for valid lowercase key", () => {
			const ticketId: TicketId | undefined = TicketId.tryCreate("cas-25");

			expect(ticketId?.toString()).toBe("cas-25");
		});

		it("trims surrounding whitespace", () => {
			const ticketId: TicketId | undefined = TicketId.tryCreate("  LINER-9  ");

			expect(ticketId?.toString()).toBe("LINER-9");
		});

		it("accepts long key and number lengths", () => {
			const ticketId: TicketId | undefined = TicketId.tryCreate("SUPERLONGPROJECTKEY-123456789012345");

			expect(ticketId?.toString()).toBe("SUPERLONGPROJECTKEY-123456789012345");
		});

		it("returns undefined for non-digit number part", () => {
			expect(TicketId.tryCreate("LINER-12A")).toBeUndefined();
		});

		it("returns undefined when separator is missing", () => {
			expect(TicketId.tryCreate("LINER123")).toBeUndefined();
		});
	});

	describe("value behavior", () => {
		it("returns key and number parts", () => {
			const maybeTicketId: TicketId | undefined = TicketId.tryCreate("LINER-42");

			if (!maybeTicketId) {
				throw new Error("Expected ticket id to be created");
			}

			expect(maybeTicketId.getKey()).toBe("LINER");
			expect(maybeTicketId.getNumber()).toBe("42");
		});

		it("compares by value", () => {
			const firstMaybe: TicketId | undefined = TicketId.tryCreate("LINER-42");
			const secondMaybe: TicketId | undefined = TicketId.tryCreate("LINER-42");
			const thirdMaybe: TicketId | undefined = TicketId.tryCreate("LINER-43");

			if (!firstMaybe || !secondMaybe || !thirdMaybe) {
				throw new Error("Expected ticket ids to be created");
			}

			expect(firstMaybe.equals(secondMaybe)).toBe(true);
			expect(firstMaybe.equals(thirdMaybe)).toBe(false);
		});
	});
});
