import type { PromptConfig, UserPromptConfig } from "@commitlint/types";

import isPlainObject from "lodash.isplainobject";

import defaultPromptConfigs from "./defaultPromptConfigs.js";

const storeKey: unique symbol = Symbol("promptConfig");

const store: {
	[storeKey]: PromptConfig;
} = {
	[storeKey]: defaultPromptConfigs,
};

export function getPromptMessages(): Readonly<PromptConfig["messages"]> {
	return store[storeKey]?.messages ?? {};
}

export function getPromptQuestions(): Readonly<PromptConfig["questions"]> {
	return store[storeKey]?.questions ?? {};
}

export function getPromptSettings(): Readonly<PromptConfig["settings"]> {
	return store[storeKey]?.settings ?? {};
}

export function setPromptConfig(newPromptConfig: UserPromptConfig): void {
	const { messages, questions, settings }: UserPromptConfig = newPromptConfig;

	if (messages) {
		const requiredMessageKeys: Array<string> = Object.keys(defaultPromptConfigs.messages);
		// eslint-disable-next-line @elsikora-unicorn/no-array-for-each
		requiredMessageKeys.forEach((key: string) => {
			const message: any = messages[key];

			if (typeof message === "string") {
				store[storeKey].messages[key] = message;
			}
		});
	}

	if (questions && isPlainObject(questions)) {
		store[storeKey].questions = questions;
	}

	if (settings && isPlainObject(settings)) {
		// eslint-disable-next-line @elsikora-sonar/anchor-precedence
		if (settings.scopeEnumSeparator && !/^\/|\\|,$/.test(settings.scopeEnumSeparator)) {
			console.log(`prompt.settings.scopeEnumSeparator must be one of ',', '\\', '/'.`);
			// eslint-disable-next-line @elsikora-unicorn/no-process-exit,elsikora-node/no-process-exit
			process.exit(1);
		}
		store[storeKey].settings = {
			...defaultPromptConfigs.settings,
			...settings,
		};
	}
}
