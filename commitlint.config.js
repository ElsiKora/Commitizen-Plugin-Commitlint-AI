const Configuration = {
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
		// Правила для тела сообщения (body)
		"body-case": [0, "always", "lower-case"], // Отключено: регистр тела сообщения
		"body-empty": [0, "never"], // Отключено: проверка на пустое тело
		"body-full-stop": [0, "always", "."], // Отключено: знак в конце тела

		"body-leading-blank": [2, "always"], // Ошибка: тело должно начинаться с пустой строки
		"body-max-length": [0, "always", 1000], // Отключено: максимальная длина тела
		"body-max-line-length": [2, "always", 100], // Ошибка: строки в теле не должны превышать 100 символов
		"body-min-length": [0, "always", 3], // Отключено: минимальная длина тела

		// Правила для подвала (footer)
		"footer-empty": [0, "never"], // Отключено: проверка на пустой подвал
		"footer-leading-blank": [2, "always"], // Ошибка: подвал должен начинаться с пустой строки
		"footer-max-length": [0, "always", 1000], // Отключено: максимальная длина подвала
		"footer-max-line-length": [2, "always", 100], // Ошибка: строки в подвале не должны превышать 100 символов

		"footer-min-length": [0, "always", 3], // Отключено: минимальная длина подвала
		// Правила для заголовка (header)
		"header-case": [2, "always", "lower-case"], // Отключено: регистр заголовка
		"header-full-stop": [2, "never", "."], // Ошибка: заголовок не должен заканчиваться точкой
		"header-max-length": [2, "always", 100], // Ошибка: заголовок не должен превышать 100 символов

		"header-min-length": [1, "always", 10], // Предупреждение: заголовок должен быть не менее 10 символов
		"scope-case": [2, "always", "lower-case"], // Проверяет, что область (scope) всегда в нижнем регистре
		// Дополнительные правила для области (scope)
		"scope-empty": [0, "never"], // Отключено: проверка на пустую область
		"scope-enum": [0, "always", []], // Отключено: список разрешенных областей (можно заполнить)
		"scope-max-length": [1, "always", 20], // Предупреждение: область не должна превышать 20 символов

		"scope-min-length": [0, "always", 2], // Отключено: минимальная длина области
		"subject-case": [0, "always", ["lower-case", "upper-case", "camel-case", "kebab-case", "pascal-case", "sentence-case", "snake-case", "start-case"]], // Отключено: проверка регистра темы (subject)
		// Правила для темы (subject)
		"subject-empty": [2, "never"], // Ошибка: тема не может быть пустой
		"subject-exclamation-mark": [0, "never"], // Отключено: проверка восклицательного знака перед двоеточием
		"subject-full-stop": [2, "never", "."], // Ошибка: тема не должна заканчиваться точкой
		"subject-max-length": [2, "always", 80], // Ошибка: тема не должна превышать 80 символов
		"subject-min-length": [2, "always", 3], // Ошибка: тема должна быть не менее 3 символов

		// Дополнительные правила для типа (type)
		"type-case": [2, "always", "lower-case"], // Ошибка: тип должен быть в нижнем регистре
		"type-empty": [2, "never"], // Ошибка: тип не может быть пустым
		"type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert", "wip"]], // Проверяет, что тип коммита входит в список разрешенных
		"type-max-length": [1, "always", 10], // Предупреждение: тип не должен превышать 10 символов
		"type-min-length": [1, "always", 2], // Предупреждение: тип должен быть не менее 2 символов
	},
};

export default Configuration;
