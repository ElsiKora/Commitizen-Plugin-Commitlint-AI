import { describe, it, expect } from "vitest";
import { CommitHeader } from "../../../../src/domain/value-object/commit-header.value-object";

describe("CommitHeader", () => {
	describe("constructor", () => {
		it("should create a commit header with type and subject", () => {
			// Act
			const header = new CommitHeader("feat", "add new feature");

			// Assert
			expect(header.getType()).toBe("feat");
			expect(header.getSubject()).toBe("add new feature");
			expect(header.getScope()).toBeUndefined();
		});

		it("should create a commit header with type, subject, and scope", () => {
			// Act
			const header = new CommitHeader("fix", "resolve bug", "auth");

			// Assert
			expect(header.getType()).toBe("fix");
			expect(header.getSubject()).toBe("resolve bug");
			expect(header.getScope()).toBe("auth");
		});

		it("should trim whitespace from all fields", () => {
			// Act
			const header = new CommitHeader("  feat  ", "  add feature  ", "  core  ");

			// Assert
			expect(header.getType()).toBe("feat");
			expect(header.getSubject()).toBe("add feature");
			expect(header.getScope()).toBe("core");
		});

		it("should throw error when type is empty", () => {
			// Act & Assert
			expect(() => new CommitHeader("", "subject")).toThrow("Commit type cannot be empty");
			expect(() => new CommitHeader("   ", "subject")).toThrow("Commit type cannot be empty");
		});

		it("should throw error when subject is empty", () => {
			// Act & Assert
			expect(() => new CommitHeader("feat", "")).toThrow("Commit subject cannot be empty");
			expect(() => new CommitHeader("feat", "   ")).toThrow("Commit subject cannot be empty");
		});

		it("should handle undefined scope", () => {
			// Act
			const header = new CommitHeader("feat", "add feature", undefined);

			// Assert
			expect(header.getScope()).toBeUndefined();
		});

		it("should handle empty scope as empty string", () => {
			// Act
			const header = new CommitHeader("feat", "add feature", "   ");

			// Assert
			expect(header.getScope()).toBe("");
		});
	});

	describe("getType", () => {
		it("should return the commit type", () => {
			// Arrange
			const header = new CommitHeader("refactor", "improve code structure");

			// Act & Assert
			expect(header.getType()).toBe("refactor");
		});
	});

	describe("getSubject", () => {
		it("should return the commit subject", () => {
			// Arrange
			const header = new CommitHeader("docs", "update README");

			// Act & Assert
			expect(header.getSubject()).toBe("update README");
		});
	});

	describe("getScope", () => {
		it("should return the commit scope when present", () => {
			// Arrange
			const header = new CommitHeader("test", "add unit tests", "utils");

			// Act & Assert
			expect(header.getScope()).toBe("utils");
		});

		it("should return undefined when scope is not present", () => {
			// Arrange
			const header = new CommitHeader("chore", "update dependencies");

			// Act & Assert
			expect(header.getScope()).toBeUndefined();
		});
	});

	describe("toString", () => {
		it("should format header without scope", () => {
			// Arrange
			const header = new CommitHeader("feat", "add new feature");

			// Act & Assert
			expect(header.toString()).toBe("feat: add new feature");
		});

		it("should format header with scope", () => {
			// Arrange
			const header = new CommitHeader("fix", "resolve memory leak", "cache");

			// Act & Assert
			expect(header.toString()).toBe("fix(cache): resolve memory leak");
		});

		it("should handle special characters in scope", () => {
			// Arrange
			const header = new CommitHeader("feat", "add feature", "api/v2");

			// Act & Assert
			expect(header.toString()).toBe("feat(api/v2): add feature");
		});
	});

	describe("equals", () => {
		it("should return true for identical headers", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "add feature", "core");
			const header2 = new CommitHeader("feat", "add feature", "core");

			// Act & Assert
			expect(header1.equals(header2)).toBe(true);
		});

		it("should return true for headers without scope", () => {
			// Arrange
			const header1 = new CommitHeader("fix", "bug fix");
			const header2 = new CommitHeader("fix", "bug fix");

			// Act & Assert
			expect(header1.equals(header2)).toBe(true);
		});

		it("should return false for different types", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "add feature");
			const header2 = new CommitHeader("fix", "add feature");

			// Act & Assert
			expect(header1.equals(header2)).toBe(false);
		});

		it("should return false for different subjects", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "add feature");
			const header2 = new CommitHeader("feat", "add functionality");

			// Act & Assert
			expect(header1.equals(header2)).toBe(false);
		});

		it("should return false for different scopes", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "add feature", "core");
			const header2 = new CommitHeader("feat", "add feature", "ui");

			// Act & Assert
			expect(header1.equals(header2)).toBe(false);
		});

		it("should return false when one has scope and other doesn't", () => {
			// Arrange
			const header1 = new CommitHeader("feat", "add feature", "core");
			const header2 = new CommitHeader("feat", "add feature");

			// Act & Assert
			expect(header1.equals(header2)).toBe(false);
		});
	});

	describe("immutability", () => {
		it("should not allow modification of properties", () => {
			// Arrange
			const header = new CommitHeader("feat", "add feature", "core");
			const originalType = header.getType();
			const originalSubject = header.getSubject();
			const originalScope = header.getScope();

			// Act - attempt to modify (this would only work if properties were mutable)
			// No direct way to modify since properties are private

			// Assert - values remain unchanged
			expect(header.getType()).toBe(originalType);
			expect(header.getSubject()).toBe(originalSubject);
			expect(header.getScope()).toBe(originalScope);
		});
	});

	describe("edge cases", () => {
		it("should handle very long subjects", () => {
			// Arrange
			const longSubject = "a".repeat(200);

			// Act
			const header = new CommitHeader("feat", longSubject);

			// Assert
			expect(header.getSubject()).toBe(longSubject);
			expect(header.toString()).toBe(`feat: ${longSubject}`);
		});

		it("should handle special characters in type", () => {
			// Act
			const header = new CommitHeader("feat!", "breaking change");

			// Assert
			expect(header.getType()).toBe("feat!");
			expect(header.toString()).toBe("feat!: breaking change");
		});

		it("should handle unicode characters", () => {
			// Act
			const header = new CommitHeader("feat", "add 🚀 feature", "🔧tools");

			// Assert
			expect(header.getType()).toBe("feat");
			expect(header.getSubject()).toBe("add 🚀 feature");
			expect(header.getScope()).toBe("🔧tools");
			expect(header.toString()).toBe("feat(🔧tools): add 🚀 feature");
		});
	});
});
