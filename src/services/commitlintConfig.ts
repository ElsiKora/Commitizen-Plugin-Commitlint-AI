import type { QualifiedRules, TargetCaseType, UserPromptConfig } from "@commitlint/types";

import type { LLMPromptContext } from "./llm/types.js";

import { RuleConfigSeverity } from "@commitlint/types";

// eslint-disable-next-line @elsikora/sonar/cognitive-complexity
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

	// Extract type case rules
	if (rules["type-case"] && rules["type-case"][0] !== RuleConfigSeverity.Disabled) {
		const typeCaseRule = rules["type-case"];

		if (typeCaseRule && typeCaseRule.length >= 3) {
			context.typeCase = Array.isArray(typeCaseRule[2]) ? typeCaseRule[2] : [typeCaseRule[2]];
		}
	}

	// Extract type empty rules
	if (rules["type-empty"] && rules["type-empty"][0] !== RuleConfigSeverity.Disabled) {
		const typeEmptyRule = rules["type-empty"];

		if (typeEmptyRule && typeEmptyRule.length >= 2) {
			context.typeEmpty = typeEmptyRule[1] !== "never";
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
			const typeDescriptions: Record<string, { description: string; emoji?: string; title?: string }> = {};

			for (const [key, value] of Object.entries(prompt.questions.type.enum)) {
				typeDescriptions[key] = {
					description: value.description ?? "",
					emoji: value.emoji,
					title: value.title,
				};
			}
			context.typeDescriptions = typeDescriptions;
		}
	}

	// Extract scope case rules
	if (rules["scope-case"] && rules["scope-case"][0] !== RuleConfigSeverity.Disabled) {
		const scopeCaseRule = rules["scope-case"];

		if (scopeCaseRule && scopeCaseRule.length >= 3) {
			context.scopeCase = Array.isArray(scopeCaseRule[2]) ? scopeCaseRule[2] : [scopeCaseRule[2]];
		}
	}

	// Extract scope empty rules
	if (rules["scope-empty"] && rules["scope-empty"][0] !== RuleConfigSeverity.Disabled) {
		const scopeEmptyRule = rules["scope-empty"];

		if (scopeEmptyRule && scopeEmptyRule.length >= 2) {
			context.scopeEmpty = scopeEmptyRule[1] !== "never";
		}
	}

	// Extract scope max length
	if (rules["scope-max-length"] && rules["scope-max-length"][0] !== RuleConfigSeverity.Disabled) {
		const scopeMaxLengthRule = rules["scope-max-length"];

		if (scopeMaxLengthRule && scopeMaxLengthRule.length >= 3 && typeof scopeMaxLengthRule[2] === "number") {
			context.scopeMaxLength = scopeMaxLengthRule[2];
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

		if (subjectCaseRule && subjectCaseRule.length >= 3) {
			context.subject.case = Array.isArray(subjectCaseRule[2]) ? (subjectCaseRule[2] as Array<string>) : [subjectCaseRule[2] as string];
		}
	}

	// Extract subject-empty rules
	if (rules["subject-empty"] && rules["subject-empty"][0] !== RuleConfigSeverity.Disabled) {
		const subjectEmptyRule = rules["subject-empty"];

		if (subjectEmptyRule && subjectEmptyRule.length >= 2) {
			context.subject.empty = subjectEmptyRule[1] !== "never";
		}
	}

	// Extract subject full-stop rules
	if (rules["subject-full-stop"] && rules["subject-full-stop"][0] !== RuleConfigSeverity.Disabled) {
		const subjectFullStopRule = rules["subject-full-stop"];

		if (subjectFullStopRule && subjectFullStopRule.length >= 3) {
			context.subject.fullStop = {
				required: subjectFullStopRule[1] === "always",
				value: subjectFullStopRule[2],
			};
		}
	}

	// Extract scope and subject descriptions from prompt config
	if (prompt.questions?.scope?.description) {
		context.scopeDescription = prompt.questions.scope.description;
	}

	if (prompt.questions?.subject?.description) {
		context.subject.description = prompt.questions.subject.description;
	}

	// Extract header case rules
	if (rules["header-case"] && rules["header-case"][0] !== RuleConfigSeverity.Disabled) {
		const headerCaseRule = rules["header-case"];

		if (headerCaseRule && headerCaseRule.length >= 3) {
			context.headerCase = Array.isArray(headerCaseRule[2]) ? headerCaseRule[2] : [headerCaseRule[2]];
		}
	}

	// Extract header full-stop rules
	if (rules["header-full-stop"] && rules["header-full-stop"][0] !== RuleConfigSeverity.Disabled) {
		const headerFullStopRule = rules["header-full-stop"];

		if (headerFullStopRule && headerFullStopRule.length >= 3) {
			context.headerFullStop = {
				required: headerFullStopRule[1] === "always",
				value: headerFullStopRule[2],
			};
		}
	}

	// Extract header max length
	if (rules["header-max-length"] && rules["header-max-length"][0] !== RuleConfigSeverity.Disabled) {
		const headerMaxLengthRule = rules["header-max-length"];

		if (headerMaxLengthRule && headerMaxLengthRule.length >= 3 && typeof headerMaxLengthRule[2] === "number") {
			context.headerMaxLength = headerMaxLengthRule[2];
		}
	}

	// Extract header min length
	if (rules["header-min-length"] && rules["header-min-length"][0] !== RuleConfigSeverity.Disabled) {
		const headerMinLengthRule = rules["header-min-length"];

		if (headerMinLengthRule && headerMinLengthRule.length >= 3 && typeof headerMinLengthRule[2] === "number") {
			context.headerMinLength = headerMinLengthRule[2];
		}
	}

	// Extract subject max length
	if (rules["subject-max-length"] && rules["subject-max-length"][0] !== RuleConfigSeverity.Disabled) {
		const subjectMaxLengthRule = rules["subject-max-length"];

		if (subjectMaxLengthRule && subjectMaxLengthRule.length >= 3 && typeof subjectMaxLengthRule[2] === "number") {
			context.subject.maxLength = subjectMaxLengthRule[2];
		}
	}

	// Extract subject min length
	if (rules["subject-min-length"] && rules["subject-min-length"][0] !== RuleConfigSeverity.Disabled) {
		const subjectMinLengthRule = rules["subject-min-length"];

		if (subjectMinLengthRule && subjectMinLengthRule.length >= 3 && typeof subjectMinLengthRule[2] === "number") {
			context.subject.minLength = subjectMinLengthRule[2];
		}
	}

	// Extract body related rules
	context.body = {};

	// Body max length
	if (rules["body-max-length"] && rules["body-max-length"][0] !== RuleConfigSeverity.Disabled) {
		const bodyMaxLengthRule = rules["body-max-length"];

		if (bodyMaxLengthRule && bodyMaxLengthRule.length >= 3 && typeof bodyMaxLengthRule[2] === "number") {
			context.body.maxLength = bodyMaxLengthRule[2];
		}
	}

	// Body max line length
	if (rules["body-max-line-length"] && rules["body-max-line-length"][0] !== RuleConfigSeverity.Disabled) {
		const bodyMaxLineLengthRule = rules["body-max-line-length"];

		if (bodyMaxLineLengthRule && bodyMaxLineLengthRule.length >= 3 && typeof bodyMaxLineLengthRule[2] === "number") {
			context.body.maxLineLength = bodyMaxLineLengthRule[2];
		}
	}

	// Body full-stop
	if (rules["body-full-stop"] && rules["body-full-stop"][0] !== RuleConfigSeverity.Disabled) {
		const bodyFullStopRule = rules["body-full-stop"];

		if (bodyFullStopRule && bodyFullStopRule.length >= 3) {
			context.body.fullStop = {
				required: bodyFullStopRule[1] === "always",
				value: bodyFullStopRule[2],
			};
		}
	}

	// Body-leading-blank
	if (rules["body-leading-blank"] && rules["body-leading-blank"][0] !== RuleConfigSeverity.Disabled) {
		const bodyLeadingBlankRule: readonly [RuleConfigSeverity, "always" | "never"] | readonly [RuleConfigSeverity.Disabled] | undefined = rules["body-leading-blank"];

		if (bodyLeadingBlankRule && bodyLeadingBlankRule.length >= 2) {
			context.body.leadingBlank = bodyLeadingBlankRule[1] === "always";
		}
	}

	// Footer-leading-blank
	if (rules["footer-leading-blank"] && rules["footer-leading-blank"][0] !== RuleConfigSeverity.Disabled) {
		const footerLeadingBlankRule = rules["footer-leading-blank"];

		if (footerLeadingBlankRule && footerLeadingBlankRule.length >= 2) {
			context.footerLeadingBlank = footerLeadingBlankRule[1] === "always";
		}
	}

	// Footer-max-line-length
	if (rules["footer-max-line-length"] && rules["footer-max-line-length"][0] !== RuleConfigSeverity.Disabled) {
		const footerMaxLineLengthRule = rules["footer-max-line-length"];

		if (footerMaxLineLengthRule && footerMaxLineLengthRule.length >= 3 && typeof footerMaxLineLengthRule[2] === "number") {
			context.footerMaxLineLength = footerMaxLineLengthRule[2];
		}
	}

	return context;
}
