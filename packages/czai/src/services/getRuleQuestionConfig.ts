import type { RuleField } from "@commitlint/types";

import type { QuestionConfig } from "../Question.js";

import { getPromptMessages, getPromptQuestions } from "../store/prompts.js";
import { getRule } from "../store/rules.js";
import getCaseFunction from "../utils/case-fn.js";
import getFullStopFunction from "../utils/full-stop-fn.js";
import { enumRuleIsActive, getEnumList, getMaxLength, getMinLength, ruleIsActive, ruleIsApplicable, ruleIsDisabled } from "../utils/rules.js";

export default function (rulePrefix: RuleField): null | QuestionConfig {
	const questions = getPromptQuestions();
	const questionSettings = questions[rulePrefix];
	const emptyRule = getRule(rulePrefix, "empty");

	const mustBeEmpty = emptyRule && ruleIsActive(emptyRule) && ruleIsApplicable(emptyRule);

	if (mustBeEmpty) {
		return null;
	}

	const canBeSkip = !emptyRule || ruleIsDisabled(emptyRule);

	const enumRule = getRule(rulePrefix, "enum");

	const enumRuleList = enumRule && enumRuleIsActive(enumRule) ? getEnumList(enumRule) : null;
	let enumList;

	if (enumRuleList) {
		const enumDescriptions = questionSettings?.enum;

		if (enumDescriptions) {
			const enumNames = Object.keys(enumDescriptions);

			const longest = Math.max(...enumRuleList.map((enumName) => enumName.length));
			// TODO emoji + title
			enumList = enumRuleList
				.sort((a, b) => enumNames.indexOf(a) - enumNames.indexOf(b))
				.map((enumName) => {
					const enumDescription = enumDescriptions[enumName]?.description;

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
