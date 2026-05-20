import { CommitMessage } from "@domain/entity/commit-message.entity";
import { CommitBody } from "@domain/value-object/commit-body.value-object";
import { CommitHeader } from "@domain/value-object/commit-header.value-object";

/**
 * Creates a mock CommitMessage with default or custom values
 */
export function createMockCommitMessage(options?: { type?: string; scope?: string; subject?: string; body?: string; breaking?: string }): CommitMessage {
	const { type = "feat", scope = "test", subject = "test commit message", body = "", breaking = "" } = options || {};

	const header = new CommitHeader(type, subject, scope);
	const commitBody = new CommitBody(body, breaking);

	return new CommitMessage(header, commitBody);
}
