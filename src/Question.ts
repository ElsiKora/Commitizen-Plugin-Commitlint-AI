/* eslint-disable @elsikora/typescript/restrict-plus-operands */
import type { PromptMessages, PromptName } from "@commitlint/types";

import type { PromptsQuestion } from "./services/promptsInterface.js";
import type { CaseFunction as CaseFunction } from "./utils/case-function.js";
import type { FullStopFunction as FullStopFunction } from "./utils/full-stop-function.js";

export type QuestionConfig = {
	caseFn?: CaseFunction;
	defaultValue?: string;
	enumList?: Array<{ name?: string; short?: string; title?: string; value: string } | string> | null;
	fullStopFn?: FullStopFunction;
	maxLength?: number;
	messages: PromptMessages;
	minLength?: number;
	multipleSelectDefaultDelimiter?: string;
	multipleValueDelimiters?: RegExp;
	skip?: boolean;
	title?: string;
	when?: "always" | boolean;
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

	get question(): Readonly<PromptsQuestion> {
		return this._question;
	}

	private _maxLength: number;

	private _minLength: number;

	private readonly _question: PromptsQuestion;

	private readonly caseFn: CaseFunction;

	private readonly fullStopFn: FullStopFunction;

	private readonly messages: PromptMessages;

	// private readonly multipleValueDelimiters: RegExp;

	private readonly skip?: boolean;

	private readonly title?: string;

	constructor(name: PromptName, questionConfig: QuestionConfig) {
		const { caseFn: caseFunction = (input: string) => input, defaultValue, enumList, fullStopFn: fullStopFunction = (input: string) => input, maxLength = Infinity, messages, minLength = 0, multipleSelectDefaultDelimiter, skip = false, title = messages.description, when = "always" } = questionConfig;

		this.messages = messages;
		this.title = title;
		this.caseFn = caseFunction as CaseFunction;
		this.fullStopFn = fullStopFunction;
		this._minLength = minLength;
		this._maxLength = maxLength;
		this.skip = skip;
		// this.multipleValueDelimiters = multipleValueDelimiters;

		// Create base question
		const message = this.buildMessage();

		if (enumList && Array.isArray(enumList)) {
			const choices = enumList.map((item) => {
				if (typeof item === "string") {
					return { title: item, value: item };
				}

				return {
					title: item.name ?? item.short ?? item.value,
					value: item.value,
				};
			});

			if (skip) {
				choices.push({ title: "empty", value: "" });
			}

			this._question = {
				choices,
				message,
				name: name as string,
				type: multipleSelectDefaultDelimiter ? "multiselect" : "list",
			};
		} else {
			this._question = {
				default: defaultValue,
				message,
				name: name as string,
				type: "input",
				validate: this.buildValidate(),
			};
		}

		// Add when condition if not always
		if (when !== "always") {
			this._question.when = () => Boolean(when);
		}
	}

	getMessage(key: string): string {
		return this.messages[key] ?? "";
	}

	private buildMessage(): string {
		if (this._question?.type === "input") {
			const countLimitMessage: string = (() => {
				const messages: Array<string> = [];

				if (this.minLength > 0 && this.getMessage("min")) {
					messages.push(this.getMessage("min").replaceAll("%d", this.minLength + ""));
				}

				if (this.maxLength < Infinity && this.getMessage("max")) {
					messages.push(this.getMessage("max").replaceAll("%d", this.maxLength + ""));
				}

				return messages.join(", ");
			})();

			const skipMessage: string = (this.skip ? this.getMessage("skip") : "") ?? "";

			return this.title + (skipMessage ? ` ${skipMessage}` : "") + ":" + (countLimitMessage ? ` ${countLimitMessage}` : "") + "\n";
		} else {
			return `${this.title}:`;
		}
	}

	private buildValidate(): (input: string) => boolean | string {
		// eslint-disable-next-line @elsikora/sonar/function-return-type
		return (input: string): boolean | string => {
			const processedInput = this.processInput(input);

			// Check min length
			if (this.minLength > 0 && processedInput.length < this.minLength) {
				return this.getMessage("min").replaceAll("%d", this.minLength + "") || `Minimum length is ${this.minLength}`;
			}

			// Check max length
			if (this.maxLength < Infinity && processedInput.length > this.maxLength) {
				return this.getMessage("max").replaceAll("%d", this.maxLength + "") || `Maximum length is ${this.maxLength}`;
			}

			return true;
		};
	}

	private processInput(input: string): string {
		// Apply case transformation
		let processed = this.caseFn(input);

		// Apply full stop function
		processed = this.fullStopFn(processed);

		return processed;
	}
}
