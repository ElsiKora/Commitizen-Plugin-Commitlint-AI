import type { QualifiedRules } from "@commitlint/types";

import type { Rule } from "../types.js";

const storeKey: unique symbol = Symbol("rules");

const store: {
	[storeKey]: QualifiedRules;
} = {
	[storeKey]: {},
};

// eslint-disable-next-line @elsikora-typescript/naming-convention
export type GetRuleMethod = typeof getRule;

// eslint-disable-next-line @elsikora-typescript/naming-convention
export type SetRulesMethod = typeof setRules;

export function getRule(key: string, property: string): Rule | undefined {
	if (key.split("-").length > 1) {
		return;
	}

	return store[storeKey][`${key}-${property}`];
}

export function setRules(newRules: QualifiedRules): void {
	store[storeKey] = newRules;
}
