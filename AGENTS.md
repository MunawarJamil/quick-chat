# Repository Guidelines

## Project Structure & Module Organization

This repository is a pnpm-managed Nx monorepo. The NestJS service lives in `apps/quick-chat-api`; application code is under `src/app`, and `src/main.ts` is the entry point. End-to-end tests and their Jest support files live in `apps/quick-chat-api-e2e`. Reusable packages are kept at the repository root in `quick-chat-shared-types` and `quick-chat-shared-utils`; expose public APIs through each package's `src/index.ts`. Keep technical notes in `docs/`. Build output such as `dist/`, Nx cache data, and dependencies are generated and must not be committed.

## Build, Test, and Development Commands

Use pnpm from the repository root:

- `pnpm install` installs all workspace dependencies from `pnpm-lock.yaml`.
- `pnpm nx serve quick-chat-api` starts the API in development mode at `http://localhost:3000/api`.
- `pnpm nx build quick-chat-api` creates the production bundle.
- `pnpm nx test quick-chat-api` runs the API unit tests.
- `pnpm nx e2e quick-chat-api-e2e` runs the Jest end-to-end suite and starts its API dependency.
- `pnpm nx lint quick-chat-api` checks ESLint rules and Nx module boundaries.
- `pnpm nx run-many -t test lint` validates all applicable projects.

## Coding Style & Naming Conventions

Write TypeScript with two-space indentation, UTF-8 encoding, final newlines, and no trailing whitespace, as defined by `.editorconfig`. Prettier enforces single quotes; run `pnpm prettier --write .` before submitting broad formatting changes. Follow NestJS naming patterns (`*.controller.ts`, `*.service.ts`, `*.module.ts`). Use kebab-case for file names, PascalCase for classes and types, and camelCase for functions and variables. Import shared code through `@quick-chat/...` packages rather than crossing project directories directly.

## Testing Guidelines

Jest is used for unit and end-to-end tests. Place unit tests beside their implementation as `*.spec.ts`; keep API-level scenarios under `apps/quick-chat-api-e2e/src`. Add or update tests for every behavior change. No coverage threshold is configured, but new paths and failure cases should be exercised.

## Commit & Pull Request Guidelines

The history currently contains only `Initial commit`, so no established commit convention exists. Use short, imperative subjects such as `Add message validation`; keep unrelated changes separate. Pull requests should explain the change and verification commands, link relevant issues, and call out configuration or API contract changes. Include request/response examples for endpoint changes and screenshots only for user-visible output.
