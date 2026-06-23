import data from './config.yml';
import { listAlias, readShownLists, markListShown, orderedCandidates, LAST_INDEX_KEY } from './sentenceLists.js';

const { behavior, visuals } = data;

// Apply visual config
const root = document.documentElement;
if (visuals) {
  if (visuals.background_color) root.style.setProperty('--bg-color', visuals.background_color);
  if (visuals.text_color) root.style.setProperty('--text-color', visuals.text_color);
  if (visuals.font_family) root.style.setProperty('--font-family', visuals.font_family);
  if (visuals.font_size) root.style.setProperty('--font-size', visuals.font_size);
  if (visuals.font_weight) root.style.setProperty('--font-weight', visuals.font_weight);
  
  if (visuals.blur_amount) root.style.setProperty('--blur-amount', visuals.blur_amount);
  if (visuals.zoom_amount) root.style.setProperty('--zoom-amount', visuals.zoom_amount);
  if (visuals.exit_blur_amount) root.style.setProperty('--exit-blur-amount', visuals.exit_blur_amount);
  if (visuals.exit_zoom_amount) root.style.setProperty('--exit-zoom-amount', visuals.exit_zoom_amount);
  
  if (visuals.enter_duration) root.style.setProperty('--enter-duration', visuals.enter_duration);
  if (visuals.exit_duration) root.style.setProperty('--exit-duration', visuals.exit_duration);
  if (visuals.enter_easing) root.style.setProperty('--enter-easing', visuals.enter_easing);
  if (visuals.exit_easing) root.style.setProperty('--exit-easing', visuals.exit_easing);
}

function parseDurationMs(str) {
  if (!str) return 0;
  if (str.endsWith('ms')) return parseFloat(str);
  if (str.endsWith('s')) return parseFloat(str) * 1000;
  return parseFloat(str);
}

const enterDurationMs = visuals?.enter_duration ? parseDurationMs(visuals.enter_duration) : 4000;
const exitDurationMs = visuals?.exit_duration ? parseDurationMs(visuals.exit_duration) : 1500;

const contentDiv = document.getElementById('content');
const languageModal = document.getElementById('language-modal');
const btnEn = document.getElementById('btn-en');
const btnEs = document.getElementById('btn-es');

// Infer language based on local storage or browser preference
let currentLanguage = localStorage.getItem('nothing_lang') || (navigator.language.startsWith('es') ? 'es' : 'en');
let currentIndex = 0;
let isAwake = false;
let isTransitioning = false;
let lastTap = 0;
let tapTimeout;

// Sentence lists are discovered lazily. `import.meta.glob` (non-eager) bakes ONLY
// the file paths into the main bundle and emits each list as a separate chunk, so
// the browser downloads just the one list we end up selecting — this scales to
// thousands of lists without ever fetching them all to pick one.
const sentenceLists = import.meta.glob('./sentences/*.yaml');

let sentences = [];

// Set when a path override pins both a list AND an index, so init can render it
// immediately instead of forcing the checker through the full initial delay.
let skipInitialDelay = false;

// Try candidate lists in order until one's chunk loads. A list is only recorded
// as "shown" AFTER its chunk resolves, so a flaky network never burns a list the
// user never saw — and we fall through to another list instead of a blank page.
async function loadSentences() {
  const paths = Object.keys(sentenceLists);
  const allAliases = paths.map(listAlias);

  // Hidden path override: /<SENTENCE_NAME> or /<SENTENCE_NAME>/<SENTENCE_IDX>
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const listName = pathParts[0];
    const targetPath = paths.find(p => listAlias(p) === listName);

    if (targetPath) {
      try {
        const module = await sentenceLists[targetPath]();
        const loaded = Array.isArray(module.default) ? module.default : [];

        let startIdx = 0;
        if (pathParts.length > 1) {
          const parsedIdx = parseInt(pathParts[1], 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < loaded.length) {
            startIdx = parsedIdx;
            // An explicit list + index is a "check this now" link — skip the void delay.
            skipInitialDelay = true;
          }
        }

        // Don't re-record on every reload of the same direct link, otherwise a
        // bookmarked `/000000` would append a duplicate entry to the shown-list
        // history on each visit and grow it without bound.
        const targetAlias = listAlias(targetPath);
        const shown = readShownLists();
        if (shown[shown.length - 1] !== targetAlias) {
          markListShown(targetAlias, allAliases);
        }
        if (behavior.resume_last_sentence) {
          localStorage.setItem(LAST_INDEX_KEY, startIdx.toString());
        }

        currentIndex = startIdx;
        return loaded;
      } catch {
        // Fall back to normal behavior if the list fails to load
      }
    }
  }

  if (behavior.resume_last_sentence) {
    let lastIdx = parseInt(localStorage.getItem(LAST_INDEX_KEY), 10);
    if (isNaN(lastIdx)) lastIdx = -1;

    if (lastIdx !== -1) {
      const shown = readShownLists();
      if (shown.length > 0) {
        const lastShownAlias = shown[shown.length - 1];
        const path = paths.find(p => listAlias(p) === lastShownAlias);
        if (path) {
          try {
            const module = await sentenceLists[path]();
            const loaded = Array.isArray(module.default) ? module.default : [];
            // Only resume if the stored index still points inside the list. If
            // the list was trimmed/edited (or the value was tampered with) the
            // index can be stale, so we discard it and fall through to a fresh
            // list rather than indexing past the end.
            if (lastIdx < loaded.length) {
              currentIndex = lastIdx;
              return loaded;
            }
          } catch {
            // Chunk failed to load; fall through to pick a new one
          }
        }
      }
    }
  }

  currentIndex = 0;
  const candidates = orderedCandidates(paths, readShownLists(), behavior.start_with_first_list);

  for (const path of candidates) {
    try {
      const module = await sentenceLists[path]();
      const loaded = Array.isArray(module.default) ? module.default : [];
      markListShown(listAlias(path), allAliases);
      return loaded;
    } catch {
      // Chunk failed to load; try the next candidate.
    }
  }
  return [];
}

// Initialization: download a selected list, then start the void timer.
// `loadSentences` always resolves (worst case to `[]`), so no rejection to catch.
loadSentences().then((loaded) => {
  sentences = loaded;
  setTimeout(() => {
    wakeUp();
  }, skipInitialDelay ? 0 : behavior.initial_delay_ms);
});

function wakeUp() {
  if (isAwake || sentences.length === 0) return;
  isAwake = true;
  showSentence(currentIndex);
}

// Global interaction handler (click, touch, space, enter)
function handleInteraction(e) {
  // Only react to the primary (left) button; ignore middle/right clicks.
  // Touch and keyboard-triggered calls have e.button === 0 / undefined.
  if (e.button) return;

  // Ignore interactions if modal is open
  if (!languageModal.classList.contains('hidden')) return;

  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  
  clearTimeout(tapTimeout);
  
  if (tapLength < 250 && tapLength > 0) {
    // Double tap
    showLanguageModal();
    if (e.cancelable) e.preventDefault();
  } else {
    // Single tap/click, debounced to wait for possible double tap
    tapTimeout = setTimeout(() => {
      if (isAwake && !isTransitioning) {
        nextSentence();
      }
    }, 200);
  }
  lastTap = currentTime;
}

document.addEventListener('pointerdown', handleInteraction);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    handleInteraction(e);
  }
});

function nextSentence() {
  if (currentIndex >= sentences.length - 1) {
    // At the end — do nothing, let them keep clicking. The list was already
    // marked "done" when the final sentence was shown (see showSentence).
    return;
  }
  
  currentIndex++;
  isTransitioning = true;
  
  // Trigger exit animation
  contentDiv.classList.remove('active');
  contentDiv.classList.add('exit');
  
  // Wait for exit animation to complete, then show next
  setTimeout(() => {
    showSentence(currentIndex);
  }, exitDurationMs);
}

function showSentence(index) {
  // Reset classes
  contentDiv.classList.remove('exit');
  contentDiv.classList.remove('active');
  
  if (behavior.resume_last_sentence) {
    // Mark the list "done" (-1) as soon as its final sentence is shown, so a
    // visitor who simply closes the tab on the last line starts a fresh list
    // next time instead of being stuck re-reading it. Otherwise store the index
    // we're on so the next visit resumes here.
    const isLastSentence = index >= sentences.length - 1;
    localStorage.setItem(LAST_INDEX_KEY, isLastSentence ? '-1' : index.toString());
  }
  
  // Force a browser reflow to ensure the initial state is rendered before adding active
  void contentDiv.offsetWidth;
  
  contentDiv.textContent = sentences[index][currentLanguage];
  
  // Add active class to trigger the smooth fade in
  contentDiv.classList.add('active');
  
  isTransitioning = true;
  
  // Only wait for the cooldown before allowing the next click.
  // We deliberately do NOT wait for enterDurationMs here, so the user can 
  // trigger the exit transition even if the text hasn't fully faded in yet!
  setTimeout(() => {
    isTransitioning = false;
  }, behavior.cooldown_ms);
}

// Language Modal Logic
function showLanguageModal() {
  languageModal.classList.remove('hidden');
}

function hideLanguageModal() {
  languageModal.classList.add('hidden');
}

languageModal.addEventListener('pointerdown', (e) => {
  // If they click on the overlay background itself, not the content
  if (e.target === languageModal) {
    e.stopPropagation();
    hideLanguageModal();
  }
});

btnEn.addEventListener('click', (e) => {
  e.stopPropagation(); // prevent triggering global click
  setLanguage('en');
});

btnEs.addEventListener('click', (e) => {
  e.stopPropagation();
  setLanguage('es');
});

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('nothing_lang', lang);
  hideLanguageModal();
  if (isAwake) {
    // Update the text immediately without re-triggering animations
    contentDiv.textContent = sentences[currentIndex][currentLanguage];
  }
}
