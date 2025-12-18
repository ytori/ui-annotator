# UI Annotator - Claude Code Guide

A tool for annotating screenshots and generating JSON input for AI Agents.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Development server (port 3001)
bun run build        # Build
bun run check-types  # Type check
bun run check        # Biome lint/format
bun run knip         # Detect unused code
```

## Directory Structure

```
apps/web/src/
├── app/          # Integration layer (pages, hooks, providers)
├── features/     # Feature modules (no cross-dependencies)
├── components/   # Shared UI (shadcn/ui)
├── lib/          # Utilities
├── types/        # Shared type definitions
└── routes/       # TanStack Router
```

Details: [docs/architecture.md](docs/architecture.md), [docs/store.md](docs/store.md)

## Coding Rules

### Naming Conventions
- Files: kebab-case (`editor-view.tsx`)
- Components: PascalCase (`EditorView`)
- Hooks: `use` prefix (`useKeyboardShortcuts`)
- Constants: SCREAMING_SNAKE_CASE

### Imports
- Use `@/` alias (`@/components`, `@/features`, `@/lib`)
- Prefer absolute paths; use relative paths within features

### Preventing Circular References (Important)

Barrel files (index.ts) are **for external exports only**. Do not import from index.ts within the same directory.

```typescript
// BAD
import { BBox } from "./index";

// GOOD
import { BBox } from "./geometry";
```

### Feature Dependencies

- **No cross-dependencies** within features/
- Resolution patterns: Context Injection, Render Props, Callback Props, App Hooks

## AI Instructions

- Prefer shadcn/ui components
- Place new UI in `components/ui/`
- Place features in `features/`, no cross-dependencies
- Integrate cross-feature logic in `app/hooks/`
- Use Tailwind CSS 4 syntax
- Prioritize type safety (strict mode)
- Actively remove unused code (verify with `bun run knip`)

## Design Principles

- Minimal first: Simple and cool design
- Minimal decoration, prioritize functionality
- Smooth UX: Quick and fluid animations
