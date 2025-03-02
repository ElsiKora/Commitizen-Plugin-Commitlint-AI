import type { Answers, DistinctQuestion } from "inquirer";

import wrap from "word-wrap";

import Question from "./Question.js";
import getRuleQuestionConfig from "./services/getRuleQuestionConfig.js";
import { getRule } from "./store/rules.js";
import getLeadingBlankFunction from "./utils/leading-blank-fn.js";
import { getMaxLength } from "./utils/rules.js";

export function combineCommitMessage(answers: Answers): string {
	const maxLineLength = getMaxLength(getRule("body", "max-line-length"));
	const leadingBlankFunction = getLeadingBlankFunction(getRule("body", "leading-blank"));
	const { body, breakingBody, issuesBody } = answers;

	const commitBody = body || breakingBody || issuesBody || "";

	return commitBody
		? leadingBlankFunction(
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

export function getQuestions(): Array<DistinctQuestion> {
	// body
	const questionConfig = getRuleQuestionConfig("body");

	return questionConfig ? [new Question("body", questionConfig).question] : [];
}
