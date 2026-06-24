# nothing-dot-com Specification

## Concept
A minimalistic, "low dopamine" web experience that subverts user expectations. The site begins entirely blank and gradually reveals short, slightly antagonistic or philosophical messages as the user interacts with it. 

## Features & Flow
1. **The Void**: Upon loading, the page is completely blank.
2. **The Awakening**: After the initial delay from load (`initial_delay_ms`, 5 seconds by default), the first sentence appears.
3. **Interactions**: 
   - A single click, tap, space-bar, or enter key transitions the page to the next sentence.
   - **Cooldown**: There is a short debounce/cooldown (`cooldown_ms`, 300ms by default) after a sentence — or a sub-sentence part — appears, where inputs are ignored. This prevents accidental double-skips.
   - **Progressive sub-sentences**: A sentence can be authored as an ordered list of parts that reveal one at a time. The first click after such a sentence reveals the next part (fading it in without shifting the layout) instead of advancing to the next sentence; once every part is revealed, the next click moves on as usual.
4. **Internationalization (i18n)**:
   - Supported languages: English (default) and Spanish.
   - Initial language is inferred from the user's browser setting (`navigator.language`).
   - The first sentence explicitly tells the user: "Are you still here? (double tap/click to change language)"
   - **Double-tap/Double-click**: Opens a beautiful, subtle pop-up to explicitly switch the language.
5. **Content Source & Progress**:
   - Behaviors (delays/cooldowns) and visuals (fonts, colors, blur amounts, easing curves) are managed in `src/config.yml`.
   - Sentences live as individual YAML lists in `src/sentences/` (one file per list, e.g. `000000.yaml`). One list is selected per page load and lazily downloaded.
   - Each sentence provides text per language (`en`/`es`). A language value is either a plain string (shown all at once) or an array of strings — the parts of a progressive sub-sentence, revealed one click at a time (e.g. `["Or keep clicking.", " It's your time"]`).
   - **Persistent Progress**: Repeats are avoided via `localStorage` until every list has been shown, then the cycle resets. The `start_with_first_list` flag in `config.yml` controls whether a fresh cycle begins with the first list or a random one. Returning users resume from the exact list and sentence they left off (controlled by `resume_last_sentence` flag).
   - Line breaks are supported by using `\n` in the YAML strings, rendering correctly on the screen.
6. **Hidden Routing**:
   - Users can bypass random selection by visiting `/<list_name>` to load a specific list, or `/<list_name>/<index>` to jump directly to a specific sentence. Only the `/<list_name>/<index>` form also skips the initial delay; a bare `/<list_name>` link still waits out the usual delay.

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
10. Or keep clicking. | It's your time. / O sigue haciendo clic. | Es tu tiempo. *(progressive sub-sentence: the two parts reveal one click at a time)*
