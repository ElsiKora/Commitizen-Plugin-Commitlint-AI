import typescript from "@rollup/plugin-typescript";

const external = ["node:fs", "node:path", "node:child_process", "node:util", "@commitlint/load", "@commitlint/types", "chalk", "dotenv", "lodash.isplainobject", "@anthropic-ai/sdk", "openai"];

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
			typescript({
				declaration: true,
				declarationDir: "dist/esm",
				outDir: "dist/esm",
				outputToFilesystem: true,
				tsconfig: "./tsconfig.json",
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
			typescript({
				declaration: true,
				declarationDir: "dist/cjs",
				outDir: "dist/cjs",
				outputToFilesystem: true,
				tsconfig: "./tsconfig.json",
			}),
		],
	},
];
