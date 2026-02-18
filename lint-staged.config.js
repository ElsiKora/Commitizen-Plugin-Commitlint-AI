export default {
	"*": (files) => {
		const commands = [];
		commands.push("prettier --write --ignore-unknown");

		const eslintFiles = files.filter((file) => {
			const validExtensions = ["js", "jsx", "mjs", "cjs", "ts", "tsx", "json", "jsonc", "yml", "yaml"];
			const fileExtension = file.split(".").pop();
			const hasValidExtension = validExtensions.includes(fileExtension);
			const hasNoExtension = !file.includes(".");

			return hasValidExtension && !hasNoExtension;
		});

		if (eslintFiles.length > 0) {
			commands.push(`eslint --fix --max-warnings=0 --no-ignore ${eslintFiles.join(" ")}`);
		}

		return commands;
	},
};
