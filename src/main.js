import data from './config.yml';
import './style.css';

const { behavior, visuals, sentences } = data;

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

// Infer language based on browser preference
let currentLanguage = navigator.language.startsWith('es') ? 'es' : 'en';
let currentIndex = 0;
let isAwake = false;
let isTransitioning = false;
let lastTap = 0;
let tapTimeout;

// Initialization: start the void timer
setTimeout(() => {
  wakeUp();
}, behavior.initial_delay_ms);

function wakeUp() {
  if (isAwake) return;
  isAwake = true;
  showSentence(currentIndex);
}

// Global interaction handler (click, touch, space, enter)
function handleInteraction(e) {
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
    // If we're at the end, just do nothing. Let them keep clicking.
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
  hideLanguageModal();
  if (isAwake) {
    // Update the text immediately without re-triggering animations
    contentDiv.textContent = sentences[currentIndex][currentLanguage];
  }
}
