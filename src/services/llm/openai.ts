/* eslint-disable @elsikora-typescript/restrict-plus-operands */
import type { CommitConfig, LLMPromptContext } from "./types.js";

import OpenAI from "openai";

export async function generateCommitWithOpenAI(apiKey: string, model: string, context: LLMPromptContext): Promise<CommitConfig> {
	const openai: OpenAI = new OpenAI({
		apiKey: apiKey,
	});

	const typeOptions: string =
		context.typeEnum
			?.map((type: string) => {
				const description: string = context.typeDescriptions?.[type]?.description ?? "";
				const emoji: string = context.typeDescriptions?.[type]?.emoji ?? "";
				const title: string = context.typeDescriptions?.[type]?.title ?? "";

				// eslint-disable-next-line @elsikora-sonar/no-nested-template-literals
				return `${type}${emoji ? ` (${emoji})` : ""}: ${description}${title ? ` (${title})` : ""}`;
			})
			.join("\n") ?? "";

	const systemPrompt: string = `You are a commit message generator. Based on the git changes, generate a conventional commit message that follows the commit conventions.
  
The commit should follow this format:
<type>[(scope)]: <subject>
[BLANK LINE]
[body]
[BLANK LINE]
[footer]

Available types:
${typeOptions}

Scope guidelines:
- The scope should represent the area of the codebase being modified
- If the changes affect multiple areas, use a comma-separated list or select the most significant area
- If unsure, use "global" as the scope
- If the scope is not relevant, it can be omitted
- Analyze the changed files and determine the most appropriate scope based on directories, modules or components
- Scopes are usually short (one or two words) and lowercase

Subject constraints:
${context.subject.case ? "- Case style: " + context.subject.case.join(", ") : ""}
${context.subject.maxLength ? "- Max length: " + context.subject.maxLength + " characters" : ""}
${context.subject.minLength ? "- Min length: " + context.subject.minLength + " characters" : ""}

${context.headerMaxLength ? "Header max length (type + scope + subject): " + context.headerMaxLength + " characters" : ""}
${context.headerMinLength ? "Header min length (type + scope + subject): " + context.headerMinLength + " characters" : ""}

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
}`;

	const userPrompt: string = `Here are the changes to commit:
${context.diff ? `Diff:\n${context.diff}\n` : ""}
${context.files ? `Files changed:\n${context.files}` : ""}

Based on these changes, generate an appropriate commit message following the conventions.`;

	try {
		const response: any = await openai.chat.completions.create({
			messages: [
				{ content: systemPrompt, role: "system" },
				{ content: userPrompt, role: "user" },
			],
			model: model,
			response_format: { type: "json_object" },
		});

		// eslint-disable-next-line @elsikora-typescript/no-unsafe-member-access,@elsikora-typescript/no-unsafe-assignment
		const content: any = response.choices[0]?.message.content;

		if (!content) {
			throw new Error("Empty response from OpenAI");
		}

		// eslint-disable-next-line @elsikora-typescript/no-unsafe-argument
		return JSON.parse(content) as CommitConfig;
	} catch (error) {
		console.error("Error generating commit with OpenAI:", error);

		throw error;
	}
}
