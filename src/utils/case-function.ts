/* eslint-disable @elsikora-typescript/no-magic-numbers */
import type { TargetCaseType } from "@commitlint/types";

import type { Rule } from "../types.js";

import { case as ensureCase, toCase } from "@commitlint/ensure";

import { ruleIsActive, ruleIsNotApplicable } from "./rules.js";

// eslint-disable-next-line @elsikora-typescript/naming-convention
export type CaseFunction = (input: Array<string> | string, delimiter?: string) => string;

/**
 * Get forced case for rule
 * @param rule to parse
 * @return transform function applying the enforced case
 */
export default function getCaseFunction(rule?: Rule): CaseFunction {
	// eslint-disable-next-line @elsikora-sonar/argument-type,@elsikora-typescript/explicit-function-return-type
	const noop = (input: Array<string> | string, delimiter?: string) => (Array.isArray(input) ? input.join(delimiter) : input);

	if (!rule || !ruleIsActive(rule) || ruleIsNotApplicable(rule)) {
		return noop;
	}

	const value: any = rule[2];

	const caseList: any = Array.isArray(value) ? value : [value];

	return (input: Array<string> | string, delimiter?: string) => {
		// eslint-disable-next-line @elsikora-typescript/no-unsafe-assignment,@elsikora-typescript/no-unsafe-member-access
		let matchedCase: TargetCaseType = caseList[0];
		// eslint-disable-next-line @elsikora-typescript/typedef
		const segments = Array.isArray(input) ? input : [input];

		for (const segment of segments) {
			// @ts-ignore
			// eslint-disable-next-line @elsikora-typescript/no-unsafe-assignment,@elsikora-typescript/typedef,@elsikora-typescript/no-unsafe-call,@elsikora-typescript/no-unsafe-member-access
			const check = caseList.find((a: string | undefined) => ensureCase(segment, a));

			if (check) {
				// eslint-disable-next-line @elsikora-typescript/no-unsafe-assignment
				matchedCase = check;

				break;
			}
		}

		return (
			segments
				.map((segment: string) => {
					return toCase(segment, matchedCase);
				})
				// eslint-disable-next-line @elsikora-sonar/argument-type
				.join(delimiter)
		);
	};
}
