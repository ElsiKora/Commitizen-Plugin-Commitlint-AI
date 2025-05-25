import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a temporary git repository for e2e testing
 */
export async function createTestRepo(): Promise<string> {
	const tmpDir = path.join(__dirname, "../../../.tmp-test-repo-" + Date.now());
	await fs.mkdir(tmpDir, { recursive: true });

	// Initialize git repo
	execSync("git init", { cwd: tmpDir });
	execSync('git config user.email "test@example.com"', { cwd: tmpDir });
	execSync('git config user.name "Test User"', { cwd: tmpDir });

	return tmpDir;
}

/**
 * Cleans up a test repository
 */
export async function cleanupTestRepo(repoPath: string): Promise<void> {
	try {
		await fs.rm(repoPath, { recursive: true, force: true });
	} catch (error) {
		// Ignore errors during cleanup
	}
}

/**
 * Stages files in the test repository
 */
export async function stageFiles(repoPath: string, files: Record<string, string>): Promise<void> {
	for (const [filename, content] of Object.entries(files)) {
		const filePath = path.join(repoPath, filename);
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content);
		execSync(`git add ${filename}`, { cwd: repoPath });
	}
}

/**
 * Creates a test environment configuration
 */
export async function createTestEnv(repoPath: string, provider: string, apiKey: string): Promise<void> {
	const envContent = `
COMMITIZEN_AI_PROVIDER=${provider}
COMMITIZEN_AI_API_KEY=${apiKey}
COMMITIZEN_AI_MODEL=test-model
COMMITIZEN_AI_AUTO_COMMIT=false
`;
	await fs.writeFile(path.join(repoPath, ".env"), envContent.trim());
}

/**
 * Creates a commitizen configuration file
 */
export async function createCzConfig(repoPath: string, configPath: string = path.resolve(__dirname, "../../index.cjs")): Promise<void> {
	const packageJson = {
		name: "test-repo",
		version: "1.0.0",
		scripts: {
			commit: "cz",
		},
		config: {
			commitizen: {
				path: configPath,
			},
		},
	};

	await fs.writeFile(path.join(repoPath, "package.json"), JSON.stringify(packageJson, null, 2));
}

/**
 * Runs the commitizen CLI in the test repository
 */
export function runCommitizen(repoPath: string, input?: string): { stdout: string; stderr: string } {
	try {
		const result = execSync(`npx cz`, {
			cwd: repoPath,
			input: input || "",
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		return { stdout: result.toString(), stderr: "" };
	} catch (error: any) {
		return {
			stdout: error.stdout?.toString() || "",
			stderr: error.stderr?.toString() || error.message,
		};
	}
}

/**
 * Gets the last commit message in the repository
 */
export function getLastCommitMessage(repoPath: string): string {
	try {
		return execSync("git log -1 --pretty=%B", { cwd: repoPath, encoding: "utf8" }).trim();
	} catch {
		return "";
	}
}

/**
 * Creates a mock API server for testing
 */
export async function createMockApiServer(_port: number, _responses: Record<string, any>): Promise<() => void> {
	// This is a simplified mock - in real tests you might use something like msw

	// Return a cleanup function
	return () => {
		// Cleanup logic here
	};
}
