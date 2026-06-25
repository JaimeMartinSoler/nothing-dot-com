// Pure, side-effect-free selection logic for the lazily-loaded sentence lists.
// Kept out of `main.js` (which touches the DOM at import time) so it can be
// unit tested in isolation. Storage and randomness are injectable for the same
// reason.

export const SHOWN_LISTS_KEY = 'nothing_sentences_shown';

// Storage key for the index of the last sentence shown within the current list,
// used to resume returning visitors where they left off. A value of -1 means the
// last list was finished, so the next visit should start a fresh list.
export const LAST_INDEX_KEY = 'nothing_sentence_last_index';

// Filename (no extension) of a list path, used as its stored alias:
// './sentences/001.yaml' -> '001'. Aliases can be any word, not just digits.
export function listAlias(path) {
  const match = path.match(/([^/]+)\.yaml$/);
  return match ? match[1] : path;
}

export function readShownLists(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(SHOWN_LISTS_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Record a list as shown. If every known list has already been shown, the cycle
// is complete and history resets before recording the new one. Writing is
// best-effort: `setItem` can throw (private mode / quota), in which case we just
// skip the bookkeeping rather than breaking the page.
export function markListShown(alias, allAliases, storage = localStorage) {
  let shown = readShownLists(storage);
  if (allAliases.length > 0 && allAliases.every((a) => shown.includes(a))) {
    shown = [];
  }
  shown.push(alias);
  try {
    storage.setItem(SHOWN_LISTS_KEY, JSON.stringify(shown));
  } catch {
    // localStorage unavailable; repetition tracking is non-essential.
  }
}

function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Ordered list of candidate paths to attempt loading, best first. Draws only
// from lists not yet shown; once all have been shown the history is exhausted
// and we start over from the full set. When `startWithFirst` is true and the
// history is empty (first visit or a freshly completed cycle), the first list
// (sorted, e.g. '000') is tried first; otherwise order is random. Remaining
// candidates follow in random order so a failed load retries a different list.
export function orderedCandidates(paths, shown, startWithFirst, random = Math.random) {
  const sorted = [...paths].sort();
  if (sorted.length === 0) return [];

  let available = sorted.filter((path) => !shown.includes(listAlias(path)));
  const freshCycle = available.length === 0 || shown.length === 0;
  if (available.length === 0) available = [...sorted];

  shuffle(available, random);

  if (freshCycle && startWithFirst) {
    const first = sorted[0];
    return [first, ...available.filter((path) => path !== first)];
  }
  return available;
}
