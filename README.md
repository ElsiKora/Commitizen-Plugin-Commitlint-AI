<p align="center">
  <img src="https://6jft62zmy9nx2oea.public.blob.vercel-storage.com/commitizen-plugin-commitlint-ai-5z2uE7Wo3HXxhEkaeQQmNYyl3eWvjM.png" width="500" alt="project-logo">
</p>

<h1 align="center">🤖 Commitizen Plugin Commitlint AI</h1>
<p align="center"><em>Transform your Git workflow with AI-powered commit messages that follow conventional standards and pass Commitlint validation every time</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"> <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"> <img src="https://img.shields.io/badge/npm-CB3837.svg?style=for-the-badge&logo=npm&logoColor=white" alt="npm"> <img src="https://img.shields.io/badge/Git-F05032.svg?style=for-the-badge&logo=git&logoColor=white" alt="Git"> <img src="https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"> <img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint"> <img src="https://img.shields.io/badge/Prettier-F7B93E.svg?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier"> <img src="https://img.shields.io/badge/Vitest-6E9F18.svg?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest"> <img src="https://img.shields.io/badge/Rollup-EC4A3F.svg?style=for-the-badge&logo=rollup&logoColor=white" alt="Rollup">
</p>

## 📚 Table of Contents

- [Description](#-description)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [License](#-license)

## 📖 Description

Commitizen Plugin Commitlint AI revolutionizes the way developers write commit messages by combining the power of artificial intelligence with strict conventional commit standards. Built with clean architecture principles, this plugin seamlessly integrates with your existing Commitizen workflow to generate meaningful, context-aware commit messages that adhere to your project's Commitlint rules.

Whether you're working on a solo project or collaborating in a large team, this tool eliminates the cognitive overhead of crafting perfect commit messages while maintaining a consistent, high-quality Git history. Provider access, model catalogs, credential resolution, and runtime generation are centralized through `@elsikora/ai-core`.

The plugin intelligently analyzes your staged changes, understands the context of your modifications, and generates commit messages that not only follow the conventional format but also provide meaningful descriptions of the changes. With automatic validation and smart retry mechanisms, it ensures every commit message meets your project's standards.

## 🚀 Features

- ✨ **🤖 **AI-Powered Generation** - Leverage AI-Core providers and model catalogs to create contextually relevant commit messages**
- ✨ **✅ **Commitlint Integration** - Automatically validates and fixes messages to comply with your project's Commitlint rules**
- ✨ **🔄 **Smart Retry Mechanism** - Intelligently retries generation and validation with configurable attempts**
- ✨ **🎯 **Clean Architecture** - Built with SOLID principles, dependency injection, and clear separation of concerns**
- ✨ **🌐 **Multi-Provider Support** - Choose any provider exposed by `@elsikora/ai-core`, including OpenAI, Anthropic, Google, Azure, AWS Bedrock, Cerebras, Vercel AI Gateway, or local Ollama models**
- ✨ **🛡️ **Type-Safe** - Fully typed with TypeScript for enhanced developer experience and reliability**
- ✨ **⚡ **Flexible Configuration** - Cosmiconfig support for easy setup via JSON, YAML, or JavaScript**
- ✨ **🔐 **Secure API Key Handling** - Environment variable support with session-based key input options**
- ✨ **📝 **Manual Mode Fallback** - Seamlessly switch to guided manual entry when needed**
- ✨ **🚀 **Breaking Change Detection** - Automatically identifies and documents breaking changes**

## 🛠 Installation

```bash
# Install the plugin as a dev dependency
npm install --save-dev @elsikora/commitizen-plugin-commitlint-ai

# Initialize Commitizen with this adapter
npx commitizen init @elsikora/commitizen-plugin-commitlint-ai --save-dev --save-exact

# Install Commitlint (if not already installed)
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Create a commitlint config file
echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```

## 💡 Usage

## Basic Usage

### Quick Start

```bash
# Stage your changes
git add .

# Run the AI-powered commit wizard
git cz
# or
npm run commit
```

### Configuration Methods

The plugin supports multiple configuration approaches:

#### 1. Environment Variables (Recommended)

Credentials are resolved by AI-Core. Use the environment variable for the selected provider:

```bash
# .env file
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
# or
GOOGLE_API_KEY=AIza...
# or (Azure OpenAI)
AZURE_OPENAI_API_KEY=https://your-resource.openai.azure.com|your-api-key|your-deployment-name
# or (AWS Bedrock)
AWS_BEDROCK_API_KEY=us-east-1|access-key-id|secret-access-key
# or (Ollama)
OLLAMA_API_KEY=localhost:11434|llama3.2
# or (Cerebras)
CEREBRAS_API_KEY=...
# or (Vercel AI Gateway)
AI_GATEWAY_API_KEY=...
```

#### 2. Configuration File

AI provider/model configuration lives in `.elsikora/ai-core.config.js`:

```javascript
export default {
	modules: {
		"commitlint-plugin-commitlint-ai": {
			provider: "openai",
			model: "gpt-4o",
			retries: 3,
			validationRetries: 3,
		},
	},
};
```

Commit mode and ticket extraction settings stay in `.elsikora/commitlint-ai.config.js`:

```javascript
export default {
	mode: "auto",
	maxRetries: 3,
	validationMaxRetries: 3,
	ticket: {
		// auto | branch-lint | pattern | none
		source: "auto",
		// Used in "pattern" mode, and as fallback when configured
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		// preserve | lower | upper
		normalization: "preserve",
		// fallback | error (only for source: "branch-lint")
		missingBranchLintBehavior: "fallback",
	},
};
```

#### Ticket Source Configuration

You can control where ticket IDs are extracted from:

- `source: "branch-lint"` - parse ticket by `git-branch-lint` template (`branch-pattern`)
- `source: "pattern"` - parse ticket by local regex (`ticket.pattern`)
- `source: "auto"` - try `git-branch-lint` first, then fallback to local regex
- `source: "none"` - disable ticket extraction completely

When using `source: "branch-lint"` and branch-lint config is absent:

- `missingBranchLintBehavior: "fallback"` - fallback to local regex
- `missingBranchLintBehavior: "error"` - throw an error and stop

#### 3. Package.json

```json
{
	"elsikora": {
		"commitlint-ai": {
			"mode": "auto"
		},
		"ai-core": {
			"modules": {
				"commitlint-plugin-commitlint-ai": {
					"provider": "anthropic",
					"model": "claude-sonnet-4-5"
				}
			}
		}
	}
}
```

### Commit Modes

#### Auto Mode (AI-Powered)

The AI analyzes your changes and generates appropriate commit messages:

```bash
$ git cz
✔ Using AI-powered commit mode...
✔ AI generated initial commit message
✔ AI generated commit message successfully!

┌─────────────────────────────────┐
│ Generated commit message:        │
├─────────────────────────────────┤
│ feat(auth): implement OAuth2    │
│                                 │
│ Added OAuth2 authentication     │
│ flow with JWT token support.    │
│ Includes refresh token logic    │
│ and secure session management.  │
│                                 │
│ BREAKING CHANGE: Auth API       │
│ endpoints have been updated     │
└─────────────────────────────────┘

✔ Do you want to proceed with this commit message? (Y/n)
```

#### Manual Mode

Guided commit message creation with validation:

```bash
$ git cz
✔ Using manual commit mode...
? Select commit type: (Use arrow keys)
❯ feat: A new feature ✨
  fix: A bug fix 🐛
  docs: Documentation only changes 📚
  style: Code style changes 🎨
  refactor: Code refactoring 📦
  perf: Performance improvements 🚀
  test: Adding tests 🚨

? Enter scope (optional): auth
? Enter commit subject: add login functionality
? Enter commit body (optional):
? Is this a breaking change? No
```

### Advanced Features

#### Retry Configuration

```javascript
export default {
	maxRetries: 5, // AI generation retries
	validationMaxRetries: 3, // Validation fix attempts
};
```

#### Provider-Specific Setup

**Azure OpenAI:**

```bash
AZURE_OPENAI_API_KEY=https://myresource.openai.azure.com|api-key|gpt-4-deployment
```

**AWS Bedrock:**

```bash
AWS_BEDROCK_API_KEY=us-west-2|AKIAIOSFODNN7EXAMPLE|wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Ollama (Local):**

```bash
# Default setup
OLLAMA_API_KEY=localhost:11434

# Custom model
OLLAMA_API_KEY=localhost:11434|codellama
```

### Commitlint Integration

The plugin respects all your Commitlint rules:

```javascript
// commitlint.config.js
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor"]],
		"scope-case": [2, "always", "lower-case"],
		"subject-max-length": [2, "always", 72],
		"body-max-line-length": [2, "always", 100],
	},
};
```

### Troubleshooting

#### Force Manual Mode

```bash
# Create manual mode marker
mkdir -p .elsikora
touch .elsikora/manual
```

#### Clear Configuration Cache

```bash
rm -rf .elsikora/commitlint-ai.config.*
rm -rf .elsikora/ai-core.config.*
```

## 🛣 Roadmap

| Task / Feature                                     | Status         |
| -------------------------------------------------- | -------------- |
| Core AI-powered commit generation                  | ✅ Done        |
| Multi-provider support through AI-Core             | ✅ Done        |
| Commitlint rule integration                        | ✅ Done        |
| Clean architecture implementation                  | ✅ Done        |
| Automatic validation and fixing                    | ✅ Done        |
| Environment variable support                       | ✅ Done        |
| Cosmiconfig integration                            | ✅ Done        |
| Interactive mode switching                         | ✅ Done        |
| Breaking change detection                          | ✅ Done        |
| AWS Bedrock and Azure OpenAI support               | ✅ Done        |
| Local Ollama model support                         | ✅ Done        |
| Custom prompt templates                            | 🚧 In Progress |
| Multi-language commit messages                     | 🚧 In Progress |
| Git hook integration                               | 🚧 In Progress |
| VS Code extension                                  | 🚧 In Progress |
| Team collaboration features                        | 🚧 In Progress |
| Commit message analytics                           | 🚧 In Progress |
| GitHub Copilot integration                         | 🚧 In Progress |
| Performance optimizations for monorepos            | 🚧 In Progress |

## ❓ FAQ

**Q: Which AI providers are supported?** A: Provider and model support comes from `@elsikora/ai-core`. The current AI-Core catalog includes OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Cerebras, Vercel AI Gateway, and local Ollama models.

**Q: How does the AI understand my code changes?** A: The plugin analyzes your git diff, staged files, and file paths to understand the context. It then uses this information along with your Commitlint rules to generate appropriate conventional commit messages.

**Q: Is my code sent to AI services?** A: Only the git diff and file names are sent to generate accurate commit messages. Full source code files are not transmitted unless they appear in the diff. For sensitive projects, consider using Ollama for local processing.

**Q: What happens if the AI service is unavailable?** A: The plugin has a configurable retry mechanism with real-time status updates. If all retries fail, it automatically falls back to the guided manual mode, ensuring you can always create commits.

**Q: Can I customize the commit message format?** A: Yes! The plugin fully respects your Commitlint configuration. You can define custom types, scopes, and rules.

**Q: How do I switch between AI and manual modes?** A: When you run `git cz`, you'll be prompted to choose your mode. You can also set a default mode in the configuration or create a `.elsikora/manual` file to force manual mode.

**Q: Is it safe to store API keys?** A: Credential resolution is handled by AI-Core. Keys are read from provider environment variables or requested for the current session, and are not stored in Commitlint AI configuration files.

**Q: Can I use this with my existing Commitizen setup?** A: Absolutely! This is a drop-in replacement for other Commitizen adapters. It works seamlessly with your existing Commitlint configuration and Git workflow.

**Q: What's the difference between generation and validation retries?** A: Generation retries (`maxRetries`) handle AI service failures, while validation retries (`validationMaxRetries`) attempt to fix commit messages that don't pass Commitlint rules.

**Q: How much does it cost to use?** A: The plugin itself is free and open-source. You'll need to pay for API usage with your chosen AI provider, or use free local models with Ollama.

## 🔒 License

This project is licensed under **MIT License - see [LICENSE](LICENSE) file for details**.
