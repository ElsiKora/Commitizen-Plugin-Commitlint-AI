/* eslint-disable @elsikora-typescript/no-magic-numbers */
import type { Rule } from "../types.js";

import { ruleIsActive, ruleIsNotApplicable } from "./rules.js";

// eslint-disable-next-line @elsikora-typescript/naming-convention
export type FullStopFunction = (input: string) => string;

/**
 * Get forced case for rule
 * @param rule to parse
 * @return transform function applying the enforced case
 */
export default function getFullStopFunction(rule?: Rule): FullStopFunction {
	// eslint-disable-next-line @elsikora-typescript/explicit-function-return-type,@elsikora-unicorn/consistent-function-scoping,@elsikora-typescript/naming-convention
	const noop = (_: string) => _;

	if (!rule || !ruleIsActive(rule)) {
		return noop;
	}

	if (typeof rule[2] !== "string") return noop;

	const symbol: string = rule[2];

	return ruleIsNotApplicable(rule)
		? // eslint-disable-next-line @elsikora-typescript/explicit-function-return-type
			(input: string) => {
				while (input.length > 0 && input.endsWith(symbol)) {
					input = input.slice(0, -1);
				}

				return input;
			}
		: // eslint-disable-next-line @elsikora-typescript/explicit-function-return-type
			(input: string) => {
				return input.endsWith(symbol) ? input : input + symbol;
			};
}
