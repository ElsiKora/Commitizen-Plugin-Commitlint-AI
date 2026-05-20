/** @type {Awaited<typeof import('./dist/esm/index.js')>['prompter']} */

exports.prompter = async (...arguments_) => {
	return (await import("./dist/esm/index.js")).prompter(...arguments_);
};
