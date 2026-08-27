# Repository Guidelines

## Project Structure & Module Organization

This Bun/Turborepo monorepo contains the React frontend in `apps/web` and Convex backend code in `packages/backend/convex`. Shared environment validation lives in `packages/env`; shared TypeScript configuration lives in `packages/config`. Frontend routes belong in `apps/web/src/routes`, reusable UI in `apps/web/src/components`, and Convex functions and schema stay under `packages/backend/convex`.

## Build, Test, and Development Commands

Run commands from the repository root:

- `bun install` installs all workspace dependencies.
- `bun run dev` starts all development tasks through Turbo.
- `bun run dev:web` starts only the Vite/TanStack Start application at port 3001.
- `bun run dev:setup` connects and configures the Convex project.
- `bun run build` produces production builds for all workspaces.
- `bun run check-types` runs TypeScript checks across the monorepo.

## Coding Style & Naming Conventions

Use TypeScript with ESM imports and two-space indentation. Name React components and exported types with PascalCase; use camelCase for functions, variables, hooks, and Convex functions. Keep route files descriptive (for example, `dashboard.tsx`) and place route-specific UI close to the route when it is not reusable. Use the `@/` alias for imports within `apps/web` when appropriate. Follow the existing Tailwind utility ordering and component patterns rather than introducing a second styling approach.

## Testing Guidelines

No dedicated automated test command is currently configured. Before opening a pull request, run `bun run check-types` and `bun run build`, then manually verify the affected web flow or Convex function. Add focused tests with any new test tooling, using descriptive names that state the behavior being checked.

## Commit & Pull Request Guidelines

Write concise, imperative commit subjects, such as `Add PostHog integration` or `Upgrade React dependencies`. Keep unrelated changes out of the same commit. Pull requests should explain the intent, list validation performed, link the relevant issue when one exists, and include screenshots or recordings for visible UI changes.

## Configuration & Security

Keep secrets in untracked `.env` or `.env.local` files; never commit API keys, tokens, or production credentials. Configure Convex before local development and copy only the required environment variables into each app's local environment file.
