export default {
	"*": (files) => {
		const commands = [];
		commands.push("prettier --write --ignore-unknown");

		const filteredFiles = files.filter((file) => !file.includes("test/") && !file.includes("vitest") && !file.includes("CHANGELOG"));

		const eslintFiles = filteredFiles.filter((file) => {
			const validExtensions = ["js", "jsx", "mjs", "cjs", "ts", "tsx", "json", "jsonc", "yml", "yaml", "md", "mdx"];
			const fileExtension = file.split(".").pop();
			const hasValidExtension = validExtensions.includes(fileExtension);
			const hasNoExtension = !file.includes(".");

			return hasValidExtension && !hasNoExtension;
		});

		if (eslintFiles.length > 0) {
			commands.push(`eslint --fix --max-warnings=0 --no-warn-ignored ${eslintFiles.join(" ")}`);
		}

		return commands;
	},
};
