import type { IBranchLintConfig, IBranchLintConfigService, TBranchLintSubjectPattern } from "../../application/interface/branch-lint-config.interface.js";
import type { IConfigService } from "../../application/interface/config-service.interface.js";
import type { IConfig, ITicketConfig, TTicketMissingBranchLintBehavior, TTicketNormalization, TTicketSource } from "../../application/interface/config.interface.js";
import type { ITicketIdParser } from "../../application/interface/ticket-id-parser.interface.js";
import type { TicketId } from "../../domain/value-object/ticket-id.value-object.js";

import { TICKET_CONSTANT } from "../../domain/constant/ticket.constant.js";
import { TicketId as TicketIdValueObject } from "../../domain/value-object/ticket-id.value-object.js";

const DELIMITER_CLASS: string = String.raw`[\/_.-]`;
const DELIMITED_MATCH_GROUP_INDEX: number = 2;
const OPTIONAL_PLACEHOLDER_SUFFIXES: ReadonlyArray<string> = ["-"];
const PLACEHOLDER_PATTERN: RegExp = /:([a-z][a-z0-9-]*)/giu;

interface IBranchLintMatchResult {
	candidate?: string;
	isConfigured: boolean;
}

/**
 * Infrastructure parser that resolves ticket ids from configured sources.
 */
export class BranchTicketIdParser implements ITicketIdParser {
	private readonly BRANCH_LINT_CONFIG_SERVICE: IBranchLintConfigService;

	private readonly CONFIG_SERVICE: IConfigService;

	constructor(configService: IConfigService, branchLintConfigService: IBranchLintConfigService) {
		this.CONFIG_SERVICE = configService;
		this.BRANCH_LINT_CONFIG_SERVICE = branchLintConfigService;
	}

	/**
	 * Parse ticket id from branch name according to plugin config.
	 * @param {string} branchName - Git branch name.
	 * @returns {Promise<TicketId | undefined>} Parsed ticket id when available.
	 */
	async parseFromBranchName(branchName: string): Promise<TicketId | undefined> {
		const ticketConfig: ITicketConfig = await resolveTicketConfig(this.CONFIG_SERVICE);

		switch (ticketConfig.source) {
			case "auto": {
				return resolveFromAutoSource(branchName, ticketConfig, this.BRANCH_LINT_CONFIG_SERVICE);
			}

			case "branch-lint": {
				return resolveFromBranchLintSource(branchName, ticketConfig, this.BRANCH_LINT_CONFIG_SERVICE);
			}

			case "none": {
				return undefined;
			}

			case "pattern": {
				return resolveFromPatternSource(branchName, ticketConfig.pattern, ticketConfig.patternFlags, ticketConfig.normalization);
			}
		}
	}
}

/**
 * Apply case normalization to a ticket candidate.
 * @param {string} candidate - Raw ticket candidate.
 * @param {TTicketNormalization} normalization - Normalization mode.
 * @returns {string} Normalized ticket candidate.
 */
function applyTicketNormalization(candidate: string, normalization: TTicketNormalization): string {
	const trimmedCandidate: string = candidate.trim();

	switch (normalization) {
		case "lower": {
			return trimmedCandidate.toLowerCase();
		}

		case "preserve": {
			return trimmedCandidate;
		}

		case "upper": {
			return trimmedCandidate.toUpperCase();
		}
	}
}

/**
 * Build all branch pattern variants with optional placeholders removed.
 * @param {string} branchPattern - Branch pattern.
 * @returns {Array<string>} Unique normalized variants.
 */
function buildPatternVariants(branchPattern: string): Array<string> {
	let variants: Array<string> = [branchPattern];
	const placeholders: Array<string> = extractPlaceholders(branchPattern);

	for (const placeholderName of placeholders) {
		if (!isOptionalPlaceholder(branchPattern, placeholderName)) {
			continue;
		}

		variants = variants.flatMap((variant: string) => [variant, removeOptionalPlaceholder(variant, placeholderName)]);
	}

	return [...new Set(variants.map((variant: string) => normalizeDelimiters(variant)).filter((variant: string) => variant.length > 0))];
}

/**
 * Build ticket id from parsed candidate with normalization.
 * @param {string} candidate - Parsed ticket candidate.
 * @param {TTicketNormalization} normalization - Normalization mode.
 * @returns {TicketId | undefined} Ticket value object.
 */
function buildTicketIdFromCandidate(candidate: string, normalization: TTicketNormalization): TicketId | undefined {
	const normalizedCandidate: string = applyTicketNormalization(candidate, normalization);

	return TicketIdValueObject.tryCreate(normalizedCandidate);
}

/**
 * Create regular expression and throw descriptive error when invalid.
 * @param {string} patternSource - Pattern source.
 * @param {string} flags - Regex flags.
 * @returns {RegExp} Compiled regex.
 */
function createRegex(patternSource: string, flags: string = ""): RegExp {
	try {
		return new RegExp(patternSource, flags);
	} catch (error) {
		throw new Error(`Invalid ticket regex pattern "${patternSource}": ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Escape string for safe use in regex source.
 * @param {string} value - Raw value.
 * @returns {string} Escaped regex value.
 */
function escapeRegex(value: string): string {
	return value.replaceAll(/[\\^$.*+?()[\]{}|/-]/g, String.raw`\$&`);
}

/**
 * Extract branch type keys from branch-lint config.
 * @param {Array<string> | Record<string, unknown> | undefined} branches - Branch types config.
 * @returns {Array<string>} Branch type names.
 */
function extractBranchTypes(branches: Array<string> | Record<string, unknown> | undefined): Array<string> {
	if (!branches) {
		return [];
	}

	if (Array.isArray(branches)) {
		return branches;
	}

	return Object.keys(branches);
}

/**
 * Extract first delimited regex match from branch name.
 * @param {string} branchName - Branch name.
 * @param {string} patternSource - Regex source.
 * @param {string} patternFlags - Regex flags.
 * @returns {string | undefined} First matched candidate.
 */
function extractDelimitedMatch(branchName: string, patternSource: string, patternFlags: string): string | undefined {
	const normalizedPatternSource: string = stripAnchors(patternSource);
	const normalizedFlags: string = normalizeRegexFlags(patternFlags);
	const expression: RegExp = createRegex(`(^|${DELIMITER_CLASS})(${normalizedPatternSource})(?=$|${DELIMITER_CLASS})`, normalizedFlags);
	const match: null | RegExpExecArray = expression.exec(branchName);
	const candidate: string = match?.[DELIMITED_MATCH_GROUP_INDEX]?.trim() ?? "";

	return candidate.length > 0 ? candidate : undefined;
}

/**
 * Extract placeholder names from branch pattern preserving order.
 * @param {string} branchPattern - Branch pattern.
 * @returns {Array<string>} Ordered placeholder names.
 */
function extractPlaceholders(branchPattern: string): Array<string> {
	const placeholders: Array<string> = [];
	const matches: IterableIterator<RegExpMatchArray> = branchPattern.matchAll(PLACEHOLDER_PATTERN);

	for (const match of matches) {
		const rawPlaceholderName: string = match[1] ?? "";
		const placeholderName: string = rawPlaceholderName.endsWith("-") ? rawPlaceholderName.slice(0, Math.max(0, rawPlaceholderName.length - 1)) : rawPlaceholderName;

		if (placeholderName.length > 0 && !placeholders.includes(placeholderName)) {
			placeholders.push(placeholderName);
		}
	}

	return placeholders;
}

/**
 * Check if character is a branch delimiter.
 * @param {string} character - Single character.
 * @returns {boolean} True when delimiter.
 */
function isDelimiter(character: string): boolean {
	return character === "." || character === "-" || character === "/" || character === "_";
}

/**
 * Check if placeholder is optional in given branch pattern.
 * @param {string} branchPattern - Branch pattern.
 * @param {string} placeholderName - Placeholder name.
 * @returns {boolean} True when placeholder has optional suffix.
 */
function isOptionalPlaceholder(branchPattern: string, placeholderName: string): boolean {
	const placeholderToken: string = `:${placeholderName}`;

	return OPTIONAL_PLACEHOLDER_SUFFIXES.some((suffix: string) => branchPattern.includes(`${placeholderToken}${suffix}`));
}

/**
 * Match ticket candidate using git-branch-lint pattern configuration.
 * @param {string} branchName - Branch name.
 * @param {IBranchLintConfigService} branchLintConfigService - Config loader.
 * @returns {Promise<IBranchLintMatchResult>} Match result.
 */
async function matchFromBranchLintConfig(branchName: string, branchLintConfigService: IBranchLintConfigService): Promise<IBranchLintMatchResult> {
	const config: IBranchLintConfig | null = await branchLintConfigService.load();

	if (!config) {
		return { isConfigured: false };
	}

	const branchPattern: string = config.rules?.["branch-pattern"]?.trim() ?? "";

	if (branchPattern.length === 0 || !branchPattern.includes(":ticket")) {
		return { isConfigured: false };
	}

	const placeholders: Array<string> = extractPlaceholders(branchPattern);
	const variants: Array<string> = buildPatternVariants(branchPattern);

	for (const variant of variants) {
		const candidate: string | undefined = matchPatternVariant(branchName, variant, placeholders, config);

		if (candidate) {
			return { candidate, isConfigured: true };
		}
	}

	return { isConfigured: true };
}

/**
 * Match one normalized branch pattern variant and return ticket capture.
 * @param {string} branchName - Branch name.
 * @param {string} variant - Pattern variant.
 * @param {Array<string>} placeholders - Ordered placeholders.
 * @param {IBranchLintConfig} config - Branch lint config.
 * @returns {string | undefined} Captured ticket candidate.
 */
function matchPatternVariant(branchName: string, variant: string, placeholders: Array<string>, config: IBranchLintConfig): string | undefined {
	let resolvedPattern: string = variant;

	for (const placeholderName of placeholders) {
		const placeholderToken: string = `:${placeholderName}`;

		if (!resolvedPattern.includes(placeholderToken)) {
			continue;
		}

		const patternSource: string = resolvePlaceholderPatternSource(placeholderName, config);
		const replacement: string = placeholderName === "ticket" ? `(?<ticket>${patternSource})` : `(?:${patternSource})`;
		resolvedPattern = resolvedPattern.replaceAll(placeholderToken, replacement);
	}

	const expression: RegExp = createRegex(`^${resolvedPattern}$`);
	const match: null | RegExpExecArray = expression.exec(branchName);
	const candidate: string = match?.groups?.ticket?.trim() ?? "";

	return candidate.length > 0 ? candidate : undefined;
}

/**
 * Normalize repeated delimiters and trim delimiter edges.
 * @param {string} value - Branch pattern value.
 * @returns {string} Normalized value.
 */
function normalizeDelimiters(value: string): string {
	const compactedValue: string = value
		.replaceAll(/\/{2,}/gu, "/")
		.replaceAll(/-{2,}/gu, "-")
		.replaceAll(/_{2,}/gu, "_")
		.replaceAll(/\.{2,}/gu, ".");

	return trimDelimiterEdges(compactedValue);
}

/**
 * Normalize regex flags by removing duplicates and unsupported values.
 * @param {string} flags - Raw flags.
 * @returns {string} Safe unique flags.
 */
function normalizeRegexFlags(flags: string): string {
	const allowedFlags: ReadonlySet<string> = new Set(["d", "g", "i", "m", "s", "u", "v", "y"]);
	const uniqueFlags: Array<string> = [];

	for (const flag of flags) {
		if (!allowedFlags.has(flag) || uniqueFlags.includes(flag)) {
			continue;
		}

		uniqueFlags.push(flag);
	}

	return uniqueFlags.join("");
}

/**
 * Remove optional placeholder token from pattern.
 * @param {string} branchPattern - Pattern variant.
 * @param {string} placeholderName - Placeholder name.
 * @returns {string} Pattern without optional placeholder token.
 */
function removeOptionalPlaceholder(branchPattern: string, placeholderName: string): string {
	const placeholderToken: string = `:${placeholderName}`;
	let updatedPattern: string = branchPattern;

	for (const suffix of OPTIONAL_PLACEHOLDER_SUFFIXES) {
		updatedPattern = updatedPattern.replaceAll(`${placeholderToken}${suffix}`, "");
	}

	updatedPattern = updatedPattern.replaceAll(placeholderToken, "");

	return updatedPattern;
}

/**
 * Resolve ticket id using auto strategy.
 * @param {string} branchName - Branch name.
 * @param {ITicketConfig} ticketConfig - Effective ticket config.
 * @param {IBranchLintConfigService} branchLintConfigService - Branch lint config loader.
 * @returns {Promise<TicketId | undefined>} Parsed ticket id.
 */
async function resolveFromAutoSource(branchName: string, ticketConfig: ITicketConfig, branchLintConfigService: IBranchLintConfigService): Promise<TicketId | undefined> {
	const branchLintMatch: IBranchLintMatchResult = await matchFromBranchLintConfig(branchName, branchLintConfigService);

	if (branchLintMatch.isConfigured) {
		if (!branchLintMatch.candidate) {
			return undefined;
		}

		return buildTicketIdFromCandidate(branchLintMatch.candidate, ticketConfig.normalization);
	}

	return resolveFromPatternSource(branchName, ticketConfig.pattern, ticketConfig.patternFlags, ticketConfig.normalization);
}

/**
 * Resolve ticket id using branch-lint strategy.
 * @param {string} branchName - Branch name.
 * @param {ITicketConfig} ticketConfig - Effective ticket config.
 * @param {IBranchLintConfigService} branchLintConfigService - Branch lint config loader.
 * @returns {Promise<TicketId | undefined>} Parsed ticket id.
 */
async function resolveFromBranchLintSource(branchName: string, ticketConfig: ITicketConfig, branchLintConfigService: IBranchLintConfigService): Promise<TicketId | undefined> {
	const branchLintMatch: IBranchLintMatchResult = await matchFromBranchLintConfig(branchName, branchLintConfigService);

	if (!branchLintMatch.isConfigured) {
		if (ticketConfig.missingBranchLintBehavior === "error") {
			throw new Error("Ticket source is set to branch-lint, but git-branch-lint ticket configuration is unavailable");
		}

		return resolveFromPatternSource(branchName, ticketConfig.pattern, ticketConfig.patternFlags, ticketConfig.normalization);
	}

	if (!branchLintMatch.candidate) {
		return undefined;
	}

	return buildTicketIdFromCandidate(branchLintMatch.candidate, ticketConfig.normalization);
}

/**
 * Resolve ticket id using local regex pattern strategy.
 * @param {string} branchName - Branch name.
 * @param {string} patternSource - Regex source for ticket id.
 * @param {string} patternFlags - Regex flags.
 * @param {TTicketNormalization} normalization - Ticket normalization rule.
 * @returns {TicketId | undefined} Parsed ticket id.
 */
function resolveFromPatternSource(branchName: string, patternSource: string, patternFlags: string, normalization: TTicketNormalization): TicketId | undefined {
	const candidate: string | undefined = extractDelimitedMatch(branchName, patternSource, patternFlags);

	if (!candidate) {
		return undefined;
	}

	return buildTicketIdFromCandidate(candidate, normalization);
}

/**
 * Resolve missing branch-lint behavior with fallback to default.
 * @param {TTicketMissingBranchLintBehavior | undefined} behavior - Raw behavior.
 * @returns {TTicketMissingBranchLintBehavior} Safe behavior.
 */
function resolveMissingBranchLintBehavior(behavior: TTicketMissingBranchLintBehavior | undefined): TTicketMissingBranchLintBehavior {
	const allowedBehaviors: ReadonlySet<string> = new Set(["error", "fallback"]);

	if (typeof behavior === "string" && allowedBehaviors.has(behavior)) {
		return behavior;
	}

	return TICKET_CONSTANT.DEFAULT_TICKET_MISSING_BRANCH_LINT_BEHAVIOR as TTicketMissingBranchLintBehavior;
}

/**
 * Resolve ticket normalization with fallback to default.
 * @param {TTicketNormalization | undefined} normalization - Raw normalization.
 * @returns {TTicketNormalization} Safe normalization.
 */
function resolveNormalization(normalization: TTicketNormalization | undefined): TTicketNormalization {
	const allowedNormalizations: ReadonlySet<string> = new Set(["lower", "preserve", "upper"]);

	if (typeof normalization === "string" && allowedNormalizations.has(normalization)) {
		return normalization;
	}

	return TICKET_CONSTANT.DEFAULT_TICKET_NORMALIZATION as TTicketNormalization;
}

/**
 * Resolve local fallback pattern source.
 * @param {string | undefined} pattern - Raw pattern source.
 * @returns {string} Safe pattern source.
 */
function resolvePattern(pattern: string | undefined): string {
	const normalizedPattern: string = pattern?.trim() ?? "";

	if (normalizedPattern.length > 0) {
		return normalizedPattern;
	}

	return TICKET_CONSTANT.DEFAULT_TICKET_PATTERN_SOURCE;
}

/**
 * Resolve local fallback regex flags.
 * @param {string | undefined} patternFlags - Raw flags.
 * @returns {string} Safe regex flags.
 */
function resolvePatternFlags(patternFlags: string | undefined): string {
	if (typeof patternFlags !== "string") {
		return TICKET_CONSTANT.DEFAULT_TICKET_PATTERN_FLAGS;
	}

	const normalizedFlags: string = normalizeRegexFlags(patternFlags.trim());

	return normalizedFlags.length > 0 ? normalizedFlags : TICKET_CONSTANT.DEFAULT_TICKET_PATTERN_FLAGS;
}

/**
 * Resolve placeholder regex source using branch-lint policy rules.
 * @param {string} placeholderName - Placeholder name.
 * @param {IBranchLintConfig} config - Branch lint config.
 * @returns {string} Regex source for this placeholder.
 */
function resolvePlaceholderPatternSource(placeholderName: string, config: IBranchLintConfig): string {
	if (placeholderName === "type") {
		return resolveTypePatternSource(config);
	}

	const subjectPattern: TBranchLintSubjectPattern | undefined = config.rules?.["branch-subject-pattern"];

	if (typeof subjectPattern === "object" && subjectPattern && !Array.isArray(subjectPattern)) {
		const scopedPattern: string | undefined = subjectPattern[placeholderName];

		if (typeof scopedPattern === "string" && scopedPattern.trim().length > 0) {
			return scopedPattern.trim();
		}
	}

	if (placeholderName === "ticket") {
		return TICKET_CONSTANT.BRANCH_LINT_DEFAULT_TICKET_PATTERN_SOURCE;
	}

	if (typeof subjectPattern === "string" && subjectPattern.trim().length > 0) {
		return subjectPattern.trim();
	}

	return TICKET_CONSTANT.BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE;
}

/**
 * Resolve source mode with fallback to default.
 * @param {TTicketSource | undefined} source - Raw source setting.
 * @returns {TTicketSource} Safe source mode.
 */
function resolveSource(source: TTicketSource | undefined): TTicketSource {
	const allowedSources: ReadonlySet<string> = new Set(["auto", "branch-lint", "none", "pattern"]);

	if (typeof source === "string" && allowedSources.has(source)) {
		return source;
	}

	return TICKET_CONSTANT.DEFAULT_TICKET_SOURCE as TTicketSource;
}

/**
 * Resolve ticket configuration with defaults and safe coercion.
 * @param {IConfigService} configService - Plugin config service.
 * @returns {Promise<ITicketConfig>} Effective ticket config.
 */
async function resolveTicketConfig(configService: IConfigService): Promise<ITicketConfig> {
	const config: IConfig = await configService.get();
	const rawTicketConfig: Partial<ITicketConfig> = config.ticket ?? {};

	return {
		missingBranchLintBehavior: resolveMissingBranchLintBehavior(rawTicketConfig.missingBranchLintBehavior),
		normalization: resolveNormalization(rawTicketConfig.normalization),
		pattern: resolvePattern(rawTicketConfig.pattern),
		patternFlags: resolvePatternFlags(rawTicketConfig.patternFlags),
		source: resolveSource(rawTicketConfig.source),
	};
}

/**
 * Resolve regex source for :type placeholder from configured branch types.
 * @param {IBranchLintConfig} config - Branch lint config.
 * @returns {string} Alternation source.
 */
function resolveTypePatternSource(config: IBranchLintConfig): string {
	const branchTypes: Array<string> = extractBranchTypes(config.branches);

	if (branchTypes.length === 0) {
		return TICKET_CONSTANT.BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE;
	}

	return branchTypes.map((branchType: string) => escapeRegex(branchType)).join("|");
}

/**
 * Remove start/end anchors from user pattern source.
 * @param {string} patternSource - Raw source.
 * @returns {string} Source without wrapping anchors.
 */
function stripAnchors(patternSource: string): string {
	let normalizedSource: string = patternSource.trim();

	if (normalizedSource.startsWith("^")) {
		normalizedSource = normalizedSource.slice(1);
	}

	if (normalizedSource.endsWith("$")) {
		normalizedSource = normalizedSource.slice(0, Math.max(0, normalizedSource.length - 1));
	}

	return normalizedSource;
}

/**
 * Trim delimiter characters at start and end.
 * @param {string} value - Value to trim.
 * @returns {string} Trimmed value.
 */
function trimDelimiterEdges(value: string): string {
	let startIndex: number = 0;
	let endIndex: number = value.length - 1;

	while (startIndex <= endIndex && isDelimiter(value[startIndex] ?? "")) {
		startIndex += 1;
	}

	while (endIndex >= startIndex && isDelimiter(value[endIndex] ?? "")) {
		endIndex -= 1;
	}

	return value.slice(startIndex, endIndex + 1);
}
