/* Apply the last confirmed theme before the first paint. Cloud settings stay authoritative. */
(() => {
  const key = 'coursewise-theme';
  const themes = ['green', 'teal', 'blue', 'purple', 'pink', 'orange'];
  function apply(theme, persist = true) {
    const selected = themes.includes(theme) ? theme : 'green';
    document.documentElement.dataset.theme = selected;
    if (persist) { try { localStorage.setItem(key, selected); } catch {} }
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  apply(saved, false);
  window.CoursewiseTheme = { apply };

  // The mode is cached on this device for the first paint; a signed-in account's saved mode (Settings.Appearance) is applied after load.
  const modeKey = 'coursewise-appearance';
  // Light is the default; only an explicit dark preference enables dark mode.
  let mode = 'light';
  try { if (localStorage.getItem(modeKey) === 'dark') mode = 'dark'; } catch {}
  function refreshAppearance() {
    document.documentElement.dataset.appearance = mode;
    document.documentElement.style.colorScheme = mode;
    document.querySelectorAll('[data-appearance-option]').forEach(input => { input.checked = input.value === mode; });
  }
  function setAppearance(value, persist = true) {
    mode = value === 'dark' ? 'dark' : 'light';
    if (persist) { try { localStorage.setItem(modeKey, mode); } catch {} }
    refreshAppearance();
  }
  window.CoursewiseAppearance = { set: setAppearance, get: () => mode };
  refreshAppearance();
  window.addEventListener('storage', event => {
    if (event.key === modeKey || event.key === null) setAppearance(event.newValue, false);
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-appearance-option]') && event.target.checked) {
      setAppearance(event.target.value);
      // Lets the account settings save the choice; device-only pages simply ignore it.
      document.dispatchEvent(new CustomEvent('coursewise:appearance', { detail: { mode } }));
    }
  });
  document.addEventListener('DOMContentLoaded', refreshAppearance);

  // Start before external scripts load, so a slow network also gets feedback.
  if (document.documentElement.dataset.workspaceLoading === 'pending') {
    const timer = setTimeout(() => {
      if (document.documentElement.dataset.workspaceLoading === 'pending') {
        document.documentElement.dataset.workspaceLoading = 'slow';
      }
    }, 1000);
    window.CoursewiseLoading = {
      finish() {
        clearTimeout(timer);
        delete document.documentElement.dataset.workspaceLoading;
      }
    };
  }
})();
