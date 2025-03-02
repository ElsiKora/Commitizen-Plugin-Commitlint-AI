/** @type {Awaited<typeof import('./lib/index.js')>['prompter']} */
exports.prompter = async (...arguments_) => {
	(await import("./lib/index.js")).prompter(...arguments_);
};
