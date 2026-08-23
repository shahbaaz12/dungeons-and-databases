const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeColor = document.querySelector('meta[name="theme-color"]');
const preferredTheme = window.matchMedia('(prefers-color-scheme: light)');

function readSavedTheme() {
  try {
    return localStorage.getItem('dnd-theme');
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem('dnd-theme', theme);
  } catch (error) {
    // The selected theme still applies for this page when storage is unavailable.
  }
}

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  const nextLabel = nextTheme === 'dark' ? 'Light' : 'Dark';

  root.dataset.theme = nextTheme;
  themeColor?.setAttribute('content', nextTheme === 'dark' ? '#2c2c2c' : '#f3f4f4');

  if (themeToggle) {
    themeToggle.setAttribute('aria-label', `Switch to ${nextLabel.toLowerCase()} theme`);
    themeToggle.setAttribute('title', `Switch to ${nextLabel.toLowerCase()} theme`);
  }

  if (themeLabel) themeLabel.textContent = nextLabel;
}

applyTheme(readSavedTheme() || (preferredTheme.matches ? 'light' : 'dark'));

themeToggle?.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  saveTheme(nextTheme);
  applyTheme(nextTheme);
});

preferredTheme.addEventListener?.('change', (event) => {
  if (!readSavedTheme()) applyTheme(event.matches ? 'light' : 'dark');
});

// Lessons are long. Browsers restore the previous scroll position on reload and
// back/forward, which drops the reader into the middle of a page they meant to
// start. Turning that off also suppresses the browser's own jump to a #fragment,
// so we perform both behaviours ourselves.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function openAtTopOrAnchor() {
  const hash = window.location.hash;

  if (hash.length > 1) {
    let target = null;
    try {
      target = document.querySelector(hash);
    } catch (error) {
      target = document.getElementById(hash.slice(1));
    }
    if (target) {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      return;
    }
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

openAtTopOrAnchor();

window.addEventListener('pageshow', (event) => {
  openAtTopOrAnchor();

  // On a back/forward restore from the bfcache some browsers reapply the old
  // scroll position after pageshow has run, so assert it again next frame.
  if (event.persisted) {
    requestAnimationFrame(openAtTopOrAnchor);
  }
});

window.addEventListener('popstate', () => {
  requestAnimationFrame(openAtTopOrAnchor);
});
