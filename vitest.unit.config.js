import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		coverage: {
			all: true,
			exclude: ["node_modules/", "dist/", "**/index.ts", "src/index.ts", "**/*.d.ts", "**/test/**", "**/*.interface.ts", "**/*.type.ts", "*.config.js", "*.config.ts", ".elsikora/**"],
			include: ["src/**/*.ts", "bin/**/*.js", "!src/index.ts", "!bin/index.js"],
			provider: "v8",
			reporter: ["text", "json", "html"],
		},
		environment: "node",
		exclude: ["**/node_modules/**", "**/dist/**", "**/test/e2e/**"],
		globals: true,
		include: ["**/*.test.ts"],
		root: ".",
		watch: false,
	},
});
