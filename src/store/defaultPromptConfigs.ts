export default {
	messages: {
		emptyWarning: "(%s is required)",
		lowerLimitWarning: "%s is %d characters less than the lower limit",
		max: "(max %d chars)",
		min: "(min %d chars)",
		skip: "(press enter to skip)",
		upperLimitWarning: "%s is %d characters longer than the upper limit",
	},
	questions: {
		body: {
			description: "<body> holds additional information about the change",
		},
		footer: {
			description: "<footer> holds further meta data, such as breaking changes and issue ids",
		},
		scope: {
			description: "<scope> marks which sub-component of the project is affected",
		},
		subject: {
			description: "<subject> is a short, high-level description of the change",
		},
		type: {
			description: "<type> holds information about the goal of a change.",
		},
	},
	settings: {
		// eslint-disable-next-line @elsikora-typescript/naming-convention
		enableMultipleScopes: false,
		scopeEnumSeparator: ",",
	},
};
