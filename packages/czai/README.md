# @elsikora/commitizen-plugin-commitlint-ai

A Commitizen adapter that uses AI (OpenAI or Anthropic) to generate commit messages based on your commitlint.config.js file.

## Features

- AI-powered commit message generation
- Support for both OpenAI and Anthropic models
- Fully compatible with existing commitlint configurations
- Fallback to manual commit entry if AI fails
- Uses git diff information to generate better commit messages

## Getting started

### Configure commitizen adapter

```bash
npm install --save-dev @elsikora/commitizen-plugin-commitlint-ai commitizen inquirer@9  # inquirer is required as peer dependency
# or yarn
yarn add -D @elsikora/commitizen-plugin-commitlint-ai commitizen inquirer@9             # inquirer is required as peer dependency
```

In package.json

```json
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "@elsikora/commitizen-plugin-commitlint-ai"
    }
  }
}
```

### Configure commitlint

**⚠️ Important: The required version of commitlint and shared configuration is above 12.1.2, update them if already existed in project**

```bash
# Install commitlint cli and conventional config
npm install --save-dev @commitlint/config-conventional @commitlint/cli
# or yarn
yarn add @commitlint/config-conventional @commitlint/cli -D

# Simple: config with conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']};" > commitlint.config.js
```

### Try it out

```bash
git add .
npm run commit
# or yarn
yarn commit
```

## Usage

### AI-Powered Mode (Default)

When you run the commit command for the first time, you'll be prompted to:

1. Select an AI provider (OpenAI or Anthropic)
2. Select a model for your chosen provider
3. Enter your API key for the selected provider

Your configuration (excluding API keys) will be saved in `./.elsikora/commitlint-ai.json` in your project directory. The API key is never stored on disk - you'll need to either:

- Enter it each time you run the command
- Set it as an environment variable (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`)

The tool will then analyze your staged changes and generate a commit message that adheres to your commitlint rules.

After generating the commit message, you'll see a preview and be asked to confirm if you want to use this message. If you approve, the message will be used for your commit. If you reject it, you'll be guided through the manual commit entry process.

If AI generation fails for any reason, it automatically falls back to the standard commit format questionnaire.

### Manual Mode

If you prefer to skip the AI generation and create the commit message manually, you can use manual mode in two ways:

1. **Using an environment variable**:
   ```bash
   COMMITIZEN_AI_MANUAL=true git cz
   ```

2. **Creating a manual mode file**:
   ```bash
   mkdir -p .elsikora
   touch .elsikora/manual
   ```
   This will permanently enable manual mode for this project.

Manual mode bypasses all AI functionality and directly presents you with the standard commit questionnaire based on your commitlint configuration.

## API Keys

To avoid entering your API key each time, you can set it as an environment variable in two ways:

### 1. Using environment variables

- For OpenAI: `OPENAI_API_KEY`
- For Anthropic: `ANTHROPIC_API_KEY`

Example:
```bash
# For bash/zsh
export OPENAI_API_KEY="your-api-key-here"
git cz

# Single use
OPENAI_API_KEY="your-api-key-here" git cz
```

### 2. Using a .env file

Create a `.env` file in your project root with the API key:

```
# .env file
OPENAI_API_KEY=your-openai-key-here
# or
ANTHROPIC_API_KEY=your-anthropic-key-here
```

The plugin will automatically detect and use the API key from the .env file.

## Requirements

- Node.js v18 or higher
- Git
- OpenAI API key (if you want to use OpenAI)
- Anthropic API key (if you want to use Anthropic)

## How it works

The plugin reads your commitlint.config.js file and extracts the rules and conventions. It then:

1. Gets the git diff and file list of your staged changes
2. Analyzes the directory structure to help determine the appropriate scope
3. Sends the diff along with your commit conventions to the selected AI provider
4. The AI determines the type, scope, subject, and body based on the changes
5. Formats the AI response according to the conventional commit format
6. Returns the generated commit message for your confirmation

The scope detection is particularly intelligent:
- It analyzes which directories and files were modified
- It identifies the primary area of the codebase being changed
- It can use multiple scopes for changes that span different areas
- It uses "global" for changes that affect the entire project
- It omits the scope when it's not relevant to the changes

## Supported AI Models

### OpenAI
- GPT-4o
- GPT-4 Turbo
- GPT-4
- GPT-3.5 Turbo

### Anthropic
- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

## Related

- [Commitlint Reference Prompt](https://commitlint.js.org/reference/prompt) - How to customize prompt information by setting commitlint.config.js