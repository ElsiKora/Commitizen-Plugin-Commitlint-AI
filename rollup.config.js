import typescript from "@rollup/plugin-typescript";

export default [
	{
		external: [],
		input: "src/index.ts",
		output: {
			dir: "dist/esm",
			format: "esm",
			preserveModules: true,
		},
		plugins: [
			typescript({
				declaration: true,
				declarationDir: "dist/esm",
				outDir: "dist/esm",
				tsconfig: "./tsconfig.json",
			}),
		],
	},
	{
		external: [],
		input: "src/index.ts",
		output: {
			dir: "dist/cjs",
			exports: "named",
			format: "cjs",
			preserveModules: true,
		},
		plugins: [
			typescript({
				declaration: true,
				declarationDir: "dist/cjs",
				outDir: "dist/cjs",
				tsconfig: "./tsconfig.json",
			}),
		],
	},
];
