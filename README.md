<p align="center">
  <img src="https://6jft62zmy9nx2oea.public.blob.vercel-storage.com/commitizen-plugin-commitlint-ai-NDrywOvLY7r3a2w5qeC1bzTAaBoAtI.png" width="500" alt="project-logo">
</p>

<h1 align="center">Commitizen Plugin Commitlint AI 🤖</h1>
<p align="center"><em>AI-powered Commitizen adapter that generates conventional commits with Commitlint integration, built with clean architecture principles</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/version-blue.svg?style=for-the-badge&logo=npm&logoColor=white" alt="version"> <img src="https://img.shields.io/badge/typescript-blue.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript"> <img src="https://img.shields.io/badge/license-green.svg?style=for-the-badge&logo=license&logoColor=white" alt="license"> <img src="https://img.shields.io/badge/commitizen-green.svg?style=for-the-badge&logo=commitizen&logoColor=white" alt="commitizen"> <img src="https://img.shields.io/badge/commitlint-red.svg?style=for-the-badge&logo=commitlint&logoColor=white" alt="commitlint">
</p>

## 📚 Table of Contents

- [Description](#-description)
- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [License](#-license)

## 📖 Description

This plugin enhances your Git workflow by combining the power of AI with conventional commit standards. Built with clean architecture principles, it intelligently analyzes your code changes and generates meaningful commit messages that follow your project's commitlint rules. Whether you're working solo or in a team, this tool helps maintain consistent, high-quality commit history while reducing the cognitive load of writing commit messages.

## 🚀 Features

- ✨ **AI-powered commit message generation using OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, or Ollama models**
- ✨ **Full integration with Commitlint rules and configuration**
- ✨ **Flexible configuration with Cosmiconfig support**
- ✨ **Environment variable support for API keys (prioritized over config)**
- ✨ **Automatic model migration for deprecated models**
- ✨ **Configurable retry mechanism for generation and validation**
- ✨ **Support for both manual and automatic commit modes**
- ✨ **Smart scope detection based on changed files**
- ✨ **Breaking change detection and documentation**
- ✨ **Interactive commit message confirmation with validation**
- ✨ **Clean architecture with dependency injection**
- ✨ **Real-time retry status updates in the UI**
- ✨ **Supports latest AI models including GPT-4.1 and Claude 4**
- ✨ **Fallback to manual mode if AI generation fails**

## 🏗 Architecture

The plugin is built using clean architecture principles with clear separation of concerns:

### Layers

- **Domain Layer**: Core business logic, entities, and value objects

  - Entities: `CommitMessage`, `LLMConfiguration`
  - Value Objects: `ApiKey`, `CommitBody`, `CommitHeader`
  - Enums: `ECommitMode`, `ELLMProvider`, `ELogLevel`

- **Application Layer**: Use cases and interfaces

  - Use Cases: `GenerateCommitMessageUseCase`, `ValidateCommitMessageUseCase`, `ConfigureLLMUseCase`
  - Interfaces: `ILLMService`, `ICommitValidator`, `IConfigService`, etc.

- **Infrastructure Layer**: External services and implementations

  - LLM Services: `OpenAILLMService`, `AnthropicLLMService`, `GoogleLLMService`, `AzureOpenAILLMService`, `AWSBedrockLLMService`, `OllamaLLMService`
  - Services: `CommitlintValidatorService`, `CosmicConfigService`, `PromptsCliInterface`
  - Repositories: `GitCommitRepository`

- **Presentation Layer**: User interface adapters
  - `CommitizenAdapter` as the main entry point

### Dependency Injection

The plugin uses `@elsikora/cladi` for dependency injection, ensuring loose coupling and testability.

## 🛠 Installation

```bash
# Using npm
npm install --save-dev @elsikora/commitizen-plugin-commitlint-ai

# Using yarn
yarn add -D @elsikora/commitizen-plugin-commitlint-ai

# Using pnpm
pnpm add -D @elsikora/commitizen-plugin-commitlint-ai

# Configure commitizen to use the adapter
npx commitizen init @elsikora/commitizen-plugin-commitlint-ai --save-dev --save-exact
```

## 💡 Usage

### Basic Usage

```bash
# Commit changes using the AI-powered adapter
git add .
git cz
```

The plugin will:

1. Ask for your commit mode preference (auto/manual)
2. If auto mode and no API key is configured, guide you through configuration
3. Generate or help you write a commit message
4. Validate against your commitlint rules
5. Allow you to confirm or edit before committing

### Environment Variables

```bash
# .env or shell environment
OPENAI_API_KEY=your-openai-api-key
# or
ANTHROPIC_API_KEY=your-anthropic-api-key
# or
GOOGLE_API_KEY=your-google-api-key
# or (for Azure OpenAI, use pipe-separated format)
AZURE_OPENAI_API_KEY=https://your-resource.openai.azure.com|your-api-key|your-deployment-name
# or (for AWS Bedrock, use pipe-separated format)
AWS_BEDROCK_API_KEY=us-east-1|your-access-key-id|your-secret-access-key
# or (for Ollama, specify host and optional model)
OLLAMA_API_KEY=localhost:11434|custom-model-name
```

Environment variables take precedence over stored configuration.

## ⚙️ Configuration

The plugin supports multiple configuration methods using [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig):

### Configuration File Locations

Create a configuration file in any of these locations:

- `.commitlintairc`
- `.commitlintairc.json`
- `.commitlintairc.yaml`
- `.commitlintairc.yml`
- `.commitlintairc.js`
- `.commitlintairc.cjs`
- `commitlintai.config.js`
- `commitlintai.config.cjs`
- `package.json` (under `"commitlintai"` key)

### Configuration Options

```javascript
// commitlintai.config.js
module.exports = {
	// AI provider: 'openai', 'anthropic', 'google', 'azure-openai', 'aws-bedrock', or 'ollama'
	provider: "openai",

	// Model to use (auto-migrates deprecated models)
	model: "gpt-4o",

	// Mode: 'auto' or 'manual'
	mode: "auto",

	// API key (optional - env vars recommended)
	// Format varies by provider:
	// - OpenAI/Anthropic/Google: 'your-api-key'
	// - Azure OpenAI: 'endpoint|api-key|deployment-name'
	// - AWS Bedrock: 'region|access-key-id|secret-access-key'
	// - Ollama: 'host:port' or 'host:port|custom-model-name'
	apiKey: "your-api-key",

	// Retry configuration
	maxGenerationRetries: 3,
	maxValidationRetries: 3,

	// Custom instructions for AI
	instructions: "Focus on user-facing changes",
};
```

### Available Models

## Supported LLM Providers

### OpenAI

- `gpt-4.1` (Latest 2025, most capable)
- `gpt-4.1-nano` (Fastest 4.1 model)
- `gpt-4.1-mini` (Balanced performance)
- `gpt-4o` (Enhanced creative writing)
- `gpt-4o-mini` (Faster, cost-effective)
- `gpt-4-turbo`
- `gpt-4` (Original)
- `gpt-3.5-turbo` (Fastest, most economical)
- `o1` (Enhanced reasoning)
- `o1-mini` (Fast reasoning)

### Anthropic

- `claude-opus-4-20250514` (Latest 2025, most capable)
- `claude-sonnet-4-20250514` (Latest 2025, high-performance)
- `claude-3-7-sonnet-latest` (Extended thinking capabilities)
- `claude-3-5-sonnet-latest` (Previous flagship)
- `claude-3-5-haiku-latest` (Fastest)
- `claude-3-opus-latest` (Complex tasks)

### Google (Gemini)

- `gemini-2.5-pro` (Latest 2025, most capable)
- `gemini-2.5-flash` (Latest 2025, fast)
- `gemini-2.0-flash-exp` (Experimental)
- `gemini-1.5-pro` (Stable, capable)
- `gemini-1.5-flash` (Fast, stable)
- `gemini-1.5-flash-8b` (Lightweight)
- `gemini-1.0-pro`

### Google (Gemma - Open Models for Vertex AI)

- `gemma-3-27b` (Most capable open model)
- `gemma-3-12b` (Strong language capabilities)
- `gemma-3-4b` (Balanced, multimodal support)
- `gemma-3-1b` (Lightweight for edge deployment)

### Azure OpenAI

- `gpt-4.1-turbo-2024-12-17` (Latest 2025, most capable)
- `gpt-4.1-preview-2024-12-17` (Latest preview)
- `gpt-4.1-mini-2024-12-17` (Fast 4.1 model)
- `gpt-4o-2024-11-20` (Enhanced creative)
- `gpt-4o-mini-2024-07-18`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `o3-2024-12-17` (Enhanced reasoning)
- `o4-mini-2024-12-17` (Fast reasoning)

### AWS Bedrock

- `anthropic.claude-opus-4-20250514-v1:0` (Claude Opus 4 - Latest 2025, most capable)
- `anthropic.claude-sonnet-4-20250514-v1:0` (Claude Sonnet 4 - Latest 2025, balanced)
- `anthropic.claude-3-5-sonnet-20241022-v2:0` (Claude 3.5 Sonnet v2)
- `anthropic.claude-3-5-haiku-20241022-v1:0` (Fast)
- `anthropic.claude-3-5-sonnet-20240620-v1:0`
- `us.amazon.nova-pro-v1:0` (Latest Amazon model)
- `us.deepseek.deepseek-r1:0` (Advanced reasoning)
- `us.meta.llama3-2-90b-instruct-v1:0` (Open source)
- `mistral.mistral-large-2411-v1:0` (Latest Mistral)

### Ollama (Local Models)

- `llama3.2` (Latest Llama)
- `llama3.1`
- `llama3`
- `mistral`
- `codellama`
- `deepseek-coder`
- `custom` (specify any Ollama model)

### Commitlint Configuration

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

### Manual Mode

To force manual mode without prompting:

```bash
# Create .elsikora/manual file
mkdir -p .elsikora
touch .elsikora/manual
```

### Package.json Configuration

```json
{
	"commitlintai": {
		"provider": "anthropic",
		"model": "claude-3-5-sonnet-20241022",
		"mode": "auto",
		"maxGenerationRetries": 5
	}
}
```

## 🛣 Roadmap

| Task / Feature                                                        | Status      |
| --------------------------------------------------------------------- | ----------- |
| AI-powered commit message generation using OpenAI or Anthropic models | ✅ Complete |
| Full integration with Commitlint rules and configuration              | ✅ Complete |
| Support for both manual and automatic commit modes                    | ✅ Complete |
| Clean architecture implementation                                     | ✅ Complete |
| Cosmiconfig support for flexible configuration                        | ✅ Complete |
| Environment variable support with priority over config                | ✅ Complete |
| Automatic model migration for deprecated models                       | ✅ Complete |
| Configurable retry mechanism with UI feedback                         | ✅ Complete |
| Dependency injection with @elsikora/cladi                             | ✅ Complete |
| Support for more AI providers (Google, Azure, AWS, Ollama)            | ✅ Complete |
| Enhanced diff analysis for better commit suggestions                  | 🚧 Planned  |
| Custom prompt templates per project                                   | 🚧 Planned  |
| Integration with more Git hosting platforms                           | 🚧 Planned  |
| Performance optimizations for large codebases                         | 🚧 Planned  |
| Multi-language support for commit messages                            | 🚧 Planned  |
| Team collaboration features                                           | 🚧 Planned  |
| Web UI for configuration management                                   | 🚧 Planned  |

## ❓ FAQ

**Q: How does the AI generate commit messages?**  
A: The plugin analyzes your git diff and changed files, then uses AI to understand the changes and generate appropriate conventional commit messages that comply with your commitlint rules.

**Q: What happens if the AI service is unavailable?**  
A: The plugin has a configurable retry mechanism and will automatically fall back to manual mode after exhausting retries, allowing you to enter commit messages traditionally.

**Q: Can I use custom commit message formats?**  
A: Yes, the plugin respects your commitlint configuration and generates messages accordingly. You can also provide custom instructions to guide the AI.

**Q: Is my code sent to the AI service?**  
A: Only the git diff and file names are sent to generate accurate commit messages. No full source code is transmitted unless it appears in the diff.

**Q: How do I switch between providers or models?**  
A: You can reconfigure at any time by running `git cz` and choosing to reconfigure when prompted, or by updating your configuration file.

**Q: How do I use Ollama with custom models?**  
A: Set the model to `custom` and include the model name in your API key: `localhost:11434|your-custom-model`.

**Q: What's the difference between provider API key formats?**  
A: Each provider has specific requirements:

- OpenAI/Anthropic/Google: Simple API key string
- Azure OpenAI: `endpoint|api-key|deployment-name`
- AWS Bedrock: `region|access-key-id|secret-access-key`
- Ollama: `host:port` or `host:port|custom-model-name`

**Q: What if I'm using an older model that's deprecated?**  
A: The plugin automatically migrates deprecated models to their latest versions (e.g., `claude-3-5-sonnet-20240620` → `claude-3-5-sonnet-20241022`).

## 🔒 License

This project is licensed under **MIT License**.
