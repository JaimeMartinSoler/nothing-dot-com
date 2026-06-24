# Technical Architecture

## Stack
- **Framework/Bundler**: Vite (lightning fast, built-in YAML support via plugins, minimal overhead).
- **Package Manager**: pnpm.
- **Languages**: HTML, CSS, JavaScript (Vanilla JS is preferred for maximum control over micro-animations and performance, keeping the "nothingness" as lightweight as possible).

## Project Structure
- `/index.html`: The main entry point. Minimal DOM structure.
- `/src/main.js`: Handles event listeners (click, keypress, double click), state management (current sentence index, cooldown state, language state), and DOM updates.
- `/src/style.css`: Contains the CSS variables, typography, and complex transition animations.
- `/src/config.yml`: The source of truth for app configuration (like the initial delay and cooldown delay), `visuals`, and the optional `subtitle` block. Sentences no longer live here.
- `/src/sentences/`: One YAML list of sentences per file (`000000.yaml`, `000001.yaml`, ...). The filename (sans extension) is the list's stored alias. One list is selected per page load.
- `/src/sentenceLists.js`: Pure, DOM-free selection logic (alias parsing, repetition tracking, candidate ordering). Tested using Node's built-in test runner (`node --test`).
- `/src/subSentences.js`: Pure, DOM-free helpers for the progressive sub-sentence reveal (normalizing a value to parts, deciding whether a further part remains, clamping the sub-index on a language switch). Kept out of `main.js` so it can be unit tested in isolation.
- `/src/subtitle.js`: Pure, DOM-free logic for the optional configurable subtitle (resolving the per-language text, deciding whether to show it, resolving the extra delay). The `subtitle` block in `config.yml` is entirely optional; this module returns safe defaults (e.g. `null` text) when it is absent or incomplete. Kept out of `main.js` so it can be unit tested in isolation.

## Core Mechanisms
- **YAML Parsing & CSS Injection**: Uses `@modyfi/vite-plugin-yaml` to parse `config.yml`. `main.js` then reads the `visuals` block and dynamically injects them as CSS Custom Properties (`--bg-color`, `--blur-amount`, etc.) onto the document's `:root`. The optional `subtitle` block is injected the same way (`--sub-text-color`, `--sub-font-size`, etc.), each variable falling back to its main-text counterpart when left null.
- **Sentence Discovery & Lazy Loading**: `main.js` uses Vite's `import.meta.glob('./sentences/*.yaml')` (non-eager) so only the file *paths* are baked into the main bundle and each list is emitted as a separate chunk. On load, a list not yet seen by this browser is chosen and ONLY that one chunk is downloaded. This scales to thousands of lists without fetching them all just to pick one. A list is recorded as "shown" only *after* its chunk resolves, and load failures fall through to another candidate so a flaky network never burns a list or leaves a blank page.
- **Hidden URL Routing**: Navigating to `/<LIST_NAME>` or `/<LIST_NAME>/<INDEX>` overrides the random selection. It forces the loading of a specific sentence list (and optionally a specific index). When a valid index is included (`/<LIST_NAME>/<INDEX>`), the initial delay is also skipped so the sentence appears immediately; a bare `/<LIST_NAME>` link still waits out the usual `initial_delay_ms`.
- **Repetition Tracking & Progress**: Shown list aliases (e.g. `000001`) are stored in `localStorage` under `nothing_sentences_shown`. Selection draws only from lists not yet shown; once all have been shown the history resets. When the history is empty, the `start_with_first_list` flag in `config.yml` decides whether the first list (`000000`) is shown deterministically or a random one is picked. Returning users resume exactly where they left off (the current index is stored in `nothing_sentence_last_index`), controlled by the `resume_last_sentence` flag.
- **Event Handling**:
  - Global `click`, `touchstart`, `keydown` (Space, Enter) listeners.
  - Custom double-tap logic (measuring time between clicks/taps) since native `dblclick` can be inconsistent on mobile.
- **Progressive Sub-sentences**:
  - A sentence's per-language value may be an array of strings instead of a single string. The parts are rendered as sibling `<span class="sub-sentence">` elements *all at once*, but every part after the current sub-index carries the `hidden` class, so it is present in the layout yet invisible (`opacity: 0` + blur). Revealing the next part just removes `hidden` from one span, which fades it in via CSS without reflowing the text already on screen.
  - `nextSentence` first checks `hasNextSubSentence`: if a part remains it reveals it and stops; only once all parts are shown does it run the normal exit/advance flow. `currentSubIndex` tracks how many parts are revealed and resets to 0 in `showSentence`. `renderSentenceContent` is shared by `showSentence` and `setLanguage` so both paths build the spans identically; switching language mid-sentence clamps the sub-index via `clampSubIndex` so a shorter translation never indexes past its last part.
- **Cooldown Logic**:
  - `let isTransitioning = false;`
  - On input, if `isTransitioning`, ignore. Otherwise, trigger the transition, set it to `true`, and use `setTimeout` to unlock after `cooldown_ms`. This guard applies both to advancing to the next sentence and to revealing the next sub-sentence part.
- **Animations**:
  - Managed via CSS classes toggled by JS. For example, `.sentence-enter`, `.sentence-active`, `.sentence-exit`.
  - Advanced CSS transitions/animations for opacity, transforms, and filters (blur).
  - Web Animations API can be used if CSS transitions prove too rigid for the desired "vibe".

## Styling & Aesthetics
We avoid heavy UI libraries. The UI relies entirely on Vanilla CSS:
- Advanced aesthetics via `filter: blur()`, `transform: scale()`, and configurable `cubic-bezier()` easing.
- **Newlines**: The `.sentence` element uses `white-space: pre-line;` to natively respect `\n` characters injected from the YAML file while remaining secure from XSS.
- **Sub-sentences**: Each part is a `.sub-sentence` span whose text is set via `textContent` (never `innerHTML`), keeping the DOM-injection path XSS-safe. The `.sub-sentence.hidden` rule drives the per-part fade-in (opacity + blur, plus `pointer-events: none`) without using `display:none`, so revealing a part never shifts the surrounding layout.
- All styles consume the CSS Custom Properties injected by `main.js` during initialization. CSS is included in the `<head>` to make it render-blocking, preventing any Flash of Unstyled Content (FOUC).
