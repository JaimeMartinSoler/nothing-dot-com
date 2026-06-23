# nothing-dot-com

A minimalistic, low dopamine web experience that subverts user expectations. The site begins entirely blank and gradually reveals short, slightly antagonistic or philosophical messages as the user interacts with it. 

## Features
- **The Void**: A 30-second initial delay before anything happens.
- **Micro-interactions**: Beautiful, cinematic blur and zoom transitions.
- **Data-Driven Aesthetics**: Everything from text content to animation easing curves is controlled via `src/config.yml`.
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

## Configuration
To modify the timings or the visual effects, simply edit `src/config.yml`. The changes will automatically reflect in the UI.

### Sentences
Sentences live as individual YAML files in `src/sentences/` (one sentence per file, e.g. `sentences0000.yaml`):

```yaml
en: "There is no content here"
es: "Aquí no hay contenido"
```

To add a sentence, just drop in a new file. On each visit the site shows a random sentence that hasn't been seen yet (tracked via `localStorage`), and only that single file is downloaded — so the collection scales to thousands of sentences without bloating the initial load.
