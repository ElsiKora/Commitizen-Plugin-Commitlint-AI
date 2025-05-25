import type { PromptMessages, PromptName } from "@commitlint/types";

import type { QuestionConfig } from "./Question.js";
import type { PromptsAnswers, PromptsQuestion } from "./services/promptsInterface.js";

import wrap from "word-wrap";

import Question from "./Question.js";
import getRuleQuestionConfig from "./services/getRuleQuestionConfig.js";
import { getPromptMessages, getPromptQuestions } from "./store/prompts.js";
import { getRule } from "./store/rules.js";
import getLeadingBlankFunction from "./utils/leading-blank-function.js";
import { getMaxLength } from "./utils/rules.js";

export class FooterQuestion extends Question {
	footerMaxLength: number;

	footerMinLength: number;

	constructor(name: PromptName, questionConfig: QuestionConfig, footerMaxLength?: number, footerMinLength?: number) {
		super(name, questionConfig);
		this.footerMaxLength = footerMaxLength ?? Infinity;
		this.footerMinLength = footerMinLength ?? 0;
	}

	beforeQuestionStart(answers: PromptsAnswers): void {
		const footerRemainLength: number = this.footerMaxLength - combineCommitMessage(answers).length - "\n".length;
		this.maxLength = Math.min(this.maxLength, footerRemainLength);
		this.minLength = Math.min(this.minLength, this.footerMinLength);
	}
}

export function combineCommitMessage(answers: PromptsAnswers): string {
	const maxLineLength: number = getMaxLength(getRule("footer", "max-line-length"));
	const leadingBlankFunction: (input: string) => string = getLeadingBlankFunction(getRule("footer", "leading-blank"));

	const { breaking, footer, issues } = answers as { breaking?: string; footer?: string; issues?: string };
	const footerNotes: Array<string> = [];

	if (breaking) {
		const BREAKING_CHANGE: string = "BREAKING CHANGE: ";

		const message: string = BREAKING_CHANGE + breaking.replace(new RegExp(`^${BREAKING_CHANGE}`), "");
		footerNotes.push(
			maxLineLength < Infinity
				? wrap(message, {
						indent: "",

						trim: true,
						width: maxLineLength,
					})
				: message.trim(),
		);
	}

	if (issues) {
		footerNotes.push(
			maxLineLength < Infinity
				? wrap(issues, {
						indent: "",
						trim: true,
						width: maxLineLength,
					})
				: issues.trim(),
		);
	}

	if (footer) {
		footerNotes.push(
			maxLineLength < Infinity
				? wrap(footer, {
						indent: "",
						trim: true,
						width: maxLineLength,
					})
				: footer,
		);
	}

	return leadingBlankFunction(footerNotes.join("\n"));
}

export function getQuestions(): Array<PromptsQuestion> {
	const footerQuestionConfig: null | QuestionConfig = getRuleQuestionConfig("footer");

	if (!footerQuestionConfig) return [];

	const footerMaxLength: number | undefined = footerQuestionConfig.maxLength;
	const footerMinLength: number | undefined = footerQuestionConfig.minLength;

	const fields: Array<PromptName> = ["isBreaking", "breakingBody", "breaking", "isIssueAffected", "issuesBody", "issues", "footer"];

	return (
		fields
			// eslint-disable-next-line @elsikora/sonar/use-type-alias
			.filter((name: "body" | "breaking" | "breakingBody" | "footer" | "header" | "isBreaking" | "isIssueAffected" | "issues" | "issuesBody" | "scope" | "subject" | "type") => name in getPromptQuestions())
			.map((name: "body" | "breaking" | "breakingBody" | "footer" | "header" | "isBreaking" | "isIssueAffected" | "issues" | "issuesBody" | "scope" | "subject" | "type") => {
				const questions: Readonly<
					Partial<
						Record<
							"body" | "breaking" | "breakingBody" | "footer" | "header" | "isBreaking" | "isIssueAffected" | "issues" | "issuesBody" | "scope" | "subject" | "type",
							{
								description?: string;
								enum?: Record<string, { description?: string; emoji?: string; title?: string }>;
								messages?: Record<string, string>;
							}
						>
					>
				> = getPromptQuestions();

				const questionConfigs: {
					footerMaxLength: number | undefined;
					footerMinLength: number | undefined;
					messages: Readonly<PromptMessages>;
					title: string;
				} = {
					footerMaxLength,
					footerMinLength,
					messages: getPromptMessages(),
					title: questions[name]?.description ?? "",
				};

				if (name === "isBreaking") {
					Object.assign(questionConfigs, {
						defaultValue: false,
					});
				}

				if (name === "breakingBody") {
					Object.assign(questionConfigs, {
						when: (answers: PromptsAnswers) => {
							return (answers.isBreaking as boolean) && !answers.body;
						},
					});
				}

				if (name === "breaking") {
					Object.assign(questionConfigs, {
						when: (answers: PromptsAnswers) => {
							return answers.isBreaking as boolean;
						},
					});
				}

				if (name === "isIssueAffected") {
					Object.assign(questionConfigs, {
						defaultValue: false,
					});
				}

				if (name === "issuesBody") {
					Object.assign(questionConfigs, {
						when: (answers: PromptsAnswers) => {
							return (answers.isIssueAffected as boolean) && !answers.body && !answers.breakingBody;
						},
					});
				}

				if (name === "issues") {
					Object.assign(questionConfigs, {
						when: (answers: PromptsAnswers) => {
							return answers.isIssueAffected as boolean;
						},
					});
				}

				if (name === "footer") {
					Object.assign(questionConfigs, {
						...footerQuestionConfig,
					});
				}

				const instance: FooterQuestion = new FooterQuestion(name, questionConfigs, footerMaxLength, footerMinLength);

				return instance.question;
			})
	);
}
