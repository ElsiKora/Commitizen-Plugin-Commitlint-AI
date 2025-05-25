# Test Suite

This directory contains comprehensive unit and end-to-end tests for the Commitizen Plugin Commitlint AI.

## Structure

```
test/
├── unit/                 # Unit tests mirroring src/ structure
│   ├── application/      # Application layer tests
│   ├── domain/          # Domain layer tests
│   └── infrastructure/  # Infrastructure layer tests
├── e2e/                 # End-to-end integration tests
│   └── integration/     # Full flow integration tests
├── mocks/               # Shared mock implementations
│   ├── llm-service.mock.ts
│   └── commit-message.mock.ts
└── helpers/             # Test utilities and helpers
    ├── test-utils.ts    # Common test utilities
    └── e2e-utils.ts     # E2E specific utilities
```

## Running Tests

### Prerequisites

First, install the test dependencies:

```bash
npm install
```

### Unit Tests

Run all unit tests:

```bash
npm run test:unit
```

Run unit tests in watch mode:

```bash
vitest run test/unit --config vitest.config.unit.ts --watch
```

Run unit tests with coverage:

```bash
vitest run test/unit --config vitest.config.unit.ts --coverage
```

### E2E Tests

E2E tests require the project to be built first:

```bash
npm run build
npm run test:e2e
```

### All Tests

Run both unit and e2e tests:

```bash
npm run test:all
```

## Test Conventions

### Unit Tests

- Test files are named `*.test.ts`
- Test files mirror the source file structure (e.g., `src/domain/entity/foo.ts` → `test/unit/domain/entity/foo.test.ts`)
- Use descriptive test names following the pattern: "should [expected behavior] when [condition]"
- Mock external dependencies using the provided mock utilities
- Group related tests using `describe` blocks

### E2E Tests

- Test complete user flows and integrations
- Use the built distribution (`dist/`) for imports
- Create temporary git repositories for testing
- Clean up test artifacts after each test

### Mock Conventions

- Shared mocks are placed in `test/mocks/`
- Mock implementations should be minimal but complete
- Use vitest's `vi.fn()` for creating mock functions
- Reset mocks in `beforeEach` hooks

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MyClass } from "../../../src/domain/my-class";

describe("MyClass", () => {
	let instance: MyClass;

	beforeEach(() => {
		instance = new MyClass();
		vi.clearAllMocks();
	});

	it("should do something when condition is met", () => {
		// Arrange
		const input = "test";

		// Act
		const result = instance.doSomething(input);

		// Assert
		expect(result).toBe("expected");
	});
});
```

### E2E Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestRepo, cleanupTestRepo } from "../../helpers/e2e-utils";

describe("Feature E2E", () => {
	let testRepoPath: string;

	beforeEach(async () => {
		testRepoPath = await createTestRepo();
	});

	afterEach(async () => {
		await cleanupTestRepo(testRepoPath);
	});

	it("should complete user flow", async () => {
		// Test implementation
	});
});
```

## Coverage

Test coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view detailed coverage information.

Coverage thresholds are configured in the vitest config files:

- Unit tests aim for high coverage of business logic
- E2E tests focus on critical user paths

## Debugging Tests

To debug a specific test:

1. Add `--inspect` flag to the test command
2. Use `it.only()` to run a single test
3. Use `console.log()` or debugger statements
4. Check test output for detailed error messages

## CI/CD Integration

Tests are automatically run in CI/CD pipelines. Ensure all tests pass locally before pushing changes.
