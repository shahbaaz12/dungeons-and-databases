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
