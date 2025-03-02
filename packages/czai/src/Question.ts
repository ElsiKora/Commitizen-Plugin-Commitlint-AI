import type { PromptMessages, PromptName } from "@commitlint/types";
import type { Answers, ChoiceCollection, DistinctQuestion } from "inquirer";

import type { CaseFn as CaseFunction } from "./utils/case-fn.js";
import type { FullStopFn as FullStopFunction } from "./utils/full-stop-fn.js";

import chalk from "chalk";
import inquirer from "inquirer";

export type QuestionConfig = {
	caseFn?: CaseFunction;
	defaultValue?: string;
	enumList?: ChoiceCollection<{
		name: string;
		value: string;
	}> | null;
	fullStopFn?: FullStopFunction;
	maxLength?: number;
	messages: PromptMessages;
	minLength?: number;
	multipleSelectDefaultDelimiter?: string;
	multipleValueDelimiters?: RegExp;
	skip?: boolean;
	title: string;
	when?: DistinctQuestion["when"];
};

export default class Question {
	get maxLength(): number {
		return this._maxLength;
	}

	set maxLength(maxLength: number) {
		this._maxLength = maxLength;
	}

	get minLength(): number {
		return this._minLength;
	}

	set minLength(minLength: number) {
		this._minLength = minLength;
	}

	get question(): Readonly<DistinctQuestion> {
		return this._question;
	}

	private _maxLength: number;

	private _minLength: number;

	private readonly _question: Readonly<DistinctQuestion>;

	private readonly caseFn: CaseFunction;

	private readonly fullStopFn: FullStopFunction;

	private readonly messages: PromptMessages;

	private readonly multipleSelectDefaultDelimiter?: string;

	private readonly multipleValueDelimiters?: RegExp;

	private readonly skip: boolean;

	private readonly title: string;

	constructor(name: PromptName, { caseFn, defaultValue, enumList, fullStopFn, maxLength, messages, minLength, multipleSelectDefaultDelimiter, multipleValueDelimiters, skip, title, when }: QuestionConfig) {
		if (!name || typeof name !== "string") throw new Error("Question: name is required");

		this._maxLength = maxLength ?? Infinity;
		this._minLength = minLength ?? 0;
		this.messages = messages;
		this.title = title ?? "";
		this.skip = skip ?? false;
		this.fullStopFn = fullStopFn ?? ((_: string) => _);
		this.caseFn = caseFn ?? ((input: Array<string> | string, delimiter?: string) => (Array.isArray(input) ? input.join(delimiter) : input));
		this.multipleValueDelimiters = multipleValueDelimiters;
		this.multipleSelectDefaultDelimiter = multipleSelectDefaultDelimiter;

		if (enumList && Array.isArray(enumList)) {
			this._question = {
				choices: skip
					? [
							...enumList,
							new inquirer.Separator(),
							{
								name: "empty",
								value: "",
							},
						]
					: [...enumList],
				type: multipleSelectDefaultDelimiter ? "checkbox" : "list",
			};
		} else if (/^is[A-Z]/.test(name)) {
			this._question = {
				type: "confirm",
			};
		} else {
			this._question = {
				transformer: this.transformer.bind(this),
				type: "input",
			};
		}

		Object.assign(this._question, {
			default: defaultValue,
			filter: this.filter.bind(this),
			message: this.decorateMessage.bind(this),
			name,
			validate: this.validate.bind(this),
			when,
		});
	}

	getMessage(key: string): string {
		return this.messages[key] ?? "";
	}

	protected beforeQuestionStart(_answers: Answers): void {
		return;
	}

	protected decorateMessage(_answers: Answers): string {
		if (this.beforeQuestionStart) {
			this.beforeQuestionStart(_answers);
		}

		if (this.question.type === "input") {
			const countLimitMessage = (() => {
				const messages = [];

				if (this.minLength > 0 && this.getMessage("min")) {
					messages.push(this.getMessage("min").replaceAll("%d", this.minLength + ""));
				}

				if (this.maxLength < Infinity && this.getMessage("max")) {
					messages.push(this.getMessage("max").replaceAll("%d", this.maxLength + ""));
				}

				return messages.join(", ");
			})();

			const skipMessage = this.skip && this.getMessage("skip");

			return this.title + (skipMessage ? ` ${skipMessage}` : "") + ":" + (countLimitMessage ? ` ${countLimitMessage}` : "") + "\n";
		} else {
			return `${this.title}:`;
		}
	}

	protected filter(input: Array<string> | string): string {
		let toCased;

		if (Array.isArray(input)) {
			toCased = this.caseFn(input, this.multipleSelectDefaultDelimiter);
		} else if (this.multipleValueDelimiters) {
			const segments = input.split(this.multipleValueDelimiters);
			const casedString = this.caseFn(segments, ",");
			const casedSegments = casedString.split(",");
			toCased = input.replaceAll(new RegExp(`[^${this.multipleValueDelimiters.source}]+`, "g"), (segment) => {
				return casedSegments[segments.indexOf(segment)];
			});
		} else {
			toCased = this.caseFn(input);
		}

		return this.fullStopFn(toCased);
	}

	protected transformer(input: string, _answers: Answers): string {
		const output = this.filter(input);

		if (this.maxLength === Infinity && this.minLength === 0) {
			return output;
		}

		const color = output.length <= this.maxLength && output.length >= this.minLength ? chalk.green : chalk.red;

		return color("(" + output.length + ") " + output);
	}

	protected validate(input: string): boolean | string {
		const output = this.filter(input);
		const questionName = this.question.name ?? "";

		if (!this.skip && output.length === 0) {
			return this.getMessage("emptyWarning").replaceAll("%s", questionName);
		}

		if (output.length > this.maxLength) {
			return this.getMessage("upperLimitWarning")
				.replaceAll("%s", questionName)
				.replaceAll("%d", `${output.length - this.maxLength}`);
		}

		if (output.length < this.minLength) {
			return this.getMessage("lowerLimitWarning")
				.replaceAll("%s", questionName)
				.replaceAll("%d", `${this.minLength - output.length}`);
		}

		return true;
	}
}
