import type { Answers, DistinctQuestion } from "inquirer";

import type { QuestionConfig } from "./Question.js";

import wrap from "word-wrap";

// eslint-disable-next-line no-duplicate-imports
import Question from "./Question.js";
import getRuleQuestionConfig from "./services/getRuleQuestionConfig.js";
import { getRule } from "./store/rules.js";
import getLeadingBlankFunction from "./utils/leading-blank-function.js";
import { getMaxLength } from "./utils/rules.js";

export function combineCommitMessage(answers: Answers): string {
	const maxLineLength: number = getMaxLength(getRule("body", "max-line-length"));
	const leadingBlankFunction: (input: string) => string = getLeadingBlankFunction(getRule("body", "leading-blank"));
	const { body, breakingBody, issuesBody }: Answers = answers;

	// eslint-disable-next-line @elsikora-typescript/no-unsafe-assignment
	const commitBody: any = body || breakingBody || issuesBody || "";

	return commitBody
		? leadingBlankFunction(
				// eslint-disable-next-line @elsikora-sonar/no-nested-conditional,@elsikora-typescript/no-unsafe-argument
				maxLineLength < Infinity
					? // eslint-disable-next-line @elsikora-typescript/no-unsafe-argument
						wrap(commitBody, {
							indent: "",
							// eslint-disable-next-line @elsikora-typescript/naming-convention
							trim: true,
							width: maxLineLength,
						})
					: // eslint-disable-next-line @elsikora-typescript/no-unsafe-call,@elsikora-typescript/no-unsafe-member-access
						commitBody.trim(),
			)
		: "";
}

export function getQuestions(): Array<DistinctQuestion> {
	// body
	const questionConfig: null | QuestionConfig = getRuleQuestionConfig("body");

	return questionConfig ? [new Question("body", questionConfig).question] : [];
}
