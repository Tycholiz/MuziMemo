---
type: 'always_apply'
---

## Code Quality Standards

- Self-documenting code with clear variable names
- Small, focused functions
- Use TypeScript type system effectively
- Implement proper error handling
- Follow framework best practices
- Avoid long files. If a file is getting to a point where it's too big (e.g.
  150-200 lines), then ask yourself if this code can be refactored to live in
  multiple files with an emphasis on maintainability.

## Coding Guidelines

- Use TSDoc comments for all functions
- Prefer descriptive function names
- Avoid deep nesting and long functions
- Write modular code

## TypeScript Rules

- Enable strict null checks
- Disallow implicit `any`
- Prefer `const` over `let`
- Avoid unused variables and parameters
- Avoid `any` usage
- Use PascalCase for types
- Prefer `type` over `interface`

## Code Formatting

- Line length: 120 characters
- Indentation: 2 spaces
- Trailing commas: ES5
- No semicolons
- Single quotes
- Bracket spacing enabled

## Import Organization

### Quote Style

Single quotes only.

### Import Grouping

1. Framework imports (React, Express)
2. External libraries
3. Internal modules
4. Relative imports

### Example Pattern

export type ActionType = 'create' | 'update' | 'delete'

export type Resource = {
id: string
}

## Tooling

- CI/CD via GitHub Actions
- Must include `.github/workflows/ci.yml`
  - `npm run test`
  - `npx tsc`
  - Linting

## Testing

### Mandatory Test Coverage

- Include comprehensive unit tests for all modified, added, or refactored functions
- Every public function, method, and exported utility should have corresponding test coverage where it makes sense to do so

### File Naming Convention

Tests must be co-located with source files using the pattern `[filename].test.[ext]`

**Examples:**

- `utils.ts` → `utils.test.ts`
- `UserService.js` → `UserService.test.js`
- `components/Button.tsx` → `components/Button.test.tsx`

### Purposeful Test Design

Each test must serve a clear purpose and validate specific functionality. Tests should:

- Cover happy path scenarios and expected inputs
- Test edge cases, boundary conditions, and error handling
- Validate return values, side effects, and state changes
- Include both positive and negative test cases
- Test async functions with proper await/promise handling

### Test Quality Standards

- **Descriptive Names**: Use test names that explain what is being tested and expected outcome
- **AAA Pattern**: Follow Arrange, Act, Assert structure for clarity
- **Proper Mocking**: Mock external dependencies appropriately
- **Behavior Focus**: Avoid testing implementation details; focus on behavior and contracts
- **Isolation**: Ensure tests are deterministic and can run independently

### Coverage Requirements

Aim for meaningful coverage rather than percentage targets. Priority areas include:

- Business logic and critical functions
- Complex conditional logic and branching
- Error handling and validation logic
- Public APIs and interfaces

### Test Maintenance

- Update existing tests when function signatures, behavior, or contracts change
- Remove obsolete tests that no longer serve a valid purpose or test deprecated functionality

## Agent Instructions

- Place tests in a `__tests__` folder alongside code
- Run `npm run test` and `npx tsc` after changes

---

## React Native Coding Guidelines

### Component Structure

- Function components only
- Props interface named `${ComponentName}Props`
- Declare `Props` inline in the file

### Theming

Use the `theme.ts` file found at `src/theme.ts` for all colors and font families

### Styles

Use built-in React Native StyleSheet for styling

### Component File Order

1. Imports
2. Helper functions
3. Props interface
4. Component definition
5. Style declarations

### Naming Conventions

#### Hooks

- `use{Feature}{Action}` (e.g. `useUserAuth`)

#### Stores

- `{feature}Store` (e.g. `authStore`)
- State interface: `${StoreName}State`

### Documentation

Unless named very obviously, functions and classes should have accompanying JSDoc comments
