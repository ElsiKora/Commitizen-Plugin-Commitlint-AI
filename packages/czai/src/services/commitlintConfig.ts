import type { QualifiedRules, UserPromptConfig } from "@commitlint/types";
import type { LLMPromptContext } from "./llm/types.js";

export function extractLLMPromptContext(
  rules: QualifiedRules,
  prompt: UserPromptConfig
): LLMPromptContext {
  const context: LLMPromptContext = {
    subject: {}
  };

  // Extract type enum
  if (rules['type-enum'] && rules['type-enum'][0] !== 0) {
    const typeEnumRule = rules['type-enum'];
    if (typeEnumRule && typeEnumRule.length >= 3 && Array.isArray(typeEnumRule[2])) {
      context.typeEnum = typeEnumRule[2] as string[];
    }
  }

  // Extract type descriptions from prompt config
  if (prompt.questions?.type?.enum) {
    context.typeDescriptions = prompt.questions.type.enum;
  }

  // Extract case function options for subject
  if (rules['subject-case'] && rules['subject-case'][0] !== 0) {
    const subjectCaseRule = rules['subject-case'];
    if (subjectCaseRule && subjectCaseRule.length >= 3 && Array.isArray(subjectCaseRule[2])) {
      context.subject.case = subjectCaseRule[2] as string[];
    }
  }

  // Extract header max length
  if (rules.header && rules.header[0] !== 0) {
    const headerRule = rules.header;
    if (headerRule && headerRule.length >= 3) {
      if (typeof headerRule[2] === 'object' && headerRule[2] !== null) {
        if ('max' in headerRule[2]) {
          context.headerMaxLength = (headerRule[2] as { max?: number }).max;
        }
        if ('min' in headerRule[2]) {
          context.headerMinLength = (headerRule[2] as { min?: number }).min;
        }
      } else if (typeof headerRule[2] === 'number') {
        if (headerRule[1] === 'max') {
          context.headerMaxLength = headerRule[2] as number;
        } else if (headerRule[1] === 'min') {
          context.headerMinLength = headerRule[2] as number;
        }
      }
    }
  }

  // Extract subject max/min length
  if (rules.subject && rules.subject[0] !== 0) {
    const subjectRule = rules.subject;
    if (subjectRule && subjectRule.length >= 3) {
      if (typeof subjectRule[2] === 'object' && subjectRule[2] !== null) {
        if ('max' in subjectRule[2]) {
          context.subject.maxLength = (subjectRule[2] as { max?: number }).max;
        }
        if ('min' in subjectRule[2]) {
          context.subject.minLength = (subjectRule[2] as { min?: number }).min;
        }
      } else if (typeof subjectRule[2] === 'number') {
        if (subjectRule[1] === 'max') {
          context.subject.maxLength = subjectRule[2] as number;
        } else if (subjectRule[1] === 'min') {
          context.subject.minLength = subjectRule[2] as number;
        }
      }
    }
  }

  // Extract body related rules
  context.body = {};
  // Body max/min length
  if (rules.body && rules.body[0] !== 0) {
    const bodyRule = rules.body;
    if (bodyRule && bodyRule.length >= 3) {
      if (typeof bodyRule[2] === 'object' && bodyRule[2] !== null) {
        if ('max' in bodyRule[2]) {
          context.body.maxLength = (bodyRule[2] as { max?: number }).max;
        }
        if ('min' in bodyRule[2]) {
          context.body.minLength = (bodyRule[2] as { min?: number }).min;
        }
      } else if (typeof bodyRule[2] === 'number') {
        if (bodyRule[1] === 'max') {
          context.body.maxLength = bodyRule[2] as number;
        } else if (bodyRule[1] === 'min') {
          context.body.minLength = bodyRule[2] as number;
        }
      }
    }
  }

  // Body-leading-blank
  if (rules['body-leading-blank'] && rules['body-leading-blank'][0] !== 0) {
    const bodyLeadingBlankRule = rules['body-leading-blank'];
    if (bodyLeadingBlankRule && bodyLeadingBlankRule.length >= 2) {
      context.body.leadingBlank = bodyLeadingBlankRule[1] === 'always';
    }
  }

  return context;
}