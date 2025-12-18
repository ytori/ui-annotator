# UI Annotator

**Annotate Screens, Then Let AI Build Your UI**

A visual annotation tool that transforms screenshots into structured JSON specifications for AI-powered UI development. Perfect for bridging the gap between design and AI code generation.

## The Problem

When using AI agents like Claude Code to generate UI from screenshots:

- **Component selection is imprecise** — AI guesses which components to use
- **Layout intentions get lost** — Positioning and spacing become approximations
- **Element semantics are unclear** — Input fields, buttons, and actions get misidentified
- **Field specifications are missing** — Names, types, and validation rules remain unknown

## The Solution

UI Annotator lets you draw bounding boxes directly on screenshots and annotate each element with semantic information. The result is a structured JSON file that tells AI agents *exactly* what to build.

### How It Works

1. **Import** — Drop a screenshot into the canvas
2. **Annotate** — Draw boxes around UI elements
3. **Specify** — Define component types, field names, and properties
4. **Export** — Generate JSON or AI-ready prompts with precise coordinates and metadata

AI agents receive deterministic specifications instead of ambiguous images.

## Features

- Intuitive canvas with zoom and pan controls
- Bounding box drawing with resize handles
- Layer management with visibility toggles
- Component type selection and property editing
- Import component definitions from Storybook
- Export as JSON or AI-ready prompts
- Undo/redo support
- Keyboard shortcuts for power users
- **Privacy-first** — All data stays local; no uploads to external servers

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later

### Installation

```bash
git clone https://github.com/ytori/ui-annotator.git
cd ui-annotator
bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
bun run build
```

## Tech Stack

- **Base:** [Better-T Stack](https://www.better-t-stack.dev/)
- **Framework:** React 19 + TypeScript
- **Routing:** TanStack Router
- **Canvas:** Konva / React-Konva
- **State:** Zustand with Immer
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui + Radix UI
- **Build:** Vite + Bun

## Project Structure

```
ui-annotator/
├── apps/
│   └── web/              # Main application
│       └── src/
│           ├── app/      # Pages, hooks, providers
│           ├── features/ # Feature modules (isolated)
│           ├── components/# Shared UI components
│           ├── lib/      # Utilities
│           └── types/    # Type definitions
└── docs/                 # Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with modern web technologies and designed for the AI-assisted development workflow.
