import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";

import type { ILlmPromptContext } from "../interface/llm-service.interface.js";

/**
 * Service for extracting LLM prompt context from commitlint configuration
 */
export class PromptContextExtractorService {
	// eslint-disable-next-line @elsikora/typescript/no-magic-numbers
	private readonly TYPE_ENUM_INDEX: number = 2;

	/**
	 * Extract LLM prompt context from commitlint rules and prompts
	 * @param {QualifiedRules} rules - The commitlint rules
	 * @param {UserPromptConfig} prompts - The user prompt configuration
	 * @returns {ILlmPromptContext} The extracted LLM prompt context
	 */
	extractContext(rules: QualifiedRules, prompts: UserPromptConfig): ILlmPromptContext {
		const context: ILlmPromptContext = {
			rules: rules,
			subject: {},
		};

		// Extract type information
		if (rules["type-enum"]) {
			const types: unknown = rules["type-enum"][this.TYPE_ENUM_INDEX];

			if (Array.isArray(types)) {
				context.typeEnum = types as Array<string>;
			}
		}

		// Extract type descriptions from prompts
		if (prompts.questions?.type?.enum) {
			context.typeDescriptions = {};

			for (const [key, value] of Object.entries(prompts.questions.type.enum)) {
				if (typeof value === "object" && value && "description" in value && typeof value.description === "string") {
					interface ITypeEnumValue {
						description: string;
						emoji?: string;
					}
					const enumValue: ITypeEnumValue = value as ITypeEnumValue;
					context.typeDescriptions[key] = {
						description: enumValue.description,
						emoji: enumValue.emoji,
					};
				}
			}
		}

		// Extract subject rules
		if (rules["subject-max-length"]) {
			const maxLength: unknown = rules["subject-max-length"][this.TYPE_ENUM_INDEX];

			if (typeof maxLength === "number") {
				context.subject.maxLength = maxLength;
			}
		}

		if (rules["subject-min-length"]) {
			const minLength: unknown = rules["subject-min-length"][this.TYPE_ENUM_INDEX];

			if (typeof minLength === "number") {
				context.subject.minLength = minLength;
			}
		}

		// Add descriptions from prompts
		if (prompts.questions?.type?.description) {
			context.typeDescription = prompts.questions.type.description;
		}

		if (prompts.questions?.scope?.description) {
			context.scopeDescription = prompts.questions.scope.description;
		}

		if (prompts.questions?.subject?.description) {
			context.subject.description = prompts.questions.subject.description;
		}

		if (prompts.questions?.body?.description) {
			context.body = {
				description: prompts.questions.body.description,
			};
		}

		return context;
	}
}
