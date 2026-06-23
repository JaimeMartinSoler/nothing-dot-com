# Technical Architecture

## Stack
- **Framework/Bundler**: Vite (lightning fast, built-in YAML support via plugins, minimal overhead).
- **Package Manager**: pnpm.
- **Languages**: HTML, CSS, JavaScript (Vanilla JS is preferred for maximum control over micro-animations and performance, keeping the "nothingness" as lightweight as possible).

## Project Structure
- `/index.html`: The main entry point. Minimal DOM structure.
- `/src/main.js`: Handles event listeners (click, keypress, double click), state management (current sentence index, cooldown state, language state), and DOM updates.
- `/src/style.css`: Contains the CSS variables, typography, and complex transition animations.
- `/src/config.yml`: The source of truth for app configuration (like the initial delay and cooldown delay) and `visuals`. Sentences no longer live here.
- `/src/sentences/`: One YAML list of sentences per file (`000000.yaml`, `000001.yaml`, ...). The filename (sans extension) is the list's stored alias. One list is selected per page load.
- `/src/sentenceLists.js`: Pure, DOM-free selection logic (alias parsing, repetition tracking, candidate ordering). Tested using Node's built-in test runner (`node --test`).

## Core Mechanisms
- **YAML Parsing & CSS Injection**: Uses `@modyfi/vite-plugin-yaml` to parse `config.yml`. `main.js` then reads the `visuals` block and dynamically injects them as CSS Custom Properties (`--bg-color`, `--blur-amount`, etc.) onto the document's `:root`.
- **Sentence Discovery & Lazy Loading**: `main.js` uses Vite's `import.meta.glob('./sentences/*.yaml')` (non-eager) so only the file *paths* are baked into the main bundle and each list is emitted as a separate chunk. On load, a list not yet seen by this browser is chosen and ONLY that one chunk is downloaded. This scales to thousands of lists without fetching them all just to pick one. A list is recorded as "shown" only *after* its chunk resolves, and load failures fall through to another candidate so a flaky network never burns a list or leaves a blank page.
- **Hidden URL Routing**: Navigating to `/<LIST_NAME>` or `/<LIST_NAME>/<INDEX>` overrides the random selection. It forces the loading of a specific sentence list (and optionally a specific index). When a valid index is included (`/<LIST_NAME>/<INDEX>`), the initial delay is also skipped so the sentence appears immediately; a bare `/<LIST_NAME>` link still waits out the usual `initial_delay_ms`.
- **Repetition Tracking & Progress**: Shown list aliases (e.g. `000001`) are stored in `localStorage` under `nothing_sentences_shown`. Selection draws only from lists not yet shown; once all have been shown the history resets. When the history is empty, the `start_with_first_list` flag in `config.yml` decides whether the first list (`000000`) is shown deterministically or a random one is picked. Returning users resume exactly where they left off (the current index is stored in `nothing_sentence_last_index`), controlled by the `resume_last_sentence` flag.
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
- All styles consume the CSS Custom Properties injected by `main.js` during initialization. CSS is included in the `<head>` to make it render-blocking, preventing any Flash of Unstyled Content (FOUC).
