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

Whether you're working on a solo project or collaborating in a large team, this tool eliminates the cognitive overhead of crafting perfect commit messages while maintaining a consistent, high-quality Git history. It supports multiple AI providers including OpenAI's GPT-4.1, Anthropic's Claude 4, Google's Gemini 2.5, and even local models through Ollama.

The plugin intelligently analyzes your staged changes, understands the context of your modifications, and generates commit messages that not only follow the conventional format but also provide meaningful descriptions of the changes. With automatic validation and smart retry mechanisms, it ensures every commit message meets your project's standards.

## 🚀 Features
- ✨ **🤖 **AI-Powered Generation** - Leverage GPT-4.1, Claude 4, Gemini 2.5, and more to create contextually relevant commit messages**
- ✨ **✅ **Commitlint Integration** - Automatically validates and fixes messages to comply with your project's Commitlint rules**
- ✨ **🔄 **Smart Retry Mechanism** - Intelligently retries generation and validation with configurable attempts**
- ✨ **🎯 **Clean Architecture** - Built with SOLID principles, dependency injection, and clear separation of concerns**
- ✨ **🌐 **Multi-Provider Support** - Choose from OpenAI, Anthropic, Google, Azure, AWS Bedrock, or local Ollama models**
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
```

#### 2. Configuration File

Create `.elsikora/commitlint-ai.config.js`:

```javascript
export default {
  provider: 'openai',
  model: 'gpt-4.1',
  mode: 'auto',
  maxRetries: 3,
  validationMaxRetries: 3
};
```

#### 3. Package.json

```json
{
  "elsikora": {
    "commitlint-ai": {
      "provider": "anthropic",
      "model": "claude-opus-4-20250514",
      "mode": "auto"
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

#### Custom Instructions

Provide project-specific guidance to the AI:

```javascript
// commitlint-ai.config.js
export default {
  provider: 'openai',
  model: 'gpt-4.1',
  instructions: 'Focus on business impact and user-facing changes. Use present tense.'
};
```

#### Retry Configuration

```javascript
export default {
  maxRetries: 5,              // AI generation retries
  validationMaxRetries: 3     // Validation fix attempts
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
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor']],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
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
```

#### Debug Mode

```bash
DEBUG=commitizen-ai git cz
```

## 🛣 Roadmap
| Task / Feature | Status |
|----------------|--------|
| Core AI-powered commit generation | ✅ Done |
| Multi-provider support (OpenAI, Anthropic, Google) | ✅ Done |
| Commitlint rule integration | ✅ Done |
| Clean architecture implementation | ✅ Done |
| Automatic validation and fixing | ✅ Done |
| Environment variable support | ✅ Done |
| Cosmiconfig integration | ✅ Done |
| Interactive mode switching | ✅ Done |
| Breaking change detection | ✅ Done |
| AWS Bedrock and Azure OpenAI support | ✅ Done |
| Local Ollama model support | ✅ Done |
| Custom prompt templates | 🚧 In Progress |
| Multi-language commit messages | 🚧 In Progress |
| Git hook integration | 🚧 In Progress |
| VS Code extension | 🚧 In Progress |
| Team collaboration features | 🚧 In Progress |
| Commit message analytics | 🚧 In Progress |
| GitHub Copilot integration | 🚧 In Progress |
| Performance optimizations for monorepos | 🚧 In Progress |

## ❓ FAQ
**Q: Which AI providers are supported?**
A: The plugin supports OpenAI (GPT-4.1, GPT-4o), Anthropic (Claude 4, Claude 3.5), Google (Gemini 2.5), Azure OpenAI, AWS Bedrock, and local Ollama models. Each provider offers different models optimized for various use cases.

**Q: How does the AI understand my code changes?**
A: The plugin analyzes your git diff, staged files, and file paths to understand the context. It then uses this information along with your Commitlint rules to generate appropriate conventional commit messages.

**Q: Is my code sent to AI services?**
A: Only the git diff and file names are sent to generate accurate commit messages. Full source code files are not transmitted unless they appear in the diff. For sensitive projects, consider using Ollama for local processing.

**Q: What happens if the AI service is unavailable?**
A: The plugin has a configurable retry mechanism with real-time status updates. If all retries fail, it automatically falls back to the guided manual mode, ensuring you can always create commits.

**Q: Can I customize the commit message format?**
A: Yes! The plugin fully respects your Commitlint configuration. You can define custom types, scopes, and rules. Additionally, you can provide custom instructions to guide the AI's generation style.

**Q: How do I switch between AI and manual modes?**
A: When you run `git cz`, you'll be prompted to choose your mode. You can also set a default mode in the configuration or create a `.elsikora/manual` file to force manual mode.

**Q: Is it safe to store API keys?**
A: The plugin prioritizes security by reading API keys from environment variables. Keys are never stored in configuration files. For added security, you can also input keys per session.

**Q: Can I use this with my existing Commitizen setup?**
A: Absolutely! This is a drop-in replacement for other Commitizen adapters. It works seamlessly with your existing Commitlint configuration and Git workflow.

**Q: What's the difference between generation and validation retries?**
A: Generation retries (`maxRetries`) handle AI service failures, while validation retries (`validationMaxRetries`) attempt to fix commit messages that don't pass Commitlint rules.

**Q: How much does it cost to use?**
A: The plugin itself is free and open-source. You'll need to pay for API usage with your chosen AI provider, or use free local models with Ollama.

## 🔒 License
This project is licensed under **MIT License - see [LICENSE](LICENSE) file for details**.
