import { describe, expect, it } from "vitest";

import { CommitMessage } from "@domain/entity/commit-message.entity";
import { CommitBody } from "@domain/value-object/commit-body.value-object";
import { CommitHeader } from "@domain/value-object/commit-header.value-object";

describe("CommitMessage", () => {
	describe("constructor", () => {
		it("should create a commit message with header and body", () => {
			const header: CommitHeader = new CommitHeader("feat", "add new feature", "auth");
			const body: CommitBody = new CommitBody("This is a detailed description", "API endpoints have changed");
			const commitMessage: CommitMessage = new CommitMessage(header, body);

			expect(commitMessage.getHeader()).toBe(header);
			expect(commitMessage.getBody()).toBe(body);
		});
	});

	describe("getHeader", () => {
		it("should return the commit header", () => {
			const header: CommitHeader = new CommitHeader("fix", "resolve bug");
			const body: CommitBody = new CommitBody();
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const currentHeader: CommitHeader = commitMessage.getHeader();

			expect(currentHeader).toBe(header);
			expect(currentHeader.getType()).toBe("fix");
			expect(currentHeader.getSubject()).toBe("resolve bug");
		});
	});

	describe("getBody", () => {
		it("should return the commit body", () => {
			const header: CommitHeader = new CommitHeader("docs", "update README");
			const body: CommitBody = new CommitBody("Added installation instructions");
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const currentBody: CommitBody = commitMessage.getBody();

			expect(currentBody).toBe(body);
			expect(currentBody.getContent()).toBe("Added installation instructions");
		});
	});

	describe("isBreakingChange", () => {
		it("should return true when body has breaking change", () => {
			const header: CommitHeader = new CommitHeader("feat", "new API");
			const body: CommitBody = new CommitBody("New implementation", "Old API is removed");
			const commitMessage: CommitMessage = new CommitMessage(header, body);

			expect(commitMessage.isBreakingChange()).toBe(true);
		});

		it("should return false when body has no breaking change", () => {
			const header: CommitHeader = new CommitHeader("feat", "new feature");
			const body: CommitBody = new CommitBody("Added new functionality");
			const commitMessage: CommitMessage = new CommitMessage(header, body);

			expect(commitMessage.isBreakingChange()).toBe(false);
		});
	});

	describe("toString", () => {
		it("should format commit message with header only when body is empty", () => {
			const header: CommitHeader = new CommitHeader("chore", "update dependencies");
			const body: CommitBody = new CommitBody();
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const formattedMessage: string = commitMessage.toString();

			expect(formattedMessage).toBe("chore: update dependencies");
		});

		it("should format commit message with header and body", () => {
			const header: CommitHeader = new CommitHeader("feat", "add authentication", "auth");
			const body: CommitBody = new CommitBody("Implemented OAuth2 authentication flow");
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const formattedMessage: string = commitMessage.toString();

			expect(formattedMessage).toBe("feat(auth): add authentication\n\nImplemented OAuth2 authentication flow");
		});

		it("should format commit message with header, body, and breaking change", () => {
			const header: CommitHeader = new CommitHeader("refactor", "redesign API", "api");
			const body: CommitBody = new CommitBody("Complete API redesign", "All endpoints have changed");
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const formattedMessage: string = commitMessage.toString();

			expect(formattedMessage).toBe("refactor(api): redesign API\n\nBREAKING CHANGE: All endpoints have changed\n\nComplete API redesign");
		});

		it("should format commit message with footer as a separate section", () => {
			const header: CommitHeader = new CommitHeader("fix", "resolve auth bug", "auth");
			const body: CommitBody = new CommitBody("Adjusted token refresh logic", undefined, "Refs CAS-25.");
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const formattedMessage: string = commitMessage.toString();

			expect(formattedMessage).toBe("fix(auth): resolve auth bug\n\nAdjusted token refresh logic\n\nRefs CAS-25.");
		});

		it("should keep footer after breaking change and body", () => {
			const header: CommitHeader = new CommitHeader("feat", "introduce new auth flow", "auth");
			const body: CommitBody = new CommitBody("Added session handoff support", "Token format changed", "Refs CAS-44.");
			const commitMessage: CommitMessage = new CommitMessage(header, body);
			const formattedMessage: string = commitMessage.toString();

			expect(formattedMessage).toBe("feat(auth): introduce new auth flow\n\nBREAKING CHANGE: Token format changed\n\nAdded session handoff support\n\nRefs CAS-44.");
		});
	});

	describe("withBody", () => {
		it("should create a new commit message with updated body", () => {
			const header: CommitHeader = new CommitHeader("test", "add tests");
			const originalBody: CommitBody = new CommitBody("Initial tests");
			const nextBody: CommitBody = new CommitBody("Comprehensive test suite");
			const originalMessage: CommitMessage = new CommitMessage(header, originalBody);
			const nextMessage: CommitMessage = originalMessage.withBody(nextBody);

			expect(nextMessage).not.toBe(originalMessage);
			expect(nextMessage.getHeader()).toBe(header);
			expect(nextMessage.getBody()).toBe(nextBody);
			expect(originalMessage.getBody()).toBe(originalBody);
		});
	});

	describe("withHeader", () => {
		it("should create a new commit message with updated header", () => {
			const originalHeader: CommitHeader = new CommitHeader("feat", "initial feature");
			const nextHeader: CommitHeader = new CommitHeader("fix", "bug fix");
			const body: CommitBody = new CommitBody("Some changes");
			const originalMessage: CommitMessage = new CommitMessage(originalHeader, body);
			const nextMessage: CommitMessage = originalMessage.withHeader(nextHeader);

			expect(nextMessage).not.toBe(originalMessage);
			expect(nextMessage.getHeader()).toBe(nextHeader);
			expect(nextMessage.getBody()).toBe(body);
			expect(originalMessage.getHeader()).toBe(originalHeader);
		});
	});

	describe("immutability", () => {
		it("should maintain immutability when creating new instances", () => {
			const headerOne: CommitHeader = new CommitHeader("feat", "feature 1");
			const headerTwo: CommitHeader = new CommitHeader("fix", "fix 1");
			const bodyOne: CommitBody = new CommitBody("Body 1");
			const bodyTwo: CommitBody = new CommitBody("Body 2");
			const messageOne: CommitMessage = new CommitMessage(headerOne, bodyOne);
			const messageTwo: CommitMessage = messageOne.withHeader(headerTwo);
			const messageThree: CommitMessage = messageTwo.withBody(bodyTwo);

			expect(messageOne.getHeader()).toBe(headerOne);
			expect(messageOne.getBody()).toBe(bodyOne);
			expect(messageTwo.getHeader()).toBe(headerTwo);
			expect(messageTwo.getBody()).toBe(bodyOne);
			expect(messageThree.getHeader()).toBe(headerTwo);
			expect(messageThree.getBody()).toBe(bodyTwo);
		});
	});
});
