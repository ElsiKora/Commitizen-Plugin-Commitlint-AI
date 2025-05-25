import type { Rule } from "../types.js";

import { RuleConfigSeverity } from "@commitlint/types";

export function enumRuleIsActive(rule: Rule): rule is Readonly<[RuleConfigSeverity.Error | RuleConfigSeverity.Warning, "always", Array<string>]> {
	return ruleIsActive(rule) && ruleIsApplicable(rule) && Array.isArray(rule[2]) && rule[2].length > 0;
}

export function getEnumList(rule: Rule): Array<string> {
	// eslint-disable-next-line @elsikora/typescript/no-unsafe-return
	return Array.isArray(rule[2]) ? rule[2] : [];
}

export function getMaxLength(rule?: Rule): number {
	if (rule && ruleIsActive(rule) && ruleIsApplicable(rule) && typeof rule[2] === "number") {
		return rule[2];
	}

	return Infinity;
}

export function getMinLength(rule?: Rule): number {
	if (rule && ruleIsActive(rule) && ruleIsApplicable(rule) && typeof rule[2] === "number") {
		return rule[2];
	}

	return 0;
}

/**
 * Check if a rule definition is active
 * @param rule to check
 * @return if the rule definition is active
 */
export function ruleIsActive<T extends Rule>(rule: T): rule is Exclude<T, Readonly<[RuleConfigSeverity.Disabled]>> {
	if (rule && Array.isArray(rule)) {
		return rule[0] > RuleConfigSeverity.Disabled;
	}

	return false;
}

/**
 * Check if a rule definition is applicable
 * @param rule to check
 * @return if the rule definition is applicable
 */
export function ruleIsApplicable(rule: Rule): rule is Readonly<[RuleConfigSeverity, "always", unknown]> | Readonly<[RuleConfigSeverity, "always"]> {
	if (rule && Array.isArray(rule)) {
		return rule[1] === "always";
	}

	return false;
}

export function ruleIsDisabled(rule: Rule): rule is Readonly<[RuleConfigSeverity.Disabled]> {
	return rule && Array.isArray(rule) && rule[0] === RuleConfigSeverity.Disabled;
}

/**
 * Check if a rule definition is applicable
 * @param rule to check
 * @return if the rule definition is applicable
 */
export function ruleIsNotApplicable(rule: Rule): rule is Readonly<[RuleConfigSeverity, "never", unknown]> | Readonly<[RuleConfigSeverity, "never"]> {
	if (rule && Array.isArray(rule)) {
		return rule[1] === "never";
	}

	return false;
}
