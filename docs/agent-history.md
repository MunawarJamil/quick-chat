# Quick Chat — Agent History

This file is the short working memory for coding agents.

Agents must read this file before starting work. Keep entries concise and factual. Do not write long explanations.

## Project Overview

Quick Chat is an Nx v23 + NestJS + pnpm monorepo.

Naming convention:

* lowercase
* kebab-case
* project-prefixed names like `quick-chat-api`, `quick-chat-shared-types`

Current projects:

* `@quick-chat/quick-chat-api`
* `@quick-chat/quick-chat-api-e2e`
* `@quick-chat/quick-chat-shared-types`
* `@quick-chat/quick-chat-shared-utils`

## Important Decisions

* pnpm is the only package manager.
* Do not use npm or yarn.
* Shared libs are workspace packages.
* Any app importing a shared lib must declare it in its own `package.json` using `workspace:*`.
* `pnpm-workspace.yaml` only makes packages discoverable; it does not automatically add them as dependencies.
* No agent should commit code. Human developer commits manually.
* Agents must plan first and wait for approval before implementation.

## Completed Work

### 2026-06-18 — Initial Nx + NestJS Setup

Summary:

* Created fresh Nx workspace named `quick-chat`.
* Created NestJS backend app `quick-chat-api`.
* Created shared libs:

  * `quick-chat-shared-types`
  * `quick-chat-shared-utils`

Verification:

* `pnpm nx show projects` showed:

  * `@quick-chat/quick-chat-api`
  * `@quick-chat/quick-chat-api-e2e`
  * `@quick-chat/quick-chat-shared-types`
  * `@quick-chat/quick-chat-shared-utils`

### 2026-06-18 — Shared Utils Import Fix

Summary:

* API failed to import shared utils until the shared lib was added as a workspace dependency.
* Fixed by adding shared utils dependency to `quick-chat-api/package.json`.

Decision:

* Any shared lib imported by `quick-chat-api` must be added to `quick-chat-api/package.json`.

Example:

```json
"@quick-chat/quick-chat-shared-utils": "workspace:*"
```

Verification:

```bash
pnpm exec tsc -p quick-chat-api/tsconfig.app.json --noEmit
```

Result:

* TypeScript passed.

### 2026-06-18 — Shared Types DTO Import Test

Summary:

* Added/verified DTO export from `quick-chat-shared-types`.
* API can import DTO types from shared types package.

Example:

```ts
import type { UserDto } from '@quick-chat/quick-chat-shared-types';
```

Verification:

```bash
pnpm exec tsc -p quick-chat-api/tsconfig.app.json --noEmit
```

Result:

* TypeScript passed.

## Current Next Planned Work

* Add Docker Compose for PostgreSQL and Redis.
* Add environment config with NestJS ConfigModule and Zod validation.
* Add Prisma setup and connect to PostgreSQL.
* Create base backend module folder structure.
