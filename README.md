# nothing-dot-com

A minimalistic, low dopamine web experience that subverts user expectations. The site begins entirely blank and gradually reveals short, slightly antagonistic or philosophical messages as the user interacts with it. 

## Features
- **The Void**: A short initial delay before anything happens (`initial_delay_ms`, 5 seconds by default).
- **Micro-interactions**: Beautiful, cinematic blur and zoom transitions.
- **Data-Driven Aesthetics**: Everything from text content to animation easing curves is controlled via `src/config.yml`.
- **Persistent Progress**: Optionally resumes exactly where you left off if you close the tab (opt-in via the `resume_last_sentence` flag in `src/config.yml`, disabled by default).
- **Hidden Routing**: Direct access to specific sentences via URL paths (e.g., `/<list_name>/<index>`).
- **i18n**: English and Spanish support with a double-tap language switcher.

## Development

This project is built using vanilla HTML/JS/CSS and bundled with Vite.

### Setup
```bash
pnpm install
```

### Run
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test
```

## Configuration
To modify the text, the timings, or the visual effects, simply edit `src/config.yml`. The changes will automatically reflect in the UI.
