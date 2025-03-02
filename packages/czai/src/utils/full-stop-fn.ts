import type { Rule } from "../types.js";

import { ruleIsActive, ruleIsNotApplicable } from "./rules.js";

export type FullStopFn = (input: string) => string;

/**
 * Get forced case for rule
 * @param rule to parse
 * @return transform function applying the enforced case
 */
export default function getFullStopFunction(rule?: Rule): FullStopFn {
	const noop = (_: string) => _;

	if (!rule || !ruleIsActive(rule)) {
		return noop;
	}

	if (typeof rule[2] !== "string") return noop;

	const symbol: string = rule[2];

	return ruleIsNotApplicable(rule)
		? (input: string) => {
				while (input.length > 0 && input.endsWith(symbol)) {
					input = input.slice(0, -1);
				}

				return input;
			}
		: (input: string) => {
				return input.endsWith(symbol) ? input : input + symbol;
			};
}
