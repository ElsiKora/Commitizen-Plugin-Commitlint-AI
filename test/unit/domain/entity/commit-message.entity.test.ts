import { describe, it, expect } from "vitest";
import { CommitMessage } from "../../../../src/domain/entity/commit-message.entity";
import { CommitHeader } from "../../../../src/domain/value-object/commit-header.value-object";
import { CommitBody } from "../../../../src/domain/value-object/commit-body.value-object";

describe("CommitMessage", () => {
	describe("constructor", () => {
		it("should create a commit message with header and body", () => {
			// Arrange
			const header = new CommitHeader("feat", "add new feature", "auth");
			const body = new CommitBody("This is a detailed description", "API endpoints have changed");

			// Act
			const commitMessage = new CommitMessage(header, body);

			// Assert
			expect(commitMessage.getHeader()).toBe(header);
			expect(commitMessage.getBody()).toBe(body);
		});
	});

	describe("getHeader", () => {
		it("should return the commit header", () => {
			// Arrange
			const header = new CommitHeader("fix", "resolve bug");
			const body = new CommitBody();
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.getHeader();

			// Assert
			expect(result).toBe(header);
			expect(result.getType()).toBe("fix");
			expect(result.getSubject()).toBe("resolve bug");
		});
	});

	describe("getBody", () => {
		it("should return the commit body", () => {
			// Arrange
			const header = new CommitHeader("docs", "update README");
			const body = new CommitBody("Added installation instructions");
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.getBody();

			// Assert
			expect(result).toBe(body);
			expect(result.getContent()).toBe("Added installation instructions");
		});
	});

	describe("isBreakingChange", () => {
		it("should return true when body has breaking change", () => {
			// Arrange
			const header = new CommitHeader("feat", "new API");
			const body = new CommitBody("New implementation", "Old API is removed");
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.isBreakingChange();

			// Assert
			expect(result).toBe(true);
		});

		it("should return false when body has no breaking change", () => {
			// Arrange
			const header = new CommitHeader("feat", "new feature");
			const body = new CommitBody("Added new functionality");
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.isBreakingChange();

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("toString", () => {
		it("should format commit message with header only when body is empty", () => {
			// Arrange
			const header = new CommitHeader("chore", "update dependencies");
			const body = new CommitBody();
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.toString();

			// Assert
			expect(result).toBe("chore: update dependencies");
		});

		it("should format commit message with header and body", () => {
			// Arrange
			const header = new CommitHeader("feat", "add authentication", "auth");
			const body = new CommitBody("Implemented OAuth2 authentication flow");
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.toString();

			// Assert
			expect(result).toBe("feat(auth): add authentication\n\nImplemented OAuth2 authentication flow");
		});

		it("should format commit message with header, body, and breaking change", () => {
			// Arrange
			const header = new CommitHeader("refactor", "redesign API", "api");
			const body = new CommitBody("Complete API redesign", "All endpoints have changed");
			const commitMessage = new CommitMessage(header, body);

			// Act
			const result = commitMessage.toString();

			// Assert
			expect(result).toBe("refactor(api): redesign API\n\nBREAKING CHANGE: All endpoints have changed\n\nComplete API redesign");
		});
	});

	describe("withBody", () => {
		it("should create a new commit message with updated body", () => {
			// Arrange
			const header = new CommitHeader("test", "add tests");
			const originalBody = new CommitBody("Initial tests");
			const newBody = new CommitBody("Comprehensive test suite");
			const originalMessage = new CommitMessage(header, originalBody);

			// Act
			const newMessage = originalMessage.withBody(newBody);

			// Assert
			expect(newMessage).not.toBe(originalMessage);
			expect(newMessage.getHeader()).toBe(header);
			expect(newMessage.getBody()).toBe(newBody);
			expect(originalMessage.getBody()).toBe(originalBody);
		});
	});

	describe("withHeader", () => {
		it("should create a new commit message with updated header", () => {
			// Arrange
			const originalHeader = new CommitHeader("feat", "initial feature");
			const newHeader = new CommitHeader("fix", "bug fix");
			const body = new CommitBody("Some changes");
			const originalMessage = new CommitMessage(originalHeader, body);

			// Act
			const newMessage = originalMessage.withHeader(newHeader);

			// Assert
			expect(newMessage).not.toBe(originalMessage);
			expect(newMessage.getHeader()).toBe(newHeader);
			expect(newMessage.getBody()).toBe(body);
			expect(originalMessage.getHeader()).toBe(originalHeader);
		});
	});

	describe("immutability", () => {
		it("should maintain immutability when creating new instances", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "feature 1");
			const header2 = new CommitHeader("fix", "fix 1");
			const body1 = new CommitBody("Body 1");
			const body2 = new CommitBody("Body 2");
			const message1 = new CommitMessage(header1, body1);

			// Act
			const message2 = message1.withHeader(header2);
			const message3 = message2.withBody(body2);

			// Assert
			expect(message1.getHeader()).toBe(header1);
			expect(message1.getBody()).toBe(body1);
			expect(message2.getHeader()).toBe(header2);
			expect(message2.getBody()).toBe(body1);
			expect(message3.getHeader()).toBe(header2);
			expect(message3.getBody()).toBe(body2);
		});
	});
});
