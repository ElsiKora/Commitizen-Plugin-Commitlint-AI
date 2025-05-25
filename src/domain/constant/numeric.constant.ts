/**
 * Numeric constants used throughout the application
 */

// Retry limits
export const DEFAULT_MAX_RETRIES: number = 3;
export const DEFAULT_VALIDATION_MAX_RETRIES: number = 3;

// API and formatting limits
export const MAX_TOKENS: number = 4096;
export const LLM_TEMPERATURE: number = 0.7;
export const RETRY_DELAY_MS: number = 1000;

// Array indices for commitlint rules
export const RULE_LEVEL_INDEX: number = 0;
export const RULE_CONDITION_INDEX: number = 1;
export const RULE_VALUE_INDEX: number = 2;
export const MIN_RULE_LENGTH: number = 2;
export const RULE_CONFIG_LENGTH: number = 3;

// Validation levels
export const VALIDATION_LEVEL_DISABLED: number = 0;
export const VALIDATION_LEVEL_WARNING: number = 1;
export const VALIDATION_LEVEL_ERROR: number = 2;

// String manipulation
export const ELLIPSIS_LENGTH: number = 3;
export const MIN_API_KEY_LENGTH: number = 8;
export const REDACTED_LENGTH: number = 4;

// UI formatting
export const NOTE_BOX_PADDING: number = 4;
export const NOTE_BOX_CONTENT_PADDING: number = 2;

// Numeric limits
export const MIN_RETRY_COUNT: number = 1;
export const MAX_RETRY_COUNT: number = 10;

// OpenAI API constants
export const OPENAI_MAX_TOKENS: number = 2048;
export const OPENAI_TEMPERATURE: number = 0.7;
