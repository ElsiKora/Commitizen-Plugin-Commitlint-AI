import type { TargetCaseType } from "@commitlint/types";

import type { Rule } from "../types.js";

import { case as ensureCase, toCase } from "@commitlint/ensure";

import { ruleIsActive, ruleIsNotApplicable } from "./rules.js";

export type CaseFunction = (input: Array<string> | string, delimiter?: string) => string;

/**
 * Get forced case for rule
 * @param rule to parse
 * @return transform function applying the enforced case
 */
export default function getCaseFunction(rule?: Rule): CaseFunction {
	// eslint-disable-next-line @elsikora/sonar/argument-type
	const noop = (input: Array<string> | string, delimiter?: string) => (Array.isArray(input) ? input.join(delimiter) : input);

	if (!rule || !ruleIsActive(rule) || ruleIsNotApplicable(rule)) {
		return noop;
	}

	const value: Array<TargetCaseType> | TargetCaseType = rule[2] as Array<TargetCaseType> | TargetCaseType;

	const caseList: Array<TargetCaseType> = Array.isArray(value) ? value : [value];

	return (input: Array<string> | string, delimiter?: string) => {
		let matchedCase: TargetCaseType = caseList[0];

		const segments = Array.isArray(input) ? input : [input];

		for (const segment of segments) {
			const check = caseList.find((a: TargetCaseType) => ensureCase(segment, a));

			if (check) {
				matchedCase = check;

				break;
			}
		}

		return (
			segments
				.map((segment: string) => {
					return toCase(segment, matchedCase);
				})
				// eslint-disable-next-line @elsikora/sonar/argument-type
				.join(delimiter)
		);
	};
}
