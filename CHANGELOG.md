# [2.1.0](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/compare/v2.0.1...v2.1.0) (2025-12-17)


### Features

* **llm:** update model enums with latest versions across all providers ([89557b4](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/89557b4357cbc8614960301ef85ddc627df59cc4))

## [2.0.1](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/compare/v2.0.0...v2.0.1) (2025-06-04)

# [2.0.0](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/compare/v1.2.0...v2.0.0) (2025-05-25)


### Code Refactoring

* **architecture:** migrate to clean architecture with domain-driven design ([ee754c9](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/ee754c9244334bba1b8d4aab5eba0d6314cd21c4))
* **core:** migrate to esm modules and update dependencies ([ed2c8df](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/ed2c8df93615c2af67d3a93c55962c561c3295e7))
* **prompts:** replace inquirer with custom prompts interface ([aaa49e8](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/aaa49e8c9b08bd34f1719671f79593986062a6d5))


### Features

* **llm:** add support for multiple llm providers ([14aa53e](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/14aa53e3b446002313b8dab0ce8063dab608f8e2))


### BREAKING CHANGES

* **llm:** Configuration format has changed. Users must update their
commitlint-ai.config.js to specify the provider and model explicitly.
The old format is no longer supported.

Implemented comprehensive LLM provider support with clean architecture principles.
Added four new LLM service implementations:
- AWS Bedrock with Claude models support
- Azure OpenAI with GPT-4 and GPT-3.5 models
- Google AI with Gemini models
- Ollama for local model execution

Each provider includes:
- Proper error handling and retry logic
- Model-specific configurations and constraints
- Token counting and validation
- Streaming response support where applicable

Updated configuration system to support provider-specific settings.
Enhanced documentation with detailed setup instructions for each provider.
* **core:** This package now requires Node.js with ESM support.
Consumers must update their import statements to use ESM syntax.

This commit refactors the entire codebase to use ESM modules instead of CommonJS.
Key changes include:
- Updated all import/export statements to use ESM syntax
- Converted require() calls to import statements
- Updated package.json to use "type": "module"
- Refactored rollup configuration for ESM compatibility
- Updated all file extensions in imports to include .js
- Reorganized exports to use named exports consistently

Additionally, this commit includes dependency updates and improvements to the overall
code structure for better maintainability.
* **architecture:** Internal architecture completely changed. External API remains compatible.

Restructured the entire codebase to follow clean architecture principles and domain-driven
design patterns. This major refactoring improves code organization, testability, and
maintainability.

Key changes:
- Separated code into domain, application, infrastructure, and presentation layers
- Introduced use cases for core business logic (configure LLM, generate commit, manual commit,
validate commit)
- Created domain entities and value objects for type safety and business rule enforcement
- Implemented repository pattern for git operations
- Added dependency injection container for better decoupling
- Migrated from class-based to functional approach in use cases
- Removed old monolithic classes (Process, ManualProcess, Question, etc.)
- Reorganized LLM services with proper interfaces and implementations
- Enhanced configuration management with dedicated service

This refactoring maintains all existing functionality while providing a more scalable and
maintainable foundation for future development.
* **prompts:** The public API has changed. The prompter function no
longer requires an inquirer instance as the first parameter.
The parameter is kept for backward compatibility but is ignored.
Applications using this library will need to update their integration code.

Replaced the inquirer dependency with a custom prompts interface
built on top of the prompts library.
This change provides a more consistent and maintainable API for
handling user prompts throughout the application.

Key changes:
- Created new PromptsInterface abstraction in src/services/promptsInterface.ts
- Replaced all inquirer.prompt calls with promptsInterface.prompt
- Updated question types to match the new interface
- Removed inquirer from dependencies
- Added prompts library as a dependency
- Updated AI model configurations (Anthropic and OpenAI models)
- Fixed various linting issues and improved type safety.

# [1.2.0](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/compare/v1.1.0...v1.2.0) (2025-04-17)

### Features

- **commit:** add interactive commit message editor for rejected ai suggestions ([67c7fab](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/67c7fabb2eb99d305ab29c7dba60d7abb741300f))

# [1.1.0](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/compare/v1.0.0...v1.1.0) (2025-04-16)

### Features

- **commit-flow:** add option to switch between manual and ai commit modes ([fd8d653](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/fd8d653f9f8933dcddcb9305b43759519067c70d))

# 1.0.0 (2025-03-03)

### Features

- **commitlint:** enhance rule processing and ai integration ([fb7c49c](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/fb7c49c038a9d691c6a46fe5eb96dca7f5ca806c))
- **czai:** Add AI-powered commit message generation ([32b7676](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/32b7676de2b4817f9b25a61ae738ac2d4ea57b2f)), closes [#123](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/issues/123) [#456](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/issues/456)
- FFF ([39ecf7b](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/39ecf7b20c76b0d8294b878d283de51daa7be3a5))
- **global:** remove unused test and utility files ([3b54585](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/3b545851718b636e8d7719e03f28ec172a7c5cff))
- **validation:** add commit message validation and auto-fixing capability ([e7ae73b](https://github.com/ElsiKora/Commitizen-Plugin-Commitlint-AI/commit/e7ae73b7a4bb147b126f8b63e08855c408860489))
