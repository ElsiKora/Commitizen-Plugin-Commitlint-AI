/* eslint-disable @elsikora-typescript/restrict-plus-operands,@elsikora-sonar/no-nested-conditional */

import type { CommitConfig, LLMPromptContext } from "./types.js";

import Anthropic from "@anthropic-ai/sdk";

export async function generateCommitWithAnthropic(apiKey: string, model: string, context: LLMPromptContext): Promise<CommitConfig> {
	const anthropic: Anthropic = new Anthropic({
		apiKey: apiKey,
	});

	// eslint-disable-next-line @elsikora-typescript/typedef
	const typeOptions =
		context.typeEnum
			?.map((type: string) => {
				const description: string = context.typeDescriptions?.[type]?.description ?? "";
				const emoji: string = context.typeDescriptions?.[type]?.emoji ?? "";
				const title: string = context.typeDescriptions?.[type]?.title ?? "";

				// eslint-disable-next-line @elsikora-sonar/no-nested-template-literals
				return `${type}${emoji ? ` (${emoji})` : ""}: ${description}${title ? ` (${title})` : ""}`;
			})
			.join("\n") ?? "";

	const systemPrompt: string = `You are a commit message generator. Your task is to create a conventional commit message based on the git changes provided.`;

	const userPrompt: string = `I need you to generate a commit message for these changes:
${context.diff ? `Diff:\n${context.diff}\n` : ""}
${context.files ? `Files changed:\n${context.files}` : ""}

The commit should follow this format:
<type>[(scope)]: <subject>
[BLANK LINE]
[body]
[BLANK LINE]
[footer]

Type constraints:
${context.typeEnum ? "- Allowed types: " + context.typeEnum.join(", ") : ""}
${context.typeCase ? "- Case style: " + context.typeCase.join(", ") : ""}
${context.typeEmpty === undefined ? "" : "- Can be empty: " + (context.typeEmpty ? "yes" : "no")}

Available types:
${typeOptions}

Scope constraints:
${context.scopeCase ? "- Case style: " + context.scopeCase.join(", ") : ""}
${context.scopeEmpty === undefined ? "" : "- Can be empty: " + (context.scopeEmpty ? "yes" : "no")}
${context.scopeMaxLength ? "- Max length: " + context.scopeMaxLength + " characters" : ""}

Scope guidelines:
- The scope should represent the area of the codebase being modified
- If the changes affect multiple areas, use a comma-separated list or select the most significant area
- If unsure, use "global" as the scope
- If the scope is not relevant, it can be omitted
- Analyze the changed files and determine the most appropriate scope based on directories, modules or components
- Scopes are usually short (one or two words) and lowercase

Subject constraints:
${context.subject.case ? "- Case style: " + context.subject.case.join(", ") : ""}
${context.subject.empty === undefined ? "" : "- Can be empty: " + (context.subject.empty ? "yes" : "no")}
${context.subject.maxLength ? "- Max length: " + context.subject.maxLength + " characters" : ""}
${context.subject.minLength ? "- Min length: " + context.subject.minLength + " characters" : ""}
${context.subject.fullStop ? "- End with '" + context.subject.fullStop.value + "': " + (context.subject.fullStop.required ? "yes" : "no") : ""}

Header constraints:
${context.headerCase ? "- Case style: " + context.headerCase.join(", ") : ""}
${context.headerMaxLength ? "- Max length: " + context.headerMaxLength + " characters" : ""}
${context.headerMinLength ? "- Min length: " + context.headerMinLength + " characters" : ""}
${context.headerFullStop ? "- End with '" + context.headerFullStop.value + "': " + (context.headerFullStop.required ? "yes" : "no") : ""}

Body constraints:
${context.body?.maxLength ? "- Max length: " + context.body.maxLength + " characters" : ""}
${context.body?.maxLineLength ? "- Max line length: " + context.body.maxLineLength + " characters" : ""}
${context.body?.leadingBlank === undefined ? "" : "- Leading blank line: " + (context.body.leadingBlank ? "required" : "not required")}
${context.body?.fullStop ? "- End with '" + context.body.fullStop.value + "': " + (context.body.fullStop.required ? "yes" : "no") : ""}

Footer constraints:
${context.footerLeadingBlank === undefined ? "" : "- Leading blank line: " + (context.footerLeadingBlank ? "required" : "not required")}
${context.footerMaxLineLength ? "- Max line length: " + context.footerMaxLineLength + " characters" : ""}

Return a JSON object with these fields:
{
  "type": "the commit type",
  "scope": "the commit scope (optional)",
  "subject": "the commit subject line",
  "body": "the commit body (optional)",
  "isBreaking": boolean,
  "breakingBody": "description of breaking changes (if isBreaking is true)",
  "issues": ["list of issue references"],
  "references": ["list of other references"]
}

The JSON object should be parseable and follow the structure outlined above.`;

	try {
		const response: any = await anthropic.messages.create({
			// eslint-disable-next-line @elsikora-typescript/no-magic-numbers
			max_tokens: 2048,
			messages: [{ content: userPrompt, role: "user" }],
			model: model,
			system: systemPrompt,
		});

		// eslint-disable-next-line @elsikora-typescript/no-unsafe-member-access,@elsikora-typescript/no-unsafe-assignment
		const content: any = response.content[0]?.text;

		if (!content) {
			throw new Error("Empty response from Anthropic");
		}

		// Extract JSON from response
		// eslint-disable-next-line @elsikora-typescript/no-unsafe-assignment,@elsikora-typescript/no-unsafe-call,@elsikora-typescript/no-unsafe-member-access,@elsikora-sonar/slow-regex
		const jsonMatch: any = content.match(/\{[\s\S]*\}/);

		if (!jsonMatch) {
			throw new Error("No JSON found in Anthropic response");
		}

		// eslint-disable-next-line @elsikora-typescript/no-unsafe-argument,@elsikora-typescript/no-unsafe-member-access
		return JSON.parse(jsonMatch[0]) as CommitConfig;
	} catch (error) {
		console.error("Error generating commit with Anthropic:", error);

		throw error;
	}
}
