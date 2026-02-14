import { createConfig } from "@elsikora/eslint-config";

const config = {
	ignores: ["package-lock.json", "yarn.lock", "bun.lock", "pnpm-lock.yaml", "dist", "bin", "build", "out", "www", "public/build", "_site", "release", "node_modules", ".env", ".env.local", ".env.*", "coverage", ".cache", ".rollup.cache", "public", "static", "assets", "uploads", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg", "*.ico", "*.md", "*.mdx", "tmp", ".temp", "**/*.d.ts", "**/*.spec.ts", "**/*.test.ts", "**/*.e2e-spec.ts", "__tests__", "test", "tests"],
};

export default [
	config,
	...(await createConfig({
		withCheckFile: true,
		withJavascript: true,
		withJsDoc: true,
		withJson: true,
		withMarkdown: true,
		withNode: true,
		withNoSecrets: true,
		withPackageJson: true,
		withPerfectionist: true,
		withPrettier: true,
		withRegexp: true,
		withSonar: true,
		withStylistic: true,
		withTypescriptStrict: true,
		withUnicorn: true,
		withYaml: true,
	})),
	// Custom overrides for specific files
	{
		files: ["**/mock-llm.service.ts", "**/edit-commit.use-case.ts"],
		rules: {
			"@elsikora/node/no-unsupported-features/es-syntax": "off",
			"@elsikora/sonar/slow-regex": "off",
			"@elsikora/typescript/naming-convention": "off",
			"@elsikora/typescript/no-explicit-any": "off",
			"@elsikora/typescript/no-magic-numbers": "off",
			"@elsikora/typescript/no-non-null-assertion": "off",
			"@elsikora/typescript/no-unsafe-assignment": "off",
			"@elsikora/typescript/prefer-nullish-coalescing": "off",
			"@elsikora/typescript/return-await": "off",
			"@elsikora/typescript/typedef": "off",
		},
	},
];
