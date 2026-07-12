# AGENTS.md

## Project

Chrome extension (Manifest V3) for web page fact-checking. UI is in Korean.

## Commands

```bash
npm run dev       # Vite dev server with HMR (loads extension via @crxjs)
npm run build     # Build to dist/
```

No test, lint, or typecheck scripts are configured yet.

## Architecture

- **Build**: Vite + `@crxjs/vite-plugin` — reads `manifest.json` as the entrypoint, not a separate config
- **Entry points** (defined in `manifest.json`):
  - `src/popup/index.html` — popup UI
  - `src/background.ts` — service worker (ES module)
  - `src/content.ts` — content script injected into all pages
- All source lives under `src/`. TypeScript target: ES2023, moduleResolution: bundler.
- `@crxjs` handles manifest processing; do not manually move/rename the manifest or build output.

## Conventions

- No comments in source unless requested.
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are strict — unused code will fail `tsc`.
- The project is a scaffold; most files are stubs. When adding features, follow the existing popup/background/content split.

## Workflow

All tasks are divided into phases and executed sequentially.

- Before starting work, analyze requirements and split the task into phases. Present each phase's goal, scope, and deliverables first.
- Only one phase is executed at a time. The next phase must not begin until the current phase is verified and approved.
- Each phase is designed as an independently verifiable unit (e.g., Phase 1 project structure / Phase 2 manifest and entry points / Phase 3 content script analysis logic / Phase 4 popup UI / Phase 5 background integration / Phase 6 integration testing).
- If the phase order or scope is unclear, do not proceed arbitrarily — ask first.

## Working Rules

- Always read the current file contents before modifying any file.
- Do not rename or reorder fields in `manifest.json` (`@crxjs/vite-plugin` depends on the structure).
- Follow the project's code style (Prettier, ESM, ES2023, TypeScript strict options). Do not change rules arbitrarily.
- When adding a new library or dependency, explain the reason and alternatives first, and obtain approval.
- Do not write code based on assumptions. Read the file or ask a question to resolve uncertainty before proceeding.
- Do not modify files outside the current phase's scope.
- At the end of each phase, verify that `tsc` type checking and `npm run build` pass.
- Write all UI text and user-facing messages in Korean.
- Do not create or perform Git commits without explicit approval.
- Even after a phase is complete, do not commit automatically. Commits are only performed with the user's explicit approval or request.
- When a commit is needed, always obtain the user's approval first.
- In principle, one phase corresponds to one logical commit. Do not commit without explicit approval just because a phase is complete.
- Do not merge changes from multiple phases into a single commit, or split a single phase into multiple commits, unless the user specifically requests otherwise.

## Reporting Rules

- Write all work reports in Korean.
- At the end of each phase, report in the following format:
  - Phase completed: (number and name)
  - Work performed: (changed/created/deleted files and key content)
  - Verification results: (type check / build / test results)
  - Next phase plan: (summary of planned work)
  - Items requiring confirmation: (questions/risks, or "None")
- Reports should be concise and fact-based, omitting unnecessary descriptions.
- If errors or failures occur, report the cause and resolution together — do not hide them.

