# Agent Guidelines for nothing-dot-com

## Project Context
This is "nothing-dot-com", an anti-dopamine, highly minimalist, slightly antagonistic web project. The goal is emptiness combined with extremely polished micro-interactions. The site must literally look like nothing at first.

## Coding Directives
1. **Aesthetics First**: When creating UI or transitions, aim for "Apple/Awwwards" level of polish. Smooth easing functions (`cubic-bezier`), subtle blurs, and perfect typography are mandatory. It's not just text appearing; it's a cinematic experience.
2. **Minimal Code**: Do not over-engineer. Use vanilla JavaScript and CSS where possible. We are building "nothing", the bundle size should reflect that.
3. **Use PNPM & Vite**: Always use `pnpm` for package management and `vite` for the dev server and bundling.
4. **Vibe Coding**: The user expects to explore different visual effects. When modifying the code to add a new transition, explain the "vibe" of the transition (e.g., "This adds a deep cinematic blur that slowly comes into focus"). Try out different things when asked to show options.
5. **No Clutter**: Do not add unnecessary comments, logs, or boilerplate. Keep the codebase as stark as the website itself.
6. **YAML Config**: The text content, timing behavior, and ALL visual configurations (colors, fonts, animation timings, easing curves) must be stored in `config.yml`. This allows the site to be fully customized without touching JS/CSS source code.
