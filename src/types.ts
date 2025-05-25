import type { RuleConfigCondition, RuleConfigSeverity } from "@commitlint/types";

export type Rule = Readonly<[RuleConfigSeverity, RuleConfigCondition, unknown]> | Readonly<[RuleConfigSeverity, RuleConfigCondition]> | Readonly<[RuleConfigSeverity.Disabled]>;
