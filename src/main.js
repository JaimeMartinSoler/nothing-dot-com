import data from './config.yml';
import './style.css';

const { behavior, visuals } = data;

// ============================================================================
// SENTENCE DISCOVERY (efficient, scales to thousands of files)
// ============================================================================
// `import.meta.glob` (lazy/non-eager) gives us a map of { path -> loader }.
// The KEYS (filenames) are known at build time WITHOUT downloading any file
// content — so we can pick a sentence at random just from the list of names.
// Vite code-splits each YAML into its own chunk, so calling a loader only
// fetches that single selected sentence file over the network.
const sentenceModules = import.meta.glob('./sentences/*.yaml');
const sentenceKeys = Object.keys(sentenceModules).sort();

// localStorage key holding the list of sentence files already shown to this
// browser, so we never repeat one until every sentence has been seen.
const SHOWN_STORAGE_KEY = 'nothing_shown_sentences';

function getShownKeys() {
  try {
    const stored = JSON.parse(localStorage.getItem(SHOWN_STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function setShownKeys(keys) {
  try {
    localStorage.setItem(SHOWN_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* localStorage may be unavailable (private mode); selection still works. */
  }
}

// Pick a random sentence file that hasn't been shown yet. Once every file has
// been displayed, the history resets and selection starts over from scratch.
// Operates purely on filenames — no sentence content is fetched here.
function selectNextSentenceKey() {
  if (sentenceKeys.length === 0) return null;

  // Drop any stale entries (files that no longer exist) from the history.
  let shown = getShownKeys().filter((k) => sentenceKeys.includes(k));
  let available = sentenceKeys.filter((k) => !shown.includes(k));

  if (available.length === 0) {
    // Everything has been seen: reset and start a fresh cycle.
    shown = [];
    available = sentenceKeys.slice();
  }

  const key = available[Math.floor(Math.random() * available.length)];
  shown.push(key);
  setShownKeys(shown);
  return key;
}

// Fetch the single selected sentence file. This is the ONLY network request
// for sentence content, and it happens lazily, one file at a time.
async function loadSentence(key) {
  const mod = await sentenceModules[key]();
  return mod.default ?? mod;
}

// Select + start fetching the next sentence ahead of time so it's ready the
// moment it needs to be displayed (e.g. during the initial void delay).
function preloadNextSentence() {
  const key = selectNextSentenceKey();
  return key ? loadSentence(key) : Promise.resolve(null);
}

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
let currentSentence = null;
let isAwake = false;
let isTransitioning = false;
let lastTap = 0;
let tapTimeout;

// Kick off loading the first sentence immediately so it's ready by the time
// the void delay ends (only this one file is fetched).
let pendingSentence = preloadNextSentence();

// Initialization: start the void timer
setTimeout(() => {
  wakeUp();
}, behavior.initial_delay_ms);

async function wakeUp() {
  if (isAwake) return;
  isAwake = true;
  const content = await pendingSentence;
  if (!content) return;
  currentSentence = content;
  showSentence(content);
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

async function nextSentence() {
  if (sentenceKeys.length === 0) return;

  isTransitioning = true;

  // Start fetching the next (random, unshown) sentence while the exit
  // animation plays, so the load is invisible to the user.
  pendingSentence = preloadNextSentence();

  // Trigger exit animation
  contentDiv.classList.remove('active');
  contentDiv.classList.add('exit');

  // Wait for BOTH the exit animation and the fetch to finish, then show it.
  const [content] = await Promise.all([
    pendingSentence,
    new Promise((resolve) => setTimeout(resolve, exitDurationMs)),
  ]);

  if (!content) {
    isTransitioning = false;
    return;
  }

  currentSentence = content;
  showSentence(content);
}

function showSentence(content) {
  // Reset classes
  contentDiv.classList.remove('exit');
  contentDiv.classList.remove('active');

  // Force a browser reflow to ensure the initial state is rendered before adding active
  void contentDiv.offsetWidth;

  contentDiv.textContent = content[currentLanguage] ?? content.en ?? '';

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
  if (isAwake && currentSentence) {
    // Update the text immediately without re-triggering animations
    contentDiv.textContent = currentSentence[currentLanguage] ?? currentSentence.en ?? '';
  }
}
