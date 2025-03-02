/* eslint-disable @elsikora-typescript/no-magic-numbers,@elsikora-typescript/no-unsafe-member-access */
import type { QualifiedRules, TargetCaseType, UserPromptConfig } from "@commitlint/types";

import type { LLMPromptContext } from "./llm/types.js";

// eslint-disable-next-line no-duplicate-imports
import { RuleConfigSeverity } from "@commitlint/types";

export function extractLLMPromptContext(rules: QualifiedRules, prompt: UserPromptConfig): LLMPromptContext {
	const context: LLMPromptContext = {
		subject: {},
	};

	// Extract type enum
	if (rules["type-enum"] && rules["type-enum"][0] !== RuleConfigSeverity.Disabled) {
		const typeEnumRule: readonly [RuleConfigSeverity, "always" | "never", Array<string>] | readonly [RuleConfigSeverity.Disabled] | undefined = rules["type-enum"];

		if (typeEnumRule && typeEnumRule.length >= 3 && Array.isArray(typeEnumRule[2])) {
			context.typeEnum = typeEnumRule[2];
		}
	}

	// Extract type descriptions from prompt config
	if (prompt.questions?.type) {
		// Get the type description
		if (prompt.questions.type.description) {
			context.typeDescription = prompt.questions.type.description;
		}

		// Get the enum descriptions
		if (prompt.questions.type.enum) {
			// @ts-ignore
			context.typeDescriptions = prompt.questions.type.enum;
		}
	}

	// Extract case function options for subject
	if (rules["subject-case"] && rules["subject-case"][0] !== RuleConfigSeverity.Disabled) {
		const subjectCaseRule:
			| readonly [RuleConfigSeverity, "always" | "never", "camel-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "kebab-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "lower-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "lowercase"]
			| readonly [RuleConfigSeverity, "always" | "never", "lowerCase"]
			| readonly [RuleConfigSeverity, "always" | "never", "pascal-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "sentence-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "sentencecase"]
			| readonly [RuleConfigSeverity, "always" | "never", "snake-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "start-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "upper-case"]
			| readonly [RuleConfigSeverity, "always" | "never", "uppercase"]
			| readonly [RuleConfigSeverity, "always" | "never", Array<TargetCaseType>]
			| readonly [RuleConfigSeverity.Disabled]
			| undefined = rules["subject-case"];

		if (subjectCaseRule && subjectCaseRule.length >= 3 && Array.isArray(subjectCaseRule[2])) {
			context.subject.case = subjectCaseRule[2] as Array<string>;
		}
	}

	// Extract scope and subject descriptions from prompt config
	if (prompt.questions?.scope?.description) {
		context.scopeDescription = prompt.questions.scope.description;
	}

	if (prompt.questions?.subject?.description) {
		context.subject.description = prompt.questions.subject.description;
	}

	// Extract header max length
	if (rules.header && rules.header[0] !== RuleConfigSeverity.Disabled) {
		const headerRule: any = rules.header;

		if (headerRule && headerRule.length >= 3) {
			if (typeof headerRule[2] === "object" && headerRule[2] !== null) {
				if ("max" in headerRule[2]) {
					context.headerMaxLength = (headerRule[2] as { max?: number }).max;
				}

				if ("min" in headerRule[2]) {
					context.headerMinLength = (headerRule[2] as { min?: number }).min;
				}
			} else if (typeof headerRule[2] === "number") {
				if (headerRule[1] === "max") {
					context.headerMaxLength = headerRule[2];
				} else if (headerRule[1] === "min") {
					context.headerMinLength = headerRule[2];
				}
			}
		}
	}

	// Extract subject max/min length
	if (rules.subject && rules.subject[0] !== RuleConfigSeverity.Disabled) {
		const subjectRule: any = rules.subject;

		if (subjectRule && subjectRule.length >= 3) {
			if (typeof subjectRule[2] === "object" && subjectRule[2] !== null) {
				if ("max" in subjectRule[2]) {
					context.subject.maxLength = (subjectRule[2] as { max?: number }).max;
				}

				if ("min" in subjectRule[2]) {
					context.subject.minLength = (subjectRule[2] as { min?: number }).min;
				}
			} else if (typeof subjectRule[2] === "number") {
				if (subjectRule[1] === "max") {
					context.subject.maxLength = subjectRule[2];
				} else if (subjectRule[1] === "min") {
					context.subject.minLength = subjectRule[2];
				}
			}
		}
	}

	// Extract body related rules
	context.body = {};

	// Body max/min length
	if (rules.body && rules.body[0] !== RuleConfigSeverity.Disabled) {
		const bodyRule: any = rules.body;

		if (bodyRule && bodyRule.length >= 3) {
			if (typeof bodyRule[2] === "object" && bodyRule[2] !== null) {
				if ("max" in bodyRule[2]) {
					context.body.maxLength = (bodyRule[2] as { max?: number }).max;
				}

				if ("min" in bodyRule[2]) {
					context.body.minLength = (bodyRule[2] as { min?: number }).min;
				}
			} else if (typeof bodyRule[2] === "number") {
				if (bodyRule[1] === "max") {
					context.body.maxLength = bodyRule[2];
				} else if (bodyRule[1] === "min") {
					context.body.minLength = bodyRule[2];
				}
			}
		}
	}

	// Body-leading-blank
	if (rules["body-leading-blank"] && rules["body-leading-blank"][0] !== RuleConfigSeverity.Disabled) {
		const bodyLeadingBlankRule: readonly [RuleConfigSeverity, "always" | "never"] | readonly [RuleConfigSeverity.Disabled] | undefined = rules["body-leading-blank"];

		if (bodyLeadingBlankRule && bodyLeadingBlankRule.length >= 2) {
			context.body.leadingBlank = bodyLeadingBlankRule[1] === "always";
		}
	}

	return context;
}
