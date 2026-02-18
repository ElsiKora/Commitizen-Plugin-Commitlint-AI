import { describe, expect, it } from "vitest";

import { CommitMessage } from "../../../../src/domain/entity/commit-message.entity";
import { addTicketIdToCommitMessage } from "../../../../src/domain/helper/add-ticket-to-commit.helper";
import { CommitBody } from "../../../../src/domain/value-object/commit-body.value-object";
import { CommitHeader } from "../../../../src/domain/value-object/commit-header.value-object";

describe("addTicketIdToCommitMessage", () => {
	it("adds ticket reference when footer is empty", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("feat", "add search", "core"), new CommitBody("body"));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "CAS-25");

		expect(updated.getBody().getFooter()).toBe("Refs CAS-25.");
	});

	it("appends ticket reference when footer exists", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("fix", "resolve bug", "api"), new CommitBody("body", undefined, "Closes #10"));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "CAS-25");

		expect(updated.getBody().getFooter()).toBe("Closes #10\nRefs CAS-25.");
	});

	it("does not duplicate the same ticket reference", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("fix", "resolve bug", "api"), new CommitBody("body", undefined, "Closes #10\nRefs CAS-25."));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "CAS-25");

		expect(updated.getBody().getFooter()).toBe("Closes #10\nRefs CAS-25.");
	});

	it("does not duplicate legacy ticket reference without colon", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("fix", "resolve bug", "api"), new CommitBody("body", undefined, "Closes #10\nRefs CAS-25"));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "CAS-25");

		expect(updated.getBody().getFooter()).toBe("Closes #10\nRefs CAS-25");
	});

	it("does not duplicate hash-based legacy ticket reference", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("fix", "resolve bug", "api"), new CommitBody("body", undefined, "Closes #10\nRefs #CAS-25"));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "CAS-25");

		expect(updated.getBody().getFooter()).toBe("Closes #10\nRefs #CAS-25");
	});

	it("normalizes extra whitespace around ticket id", () => {
		const message: CommitMessage = new CommitMessage(new CommitHeader("fix", "resolve bug", "api"), new CommitBody("body"));

		const updated: CommitMessage = addTicketIdToCommitMessage(message, "  CAS-25  ");

		expect(updated.getBody().getFooter()).toBe("Refs CAS-25.");
	});
});
