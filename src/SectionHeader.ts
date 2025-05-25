import type { PromptName, RuleField } from "@commitlint/types";

import type { QuestionConfig } from "./Question.js";
import type { PromptsAnswers, PromptsQuestion } from "./services/promptsInterface.js";

import Question from "./Question.js";
import getRuleQuestionConfig from "./services/getRuleQuestionConfig.js";
import { getPromptSettings } from "./store/prompts.js";

export class HeaderQuestion extends Question {
	headerMaxLength: number;

	headerMinLength: number;

	constructor(name: PromptName, questionConfig: QuestionConfig, headerMaxLength?: number, headerMinLength?: number) {
		super(name, questionConfig);
		this.headerMaxLength = headerMaxLength ?? Infinity;
		this.headerMinLength = headerMinLength ?? 0;
	}

	beforeQuestionStart(answers: PromptsAnswers): void {
		const headerRemainLength: number = this.headerMaxLength - combineCommitMessage(answers).length;
		this.maxLength = Math.min(this.maxLength, headerRemainLength);
		this.minLength = Math.min(this.minLength, this.headerMinLength);
	}
}

export function combineCommitMessage(answers: PromptsAnswers): string {
	const scope = (answers.scope as string) || "";
	const subject = (answers.subject as string) || "";
	const type = (answers.type as string) || "";
	// eslint-disable-next-line @elsikora/sonar/no-nested-template-literals
	const prefix: string = `${type}${scope ? `(${scope})` : ""}`;

	// eslint-disable-next-line @elsikora/sonar/no-nested-conditional
	return subject ? ((prefix ? prefix + ": " : "") + subject).trim() : prefix.trim();
}

export function getQuestionConfig(name: RuleField): ReturnType<typeof getRuleQuestionConfig> {
	const questionConfig: null | QuestionConfig = getRuleQuestionConfig(name);

	if (questionConfig && name === "scope") {
		if (getPromptSettings().enableMultipleScopes) {
			questionConfig.multipleSelectDefaultDelimiter = getPromptSettings().scopeEnumSeparator;
		}
		// split scope string to segments, match commitlint rules
		questionConfig.multipleValueDelimiters = /[/\\,]/g;
	}

	return questionConfig;
}

export function getQuestions(): Array<PromptsQuestion> {
	// header: type, scope, subject
	const questions: Array<PromptsQuestion> = [];

	const headerRuleFields: Array<RuleField> = ["type", "scope", "subject"];
	const headerRuleQuestionConfig: null | QuestionConfig = getRuleQuestionConfig("header");

	if (!headerRuleQuestionConfig) {
		return [];
	}

	for (const name of headerRuleFields) {
		const questionConfig: ReturnType<(rulePrefix: RuleField) => null | QuestionConfig> = getQuestionConfig(name);

		if (questionConfig) {
			const instance: HeaderQuestion = new HeaderQuestion(name, questionConfig, headerRuleQuestionConfig.maxLength, headerRuleQuestionConfig.minLength);
			questions.push(instance.question);
		}
	}

	return questions;
}
