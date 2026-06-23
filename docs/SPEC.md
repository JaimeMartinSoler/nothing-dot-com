# nothing-dot-com Specification

## Concept
A minimalistic, "low dopamine" web experience that subverts user expectations. The site begins entirely blank and gradually reveals short, slightly antagonistic or philosophical messages as the user interacts with it. 

## Features & Flow
1. **The Void**: Upon loading, the page is completely blank.
2. **The Awakening (30s delay)**: After exactly 30 seconds of inactivity (or simply 30s from load), the first sentence appears.
3. **Interactions**: 
   - A single click, tap, space-bar, or enter key transitions the page to the next sentence.
   - **Cooldown**: There is a 1-second debounce/cooldown after a sentence appears where inputs are ignored. This prevents accidental double-skips.
4. **Internationalization (i18n)**:
   - Supported languages: English (default) and Spanish.
   - Initial language is inferred from the user's browser setting (`navigator.language`).
   - The first sentence explicitly tells the user: "Are you still here? (double tap/click to change language)"
   - **Double-tap/Double-click**: Opens a beautiful, subtle pop-up to explicitly switch the language.
5. **Content Source**:
   - Behaviors (delays/cooldowns) and visuals (fonts, colors, blur amounts, easing curves) are managed in `src/config.yml`.
   - Sentences live as individual YAML lists in `src/sentences/` (one file per list, e.g. `000000.yaml`). One list is selected per page load and lazily downloaded; repeats are avoided via `localStorage` until every list has been shown, then the cycle resets. The `start_with_first_list` flag in `src/config.yml` controls whether a fresh cycle begins with the first list or a random one. See `docs/ARCHITECTURE.md` for details.
   - Line breaks are supported by using `\n` in the YAML strings, rendering correctly on the screen.

## Aesthetic Requirements
- **Minimalism**: Focus on typography, spacing, and emptiness.
- **Transitions**: The transitions must be EXTREMELY beautiful, smooth, and relaxing. We will experiment with various effects (e.g., slow fade-ins, subtle wave distortions, cinematic blur/focus shifts, slow zoom-ins).
- **Typography**: Sleek, modern, and highly legible (e.g., Inter, Helvetica Neue, or a beautifully crafted serif).

## Initial Content (English / Spanish)
1. Are you still here? (double tap/click to change language) / ¿Sigues aquí? (toca/haz clic dos veces para cambiar de idioma)
2. Are you dumb? / ¿Eres tonto?
3. Did you check the name of the website? / ¿Te has fijado en el nombre de la web?
4. This is nothing... / Esto es la nada...
5. There is no content here. / Aquí no hay contenido.
6. Seriously, what are you waiting for? / En serio, ¿qué estás esperando?
7. A reward? / ¿Una recompensa?
8. There are no rewards in nothingness. / No hay recompensas en la nada.
9. Just close the tab. / Simplemente cierra la pestaña.
10. Or keep clicking. It's your time. / O sigue haciendo clic. Es tu tiempo.
