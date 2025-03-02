<p align="center">
  <img src="https://6jft62zmy9nx2oea.public.blob.vercel-storage.com/commitizen-plugin-commitlint-ai-NDrywOvLY7r3a2w5qeC1bzTAaBoAtI.png" width="500" alt="project-logo">
</p>

<h1 align="center">Commitizen Plugin Commitlint AI 🤖</h1>
<p align="center"><em>AI-powered Commitizen adapter that generates conventional commits with Commitlint integration</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/version-blue.svg?style=for-the-badge&logo=npm&logoColor=white" alt="version"> <img src="https://img.shields.io/badge/typescript-blue.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript"> <img src="https://img.shields.io/badge/license-green.svg?style=for-the-badge&logo=license&logoColor=white" alt="license"> <img src="https://img.shields.io/badge/commitizen-green.svg?style=for-the-badge&logo=commitizen&logoColor=white" alt="commitizen"> <img src="https://img.shields.io/badge/commitlint-red.svg?style=for-the-badge&logo=commitlint&logoColor=white" alt="commitlint">
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
This plugin enhances your Git workflow by combining the power of AI with conventional commit standards. It intelligently analyzes your code changes and generates meaningful commit messages that follow your project's commitlint rules. Whether you're working solo or in a team, this tool helps maintain consistent, high-quality commit history while reducing the cognitive load of writing commit messages.

## 🚀 Features
- ✨ **AI-powered commit message generation using OpenAI or Anthropic models**
- ✨ **Full integration with Commitlint rules and configuration**
- ✨ **Support for both manual and automatic commit modes**
- ✨ **Smart scope detection based on changed files**
- ✨ **Breaking change detection and documentation**
- ✨ **Customizable commit message format**
- ✨ **Interactive commit message confirmation**
- ✨ **Supports multiple AI models including GPT-4, Claude 3, and more**
- ✨ **Environment variable support for API keys**
- ✨ **Fallback to manual mode if AI generation fails**

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

### Configuration

```javascript
// commitlint.config.js
module export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor']],
    'scope-case': [2, 'always', 'lower-case']
  }
}
```

### Environment Variables

```bash
# .env
OPENAI_API_KEY=your-api-key
# or
ANTHROPIC_API_KEY=your-api-key
```

### Manual Mode

```bash
# Create .elsikora/manual file to enable manual mode
mkdir -p .elsikora
touch .elsikora/manual
```

### Advanced Usage with TypeScript

```typescript
import { getLLMConfig, setLLMConfig } from '@elsikora/commitizen-plugin-commitlint-ai';

// Configure AI provider
setLLMConfig({
  provider: 'openai',
  model: 'gpt-4',
  mode: 'auto',
  apiKey: process.env.OPENAI_API_KEY
});
```

### Custom Prompt Configuration

```javascript
// .elsikora/commitlint-ai.config.js
export default {
  provider: 'anthropic',
  model: 'claude-3-opus-20240229',
  mode: 'auto'
};
```

## 🛣 Roadmap
| Task / Feature | Status |
|---------------|--------|
| Future development plans include: | 🚧 In Progress |
| - Support for more AI providers | 🚧 In Progress |
| - Enhanced diff analysis for better commit suggestions | 🚧 In Progress |
| - Custom prompt templates | 🚧 In Progress |
| - Integration with more Git hosting platforms | 🚧 In Progress |
| - Performance optimizations for large codebases | 🚧 In Progress |
| - Multi-language support for commit messages | 🚧 In Progress |
| - Team collaboration features | 🚧 In Progress |
| (done) AI-powered commit message generation using OpenAI or Anthropic models | 🚧 In Progress |
| (done) Full integration with Commitlint rules and configuration | 🚧 In Progress |
| (done) Support for both manual and automatic commit modes | 🚧 In Progress |

## ❓ FAQ
**Q: How does the AI generate commit messages?**
A: The plugin analyzes your git diff and changed files, then uses AI to understand the changes and generate appropriate conventional commit messages that comply with your commitlint rules.

**Q: What happens if the AI service is unavailable?**
A: The plugin automatically falls back to manual mode, allowing you to enter commit messages traditionally.

**Q: Can I use custom commit message formats?**
A: Yes, the plugin respects your commitlint configuration and generates messages accordingly.

**Q: Is my code sent to the AI service?**
A: Only the git diff and file names are sent to generate accurate commit messages. No full source code is transmitted.

## 🔒 License
This project is licensed under **MIT License**.
