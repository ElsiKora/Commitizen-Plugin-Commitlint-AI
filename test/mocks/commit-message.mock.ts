import { CommitMessage } from "../../src/domain/entity/commit-message.entity";
import { CommitHeader } from "../../src/domain/value-object/commit-header.value-object";
import { CommitBody } from "../../src/domain/value-object/commit-body.value-object";

/**
 * Creates a mock CommitMessage with default or custom values
 */
export function createMockCommitMessage(options?: { type?: string; scope?: string; subject?: string; body?: string; breaking?: string }): CommitMessage {
	const { type = "feat", scope = "test", subject = "test commit message", body = "", breaking = "" } = options || {};

	const header = new CommitHeader(type, subject, scope);
	const commitBody = new CommitBody(body, breaking);

	return new CommitMessage(header, commitBody);
}
