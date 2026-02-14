export default {
	extends: ["@commitlint/config-conventional"],
	formatter: "@commitlint/format",
	parserPreset: "conventional-changelog-conventionalcommits",
	prompt: {
		messages: {
			emptyWarning: "can not be empty",
			lowerLimitWarning: "below limit",
			max: "upper %d chars",
			min: "%d chars at least",
			skip: ":skip",
			upperLimitWarning: "over limit",
		},
		questions: {
			type: {
				description: "Select the type of change that you're committing:",
				enum: {
					build: {
						description: "🛠 Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)",
						emoji: "🛠",
						title: "Builds",
					},
					chore: {
						description: "🔩 Other changes that don't modify src or test files",
						emoji: "🔩",
						title: "Chores",
					},
					ci: {
						description: "🤖 Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)",
						emoji: "🤖",
						title: "Continuous Integrations",
					},
					docs: {
						description: "📚 Documentation only changes",
						emoji: "📚",
						title: "Documentation",
					},
					feat: {
						description: "✨ A new feature",
						emoji: "✨",
						title: "Features",
					},
					fix: {
						description: "🐛 A bug fix",
						emoji: "🐛",
						title: "Bug Fixes",
					},
					perf: {
						description: "🚀 A code change that improves performance",
						emoji: "🚀",
						title: "Performance Improvements",
					},
					refactor: {
						description: "📦 A code change that neither fixes a bug nor adds a feature",
						emoji: "📦",
						title: "Code Refactoring",
					},
					revert: {
						description: "🗑 Reverts a previous commit",
						emoji: "🗑",
						title: "Reverts",
					},
					style: {
						description: "🎨 Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)",
						emoji: "🎨",
						title: "Styles",
					},
					test: {
						description: "🚨 Adding missing tests or correcting existing tests",
						emoji: "🚨",
						title: "Tests",
					},
					wip: {
						description: "⌛️ Work in progress",
						emoji: "⌛️",
						title: "Progress",
					},
				},
			},
		},
		settings: {
			enableMultipleScopes: true,
			scopeEnumSeparator: ",",
		},
	},
	rules: {
		"body-full-stop": [0, "always", "."],
		"body-leading-blank": [2, "always"],
		"body-max-length": [0, "always", 1000],
		"body-max-line-length": [2, "always", 100],
		"footer-leading-blank": [2, "always"],
		"footer-max-line-length": [2, "always", 100],
		"header-case": [2, "always", "lower-case"],
		"header-full-stop": [2, "never", "."],
		"header-max-length": [2, "always", 100],
		"header-min-length": [1, "always", 10],
		"scope-case": [2, "always", "lower-case"],
		"scope-empty": [0, "never"],
		"scope-max-length": [1, "always", 30],
		"subject-case": [2, "always", ["lower-case"]],
		"subject-empty": [2, "never"],
		"subject-full-stop": [2, "never", "."],
		"subject-max-length": [2, "always", 80],
		"subject-min-length": [2, "always", 3],
		"type-case": [2, "always", "lower-case"],
		"type-empty": [2, "never"],
		"type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert", "wip"]],
	},
};
