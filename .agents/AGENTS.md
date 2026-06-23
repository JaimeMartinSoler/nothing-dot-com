# Agent Guidelines for nothing-dot-com

## Project Context
This is "nothing-dot-com", an anti-dopamine, highly minimalist, slightly antagonistic web project. The goal is emptiness combined with extremely polished micro-interactions. The site must literally look like nothing at first.

## Coding Directives
1. **Aesthetics First**: When creating UI or transitions, aim for "Apple/Awwwards" level of polish. Smooth easing functions (`cubic-bezier`), subtle blurs, and perfect typography are mandatory. It's not just text appearing; it's a cinematic experience.
2. **Minimal Code**: Do not over-engineer. Use vanilla JavaScript and CSS where possible. We are building "nothing", the bundle size should reflect that.
3. **Use PNPM & Vite**: Always use `pnpm` for package management and `vite` for the dev server and bundling.
4. **Testing**: Use Node.js built-in test runner (`node --test`), avoiding heavy test frameworks like vitest or jest.
5. **Vibe Coding**: The user expects to explore different visual effects. When modifying the code to add a new transition, explain the "vibe" of the transition (e.g., "This adds a deep cinematic blur that slowly comes into focus"). Try out different things when asked to show options.
6. **No Clutter**: Do not add unnecessary comments, logs, or boilerplate. Keep the codebase as stark as the website itself.
7. **YAML Config**: The timing behavior and ALL visual configurations (colors, fonts, animation timings, easing curves) must be stored in `config.yml`. Sentence text content lives in its own per-list files under `src/sentences/` (e.g. `000000.yaml`), one list per file. This allows the site to be fully customized without touching JS/CSS source code.

## Development Workflow (every new request, unless told otherwise)
1. **Verify the branch.** The base for new work is `develop`. If the current
   branch is not `develop`, stop and tell me before doing anything else.
2. **Branch off.** Create `feature/<short-descriptive-slug>` for the request and
   do all work there. If the same request grows into more changes, keep using
   that branch — do NOT open a new one.
3. **Develop, don't publish.** Make the changes on that branch. Do not commit, push, or open a PR yet.
4. **Hand off.** When the work is done, ask me before committing — then, on my
   go-ahead: commit, push, and open a PR to `develop`.
