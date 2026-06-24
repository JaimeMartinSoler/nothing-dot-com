// Pure, DOM-free logic for the progressive sub-sentence reveal. A sentence's text
// for a language is either a plain string (shown all at once) or an array of parts
// revealed one click at a time. Kept out of `main.js` (which touches the DOM at
// import time) so the index logic can be unit tested in isolation.

// Normalize a sentence's per-language value to an array of parts. A plain string
// becomes a single-part array so callers can treat both shapes uniformly.
export function subSentenceParts(sentenceData) {
  return Array.isArray(sentenceData) ? sentenceData : [sentenceData];
}

// True when there is a further part to reveal after `subIndex`. Plain strings have
// no sub-parts, so they always return false and advance to the next sentence.
export function hasNextSubSentence(sentenceData, subIndex) {
  return Array.isArray(sentenceData) && subIndex < sentenceData.length - 1;
}

// Clamp a sub-index into the valid range for `sentenceData`. Used when switching
// language mid-sentence so a shorter translation never leaves the index past the
// end (it stays on the last available part instead).
export function clampSubIndex(sentenceData, subIndex) {
  const parts = subSentenceParts(sentenceData);
  return Math.min(subIndex, Math.max(0, parts.length - 1));
}
