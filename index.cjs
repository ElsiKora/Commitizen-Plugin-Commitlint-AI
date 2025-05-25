/** @type {Awaited<typeof import('./lib/index.js')>['prompter']} */

exports.prompter = async (...arguments_) => {
	(await import("./dist/esm/index.js")).prompter(...arguments_);
};
