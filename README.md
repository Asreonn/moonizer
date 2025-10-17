# Moonizer

Moonizer is a local-first CSV exploration, transformation, and visualization studio that runs entirely in your browser. Every byte stays on your machine, enabling teams to inspect sensitive datasets with the speed of a native tool and the simplicity of a web app.

## Table of Contents
- [Why Moonizer](#why-moonizer)
- [Feature Highlights](#feature-highlights)
- [Data Workflow](#data-workflow)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Using Moonizer](#using-moonizer)
- [Extending the Platform](#extending-the-platform)
- [Localization](#localization)
- [Keyboard Shortcuts & Accessibility](#keyboard-shortcuts--accessibility)
- [Tooling & Scripts](#tooling--scripts)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Why Moonizer
Traditional spreadsheet tools choke on multi‑million row CSVs, leak data to remote services, or bury critical profiling insight behind add-ons. Moonizer delivers a focused analysis environment designed for analysts, data scientists, and less-technical stakeholders who need trustworthy answers fast:
- Zero install beyond Node.js; ship as a static site or embed inside internal tooling.
- All processing (parsing, profiling, transforms, visualization) happens client-side for compliance-friendly analysis.
- Opinionated but extensible UI that balances analyst power-features with shareable insights.

## Feature Highlights
### Data Ingestion
- Drag & drop or file picker uploads with instant feedback.
- Automatic delimiter detection (comma, semicolon, tab, pipe) and character set inference.
- Incremental loading strategy keeps the UI responsive even with large files.
- Built-in sample datasets and multi-dataset sessions for quick experimentation.

### Profiling & Analysis
- Detects seven column archetypes (numeric, categorical, boolean, datetime, text, unique/ID, constant).
- Column-level metrics: counts, distinct values, missing ratios, distribution descriptors.
- Type-aware deep metrics: Gini, entropy, quartiles, outlier capture, and null highlighting.
- Row preview with null emphasis accelerates anomaly triage.

### Transformation Workbench
- 30+ advanced column operations across text, numeric, boolean, categorical, and time-series data.
- Undo/redo with branched history so you can compare divergent transformation paths.
- Rich tooling for find & replace, regular expressions, column merge/split, imputation, and more.

### Data Grid
- Trimodal sorting (ascending, descending, neutral) with multi-column selection.
- Middle-click 2D panning, keyboard navigation, and responsive pagination for deep datasets.
- Type-specific filtering, row/column highlighting, delta tracking, and outlier markers.

### Visualization Studio
- Histogram, line, scatter, bar, pie, box plot, and area charts ready out-of-the-box.
- Dual-panel chart mode lets you compare two visuals side by side.
- Real-time customization panel with interactive control sets.

### Export & Sharing
- Export transformed datasets as CSV, JSON, or Excel-friendly formats.
- Scope exports to filtered subsets for precise downstream workflows.
- Theme-aware PNG chart exports for reporting decks.

### UX Enhancements
- Keyboard shortcuts, contextual menus, and tooltip-rich guidance reduce friction.
- Multilingual foundation with lightweight iconography, deliberate color tokens, and subtle motion.

## Data Workflow
1. **Load** a CSV via drag & drop or the file picker; Moonizer streams large files chunk-by-chunk.
2. **Profile** columns automatically to surface schema drafts, anomalies, and type mismatches.
3. **Transform** data using the inspector panel; every change is tracked with undo/redo history.
4. **Inspect** results in the grid with filters, sorting, and delta highlights.
5. **Visualize** insights via charts, comparing multiple views simultaneously when needed.
6. **Export** cleaned datasets or generated visuals without leaving the browser.

## Architecture
- **Stack:** React 18 + TypeScript + Vite for a fast, typed SPA foundation.
- **State Management:** Zustand + Immer stores (see `src/state/`) coordinate datasets, layout, data views, and the column editor.
- **Dataset Engine:** `src/core/dataset` handles CSV parsing, sample loading, transformation pipelines, and export tooling.
- **Profiling:** `src/core/profiling` surfaces type detection and statistic computation for every column.
- **UI Composition:** Component modules under `src/components` and `src/ui` deliver reusable panels, inspectors, charts, and grid utilities.
- **Styling:** CSS Modules with design tokens ensure theme consistency and scoped styles.
- **Routing:** React Router 6 powers navigation between workspace surfaces.

## Getting Started
### Prerequisites
- Node.js 18+
- npm (bundled with Node) or your preferred package manager

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` (default Vite port) to start exploring datasets.

### Production Build
```bash
npm run build
npm run preview # optional: serve the production build locally
```
The optimized output lives in `dist/` and can be deployed to any static host or embedded inside an internal portal.

## Using Moonizer
### Load Data
- Drag a CSV file onto the workspace or choose it via the upload dialog.
- Toggle header detection and encoding options if automatic inference needs adjustment.
- Reopen previous datasets from the session list without re-uploading.

### Explore & Profile
- Switch between datasets from the sidebar to compare multiple sources.
- Review the profiling summary panel to inspect distributions, null ratios, and inferred types.
- Override detected column types when domain knowledge differs from the heuristic.

### Transform & Audit
- Use the column inspector to apply transformations (rounding, math ops, regex cleanup, type casting, etc.).
- Monitor the transform history timeline; branch workflows by undoing to a previous snapshot and creating a new path.
- Catch errors quickly—Moonizer surfaces validation messages and prevents destructive operations like divide-by-zero.

### Visualize & Share
- Configure charts from the visualization panel, customizing axes, aggregations, and color palettes.
- Activate dual-view mode to compare two visuals; adjustments reflect instantly.
- Export curated datasets or rendered charts for reports, pipelines, and dashboards.

## Extending the Platform
Moonizer is built to be extended without forking core logic.
- **Custom transforms:** Add a new helper to `src/core/dataset/transforms.ts`, returning a `TransformResult`. Then register it inside the column inspector configuration so it appears in the UI.
- **Derived metrics:** Augment profiling logic in `src/core/profiling` to compute domain-specific KPIs (e.g., churn, conversion, risk scores).
- **Visualization presets:** Extend chart definitions in `src/ui` to add templates, saved views, or organization-specific themes.
- **Automation hooks:** The Zustand stores in `src/state` expose accessor methods (`applyDatasetTransform`, `updateDatasetData`, etc.) that you can call from new React components, services, or background workers.

## Localization
Moonizer ships with i18next, i18next-browser-languagedetector, and react-i18next.
- Translation resources live in `src/locales`.
- Generate compiled locale bundles with `npm run build:locales`.
- Validate translation completeness via `npm run validate:locales`.
- `npm run watch:locales` keeps bundles fresh during development.

## Keyboard Shortcuts & Accessibility
- Undo: `Ctrl/Cmd + Z`
- Redo: `Ctrl/Cmd + Shift + Z` (or `Ctrl + Y`)
- Toast notifications confirm state changes and provide quick reverse actions.
- Interactive elements follow focus management best practices, and tooltip copy is localized by default.

## Tooling & Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check then build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint with strict TypeScript rules. |
| `npm run type-check` | Execute `tsc --noEmit` for type safety. |
| `npm run build:locales` | Compile locale JSON into distributable bundles. |
| `npm run validate:locales` | Ensure translation keys remain in sync. |
| `npm run watch:locales` | Watch localization files for changes. |

## Project Structure
```
Moonizer/
├── public/                 # Static assets served as-is
├── src/
│   ├── app/                # Application-scoped providers and layout wiring
│   ├── core/               # Dataset engine, profiling, hooks, utilities
│   ├── state/              # Zustand + Immer stores (datasets, layout, editor)
│   ├── components/         # Feature components (inspectors, panels, grid, charts)
│   ├── ui/                 # Presentational primitives and shared UI patterns
│   ├── locales/            # i18n resources and build scripts
│   ├── styles/             # CSS Modules and design tokens
│   ├── types/              # Shared TypeScript definitions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point bootstrapping the SPA
├── package.json            # Dependencies and npm scripts
├── vite.config.ts          # Vite + plugin configuration
├── tsconfig.json           # TypeScript compilation config
└── README.md               # You are here
```

## Contributing
Issues, feature requests, and pull requests are all welcome. If you plan a substantial change:
1. Open a discussion or issue outlining the problem and proposed solution.
2. Keep transformations pure and state updates immutable—Immer handles mutation ergonomics under the hood.
3. Add or update localization strings when introducing user-facing text.
4. Run linting and type checks before submitting to ensure a smooth review.

## License
Moonizer is released under the [ISC License](./LICENSE) and is free for commercial and open-source use.
