import type { Rule } from "../types.js";

import { ruleIsActive, ruleIsNotApplicable } from "./rules.js";

/**
 * Get forced leading for rule
 * @param rule to parse
 * @return transform function applying the leading
 */
export default function getLeadingBlankFunction(rule?: Rule): (input: string) => string {
	if (!rule || !ruleIsActive(rule)) {
		return (input: string): string => input;
	}

	// eslint-disable-next-line @elsikora-unicorn/consistent-function-scoping
	const remove = (input: string): string => {
		const fragments: Array<string> = input.split("\n");

		while (fragments.length > 0 && fragments[0] === "") {
			fragments.shift();
		}

		return fragments.join("\n");
	};

	// eslint-disable-next-line @elsikora-unicorn/consistent-function-scoping
	const lead = (input: string): string => {
		const fragments: Array<string> = input.split("\n");

		return fragments[0] === "" ? input : ["", ...fragments].join("\n");
	};

	return ruleIsNotApplicable(rule) ? remove : lead;
}
