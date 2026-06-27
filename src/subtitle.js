// Pure, DOM-free logic for the optional configurable subtitle. The `subtitle-begin`
// and `subtitle-end` blocks in config.yml are entirely optional: if absent,
// or missing a `sentence` map, the site renders normally with no subtitle.
// Kept out of main.js (which touches the DOM at import time) so the
// decision logic can be unit tested in isolation.

// No extra delay by default: an explicit `extra_delay_ms: 0` shows the subtitle as
// soon as the main sentence appears.
const DEFAULT_EXTRA_DELAY_MS = 0;

// Resolve the subtitle text for a language, or null if the subtitle is missing its
// `sentence` map or has no string entry for the active language. Returning null
// (rather than letting `.textContent = undefined` render the literal "undefined")
// keeps a typo in config.yml from breaking the main render.
export function resolveSubtitleText(subtitle, language) {
  if (!subtitle || !subtitle.sentence) return null;
  const text = subtitle.sentence[language];
  return typeof text === 'string' ? text : null;
}

// Whether the subtitle should be shown for the current state and history.
// `isTargetIndex` is true if we are at the target sentence (e.g. index 0 for beginning, 
// last index for ending). `show_only_first_time` further
// limits it to the first cycle (shown-list history of length <= 1).
export function shouldShowSubtitle(subtitle, isTargetIndex, shownLists) {
  if (!subtitle || !isTargetIndex) return false;
  if (!subtitle.show_only_first_time) return true;
  const shown = Array.isArray(shownLists) ? shownLists : [];
  return shown.length <= 1;
}

// Select which subtitle (begin/end) applies for the current position and
// history, or null if neither should show. `isBegin`/`isEnd` mark whether we're
// at the first / last sentence. Begin takes precedence when both match (e.g. a
// single-sentence list, where index 0 is also the last index).
export function activeSubtitle(isBegin, isEnd, shownLists, begin, end) {
  if (shouldShowSubtitle(begin, isBegin, shownLists)) {
    return { subtitle: begin, type: 'begin' };
  }
  if (shouldShowSubtitle(end, isEnd, shownLists)) {
    return { subtitle: end, type: 'end' };
  }
  return null;
}

// Resolve the extra delay (ms) before the subtitle fades in. Defaults to 0 and
// accepts an explicit 0 — only undefined/null fall back to the default.
export function resolveExtraDelayMs(subtitle) {
  const value = subtitle?.extra_delay_ms;
  return value == null ? DEFAULT_EXTRA_DELAY_MS : value;
}
