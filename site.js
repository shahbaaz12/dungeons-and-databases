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

const root = document.documentElement;
const toggle = document.querySelector('[data-theme-toggle]');
const themeLabel = document.querySelector('[data-theme-label]');
const themeIcon = document.querySelector('[data-theme-icon]');

const savedTheme = localStorage.getItem('dnd-theme');
const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

function applyTheme(theme) {
  root.dataset.theme = theme;
  const isDark = theme === 'dark';

  if (toggle) {
    toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  }

  if (themeLabel) themeLabel.textContent = isDark ? 'Light' : 'Dark';
  if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
}

applyTheme(savedTheme || preferredTheme);

toggle?.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('dnd-theme', nextTheme);
  applyTheme(nextTheme);
});
