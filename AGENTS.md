# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router application. Routes and layouts live in `src/app/`; the server endpoint for stored daily rates is `src/app/api/daily-rates/route.ts`. Reusable React UI belongs in `src/components/`, Zustand state in `src/store/`, API and Redis helpers in `src/lib/`, and shared TypeScript definitions in `src/types/`. Static PWA files, icons, and screenshots are under `public/`. JSON rate caches are kept in `data/`; treat them as application data, not source modules.

Use the configured `@/*` alias for imports from `src`, for example `@/components/Header`.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies from `package-lock.json`.
- `npm run dev` starts the local development server at `http://localhost:3000`.
- `npm run lint` runs Next.js core-web-vitals and TypeScript ESLint rules.
- `npm run build` creates a production build and catches type/build integration errors.
- `npm run start` serves the completed production build.

Before opening a pull request, run at least `npm run lint` and `npm run build`.

## Coding Style & Naming Conventions

Write strict TypeScript and functional React components. Follow existing formatting: double quotes, semicolons, trailing commas in multiline structures, and generally two-space indentation; clean up older inconsistent indentation when editing nearby code. Name components and their files in PascalCase (`CurrencyCard.tsx`), hooks/stores in camelCase with a `use` prefix (`useCurrencyStore.ts`), and route handlers as `route.ts`. Keep server-only data access in `src/lib` or route handlers, and mark interactive components with `"use client"` only when required.

## Testing Guidelines

No automated test framework or coverage threshold is currently configured. Validate changes with lint and a production build, then manually exercise affected flows in development. For UI work, check mobile-width layouts, light/dark themes, currency conversion, historical rates, and offline/PWA behavior as relevant. If adding tests, colocate them as `*.test.ts` or `*.test.tsx` and add the runner command to `package.json`.

## Commit & Pull Request Guidelines

Recent history favors short, imperative subjects, often using Conventional Commit prefixes such as `feat:` and `style:`; emoji appear but are optional. Keep each commit focused, for example `feat: cache daily rates in Redis`. Pull requests should explain the user-visible change, list validation performed, link related issues, and include before/after screenshots for visual changes.

## Security & Configuration

Keep secrets in `.env.local` and never commit them. Redis integration expects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; protected daily-rate writes also use `API_SECRET`. Avoid logging credentials or committing generated `.next/` output.
