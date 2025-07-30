---
type: 'always_apply'
---

## Code Quality Standards

- Self-documenting code with clear variable names
- Small, focused functions
- Use TypeScript type system effectively
- Implement proper error handling
- Follow framework best practices

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

## Agent Instructions

- Add or update unit tests for modified functions. Tests should exist in a file
  that is named after the source code. For instance, if a function we are
  testing is in the file `utils.ts`, then the test file should be named
  `utils.test.ts`
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
