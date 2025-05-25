import typescript from "@rollup/plugin-typescript";
import dtsPathAlias from "rollup-plugin-dts-path-alias";
import generatePackageJson from "rollup-plugin-generate-package-json";

const external = [
	"@aws-sdk/client-bedrock-runtime",
	"@google/generative-ai",
	"@anthropic-ai/claude-code",
	"@anthropic-ai/sdk",
	"@commitlint/ensure",
	"@commitlint/lint",
	"@commitlint/load",
	"@commitlint/types",
	"@elsikora/cladi",
	"@rollup/plugin-typescript",
	"chalk",
	"cosmiconfig",
	"dotenv",
	"dotenv/config",
	"javascript-stringify",
	"lodash.isplainobject",
	"openai",
	"ora",
	"prompts",
	"rollup",
	"word-wrap",
	"yaml",
	"commitizen",
	"node:fs",
	"node:path",
	"node:util",
	"node:child_process",
	"fs",
	"path",
	"util",
	"child_process",
	/^@commitlint\/.+/,
	/^node:.+/,
];

export default [
	{
		external,
		input: "src/index.ts",
		output: {
			dir: "dist/esm",
			format: "esm",
			preserveModules: true,
			sourcemap: true,
		},
		plugins: [
			dtsPathAlias(),
			typescript({
				declaration: true,
				declarationDir: "dist/esm",
				outDir: "dist/esm",
				outputToFilesystem: true,
				tsconfig: "./tsconfig.build.json",
			}),
			generatePackageJson({
				baseContents: { type: "module" },
				outputFolder: "dist/esm",
			}),
		],
	},
	{
		external,
		input: "src/index.ts",
		output: {
			dir: "dist/cjs",
			exports: "named",
			format: "cjs",
			preserveModules: true,
			sourcemap: true,
		},
		plugins: [
			dtsPathAlias(),
			typescript({
				declaration: true,
				declarationDir: "dist/cjs",
				outDir: "dist/cjs",
				outputToFilesystem: true,
				tsconfig: "./tsconfig.build.json",
			}),
			generatePackageJson({
				baseContents: { type: "module" },
				outputFolder: "dist/esm",
			}),
		],
	},
];
