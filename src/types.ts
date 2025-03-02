import type { RuleConfigCondition, RuleConfigSeverity } from "@commitlint/types";

// eslint-disable-next-line @elsikora-typescript/naming-convention
export type Rule = Readonly<[RuleConfigSeverity, RuleConfigCondition, unknown]> | Readonly<[RuleConfigSeverity, RuleConfigCondition]> | Readonly<[RuleConfigSeverity.Disabled]>;
