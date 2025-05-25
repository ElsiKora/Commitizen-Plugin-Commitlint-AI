import type { QuestionConfig } from "./Question.js";
import type { PromptsAnswers, PromptsQuestion } from "./services/promptsInterface.js";

import wrap from "word-wrap";

import Question from "./Question.js";
import getRuleQuestionConfig from "./services/getRuleQuestionConfig.js";
import { getRule } from "./store/rules.js";
import getLeadingBlankFunction from "./utils/leading-blank-function.js";
import { getMaxLength } from "./utils/rules.js";

export function combineCommitMessage(answers: PromptsAnswers): string {
	const maxLineLength: number = getMaxLength(getRule("body", "max-line-length"));
	const leadingBlankFunction: (input: string) => string = getLeadingBlankFunction(getRule("body", "leading-blank"));
	const body = answers.body as string | undefined;
	const breakingBody = answers.breakingBody as string | undefined;
	const issuesBody = answers.issuesBody as string | undefined;

	const commitBody: string = body ?? breakingBody ?? issuesBody ?? "";

	return commitBody
		? leadingBlankFunction(
				// eslint-disable-next-line @elsikora/sonar/no-nested-conditional
				maxLineLength < Infinity
					? wrap(commitBody, {
							indent: "",

							trim: true,
							width: maxLineLength,
						})
					: commitBody.trim(),
			)
		: "";
}

export function getQuestions(): Array<PromptsQuestion> {
	// body
	const questionConfig: null | QuestionConfig = getRuleQuestionConfig("body");

	return questionConfig ? [new Question("body", questionConfig).question] : [];
}
