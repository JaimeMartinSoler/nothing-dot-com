# Technical Architecture

## Stack
- **Framework/Bundler**: Vite (lightning fast, built-in YAML support via plugins, minimal overhead).
- **Package Manager**: pnpm.
- **Languages**: HTML, CSS, JavaScript (Vanilla JS is preferred for maximum control over micro-animations and performance, keeping the "nothingness" as lightweight as possible).

## Project Structure
- `/index.html`: The main entry point. Minimal DOM structure.
- `/src/main.js`: Handles event listeners (click, keypress, double click), state management (current sentence, cooldown state, language state), sentence discovery/selection, and DOM updates.
- `/src/style.css`: Contains the CSS variables, typography, and complex transition animations.
- `/src/config.yml`: The source of truth for app configuration (like the initial delay and cooldown) and `visuals`. No longer holds sentences.
- `/src/sentences/`: One YAML file per sentence (e.g. `sentences0000.yaml`), each defining the `en`/`es` text. This folder is the source of truth for content.

## Sentence Discovery & Efficient Loading
Sentences are intentionally NOT bundled together, so the set can scale to hundreds or thousands of files without bloating the initial download.
- **Discovery without download**: `main.js` uses Vite's `import.meta.glob('./sentences/*.yaml')` in lazy mode. This yields a map of `{ filename -> loader() }`. The filenames are known at build time, but **no sentence content is fetched** until a loader is invoked. Selection therefore operates purely on the list of filenames.
- **Random, non-repeating selection**: On each transition a random file is chosen from those not yet seen. The list of shown files is persisted in `localStorage` (`nothing_shown_sentences`). Once every file has been shown, the history resets and a new cycle begins.
- **Single-file fetch**: Vite code-splits each YAML into its own chunk, so invoking a loader downloads only that one selected sentence. The next sentence is prefetched during the exit animation (and the first during the initial void delay) so loading is imperceptible.

## Core Mechanisms
- **YAML Parsing & CSS Injection**: Uses `@modyfi/vite-plugin-yaml` to parse `config.yml`. `main.js` then reads the `visuals` block and dynamically injects them as CSS Custom Properties (`--bg-color`, `--blur-amount`, etc.) onto the document's `:root`.
- **Event Handling**:
  - Global `click`, `touchstart`, `keydown` (Space, Enter) listeners.
  - Custom double-tap logic (measuring time between clicks/taps) since native `dblclick` can be inconsistent on mobile.
- **Cooldown Logic**:
  - `let isTransitioning = false;`
  - On input, if `isTransitioning`, ignore. Otherwise, trigger transition, set to `true`, and use `setTimeout` to unlock after 1000ms.
- **Animations**:
  - Managed via CSS classes toggled by JS. For example, `.sentence-enter`, `.sentence-active`, `.sentence-exit`.
  - Advanced CSS transitions/animations for opacity, transforms, and filters (blur).
  - Web Animations API can be used if CSS transitions prove too rigid for the desired "vibe".

## Styling & Aesthetics
We avoid heavy UI libraries. The UI relies entirely on Vanilla CSS:
- Advanced aesthetics via `filter: blur()`, `transform: scale()`, and configurable `cubic-bezier()` easing.
- **Newlines**: The `.sentence` element uses `white-space: pre-line;` to natively respect `\n` characters injected from the YAML file while remaining secure from XSS.
- All styles consume the CSS Custom Properties injected by `main.js` during initialization.
