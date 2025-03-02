/** @type {Awaited<typeof import('./lib/index.js')>['prompter']} */
// eslint-disable-next-line no-undef
exports.prompter = async (...arguments_) => {
	// eslint-disable-next-line @elsikora-unicorn/no-await-expression-member
	(await import("./dist/esm/index.js")).prompter(...arguments_);
};
