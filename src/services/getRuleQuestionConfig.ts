import type { RuleConfigSeverity, RuleField } from "@commitlint/types";

import type { QuestionConfig } from "../Question.js";

import { getPromptMessages, getPromptQuestions } from "../store/prompts.js";
import { getRule } from "../store/rules.js";
import getCaseFunction from "../utils/case-function.js";
import getFullStopFunction from "../utils/full-stop-function.js";
import { enumRuleIsActive, getEnumList, getMaxLength, getMinLength, ruleIsActive, ruleIsApplicable, ruleIsDisabled } from "../utils/rules.js";

export default function getRuleQuestionConfig(rulePrefix: RuleField): null | QuestionConfig {
	const questions: Readonly<
		Partial<
			Record<
				"body" | "breaking" | "breakingBody" | "footer" | "header" | "isBreaking" | "isIssueAffected" | "issues" | "issuesBody" | "scope" | "subject" | "type",
				{
					description?: string;
					enum?: Record<string, { description?: string; emoji?: string; title?: string }>;
					messages?: Record<string, string>;
				}
			>
		>
	> = getPromptQuestions();

	const questionSettings:
		| {
				description?: string;
				enum?: Record<string, { description?: string; emoji?: string; title?: string }>;
				messages?: Record<string, string>;
		  }
		| undefined = questions[rulePrefix];
	const emptyRule: readonly [RuleConfigSeverity, "always" | "never", unknown] | readonly [RuleConfigSeverity, "always" | "never"] | readonly [RuleConfigSeverity.Disabled] | undefined = getRule(rulePrefix, "empty");

	const mustBeEmpty: boolean = Boolean(emptyRule && ruleIsActive(emptyRule) && ruleIsApplicable(emptyRule));

	if (mustBeEmpty) {
		return null;
	}

	const canBeSkip: boolean = !emptyRule || ruleIsDisabled(emptyRule);

	const enumRule: readonly [RuleConfigSeverity, "always" | "never", unknown] | readonly [RuleConfigSeverity, "always" | "never"] | readonly [RuleConfigSeverity.Disabled] | undefined = getRule(rulePrefix, "enum");

	const enumRuleList: Array<string> | null = enumRule && enumRuleIsActive(enumRule) ? getEnumList(enumRule) : null;
	let enumList: Array<{ name: string; short: string; value: string } | string> = [];

	if (enumRuleList) {
		const enumDescriptions: Record<string, { description?: string; emoji?: string; title?: string }> | undefined = questionSettings?.enum;

		if (enumDescriptions) {
			const enumNames: Array<string> = Object.keys(enumDescriptions);

			const longest: number = Math.max(...enumRuleList.map((enumName: string) => enumName.length));
			// eslint-disable-next-line @elsikora/sonar/no-misleading-array-reverse
			enumList = enumRuleList
				.sort((a: string, b: string) => enumNames.indexOf(a) - enumNames.indexOf(b))
				// eslint-disable-next-line @elsikora/sonar/function-return-type
				.map((enumName: string) => {
					const enumDescription: string | undefined = enumDescriptions[enumName]?.description;

					return enumDescription
						? {
								name: `${enumName}:`.padEnd(longest + 4) + enumDescription,
								short: enumName,
								value: enumName,
							}
						: enumName;
				});
		} else {
			enumList = [...enumRuleList];
		}
	}

	return {
		caseFn: getCaseFunction(getRule(rulePrefix, "case")),
		enumList,
		fullStopFn: getFullStopFunction(getRule(rulePrefix, "full-stop")),
		maxLength: getMaxLength(getRule(rulePrefix, "max-length")),
		messages: getPromptMessages(),
		minLength: getMinLength(getRule(rulePrefix, "min-length")),

		skip: canBeSkip,
		title: questionSettings?.description ?? `${rulePrefix}:`,
	};
}
