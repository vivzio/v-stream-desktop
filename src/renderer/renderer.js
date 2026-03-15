const titleEl = document.getElementById('window-title');
const minimizeBtn = document.getElementById('minimize');
const maximizeBtn = document.getElementById('maximize');
const closeBtn = document.getElementById('close');
const titlebar = document.getElementById('titlebar');
const titlebarRight = document.querySelector('.titlebar__right');
const appIcon = document.querySelector('.app-icon');
const controls = window.windowControls;

// Store last theme color to restore after reload (persist across reloads)
const THEME_COLOR_KEY = 'V-Stream-titlebar-theme-color';

// Function to apply theme color to titlebar
const applyThemeColor = (color) => {
  if (!titlebar) return;
  if (color) {
    titlebar.style.background = color;
    titlebar.style.borderBottomColor = 'transparent';
    // Persist theme color for reload
    sessionStorage.setItem(THEME_COLOR_KEY, color);
  } else {
    // Reset to default if no color provided
    titlebar.style.background = '';
    titlebar.style.borderBottomColor = '';
    sessionStorage.removeItem(THEME_COLOR_KEY);
  }
};

// Restore theme color from sessionStorage after page loads
const restoreThemeColor = () => {
  const savedColor = sessionStorage.getItem(THEME_COLOR_KEY);
  if (savedColor) {
    applyThemeColor(savedColor);
  }
};

// Applies platform-specific titlebar behavior
const applyPlatform = (platform) => {
  const isMac = platform === 'darwin';
  const isLinux = platform === 'linux';

  // Add platform class to body for CSS targeting
  document.body.setAttribute('data-platform', platform);

  if (isMac) {
    // macOS: Hide custom buttons, window title, and logo
    if (titlebarRight) titlebarRight.style.display = 'none';
    if (titleEl) titleEl.style.display = 'none';
    if (appIcon) appIcon.style.display = 'none';
    if (titlebar) titlebar.classList.add('titlebar--macos');
  } else if (isLinux) {
    // Linux: Show custom buttons with chevron icons
    if (titlebar) titlebar.classList.add('titlebar--linux');
    if (appIcon) appIcon.style.display = 'block';
    // Switch to Linux icons: chevron down for minimize, chevron up for maximize
    const minimizeIcon = minimizeBtn?.querySelector('svg');
    const maximizeIcon = maximizeBtn?.querySelector('.icon-max');
    const restoreIcon = maximizeBtn?.querySelector('.icon-restore');
    if (minimizeIcon) {
      minimizeIcon.innerHTML =
        '<path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />';
    }
    if (maximizeIcon) {
      maximizeIcon.innerHTML =
        '<path d="M3 7.5l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />';
    }
    if (restoreIcon) {
      // Restore icon also uses chevron up (same as maximize when not maximized)
      restoreIcon.innerHTML =
        '<path d="M3 7.5l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />';
    }
  } else {
    // Windows: Keep default Windows-style icons
    if (titlebar) titlebar.classList.add('titlebar--windows');
    if (appIcon) appIcon.style.display = 'block';
  }

  // After platform is set, wait for page to load then restore theme color
  if (document.readyState === 'complete') {
    // Page already loaded, restore immediately after a short delay
    setTimeout(restoreThemeColor, 100);
  } else {
    // Wait for page to load before restoring theme color
    window.addEventListener('load', () => {
      setTimeout(restoreThemeColor, 100);
    });
  }
};

const detectPlatformFallback = () => {
  const raw = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const platform = raw.toLowerCase();
  if (platform.includes('mac')) return 'darwin';
  if (platform.includes('linux')) return 'linux';
  return 'win32';
};

// Ensure platform classes are applied even if IPC callback arrives late/unavailable.
applyPlatform(detectPlatformFallback());
if (controls && typeof controls.onPlatformChanged === 'function') {
  controls.onPlatformChanged((platform) => {
    applyPlatform(platform || detectPlatformFallback());
  });
}

if (minimizeBtn && controls && typeof controls.minimize === 'function') {
  minimizeBtn.addEventListener('click', () => controls.minimize());
}
if (maximizeBtn && controls && typeof controls.maximizeToggle === 'function') {
  maximizeBtn.addEventListener('click', () => controls.maximizeToggle());
}
if (closeBtn && controls && typeof controls.close === 'function') {
  closeBtn.addEventListener('click', () => controls.close());
}

if (titlebar && controls && typeof controls.maximizeToggle === 'function') {
  titlebar.addEventListener('dblclick', (event) => {
    const isButton = event.target.closest('.window-btn');
    if (isButton) return;
    controls.maximizeToggle();
  });
}

if (controls && typeof controls.onTitleChanged === 'function') {
  controls.onTitleChanged((title) => {
    if (titleEl) titleEl.textContent = title || 'V-Stream';
  });
}

if (controls && typeof controls.onMaximizedChanged === 'function') {
  controls.onMaximizedChanged((isMaximized) => {
    if (!maximizeBtn) return;
    if (isMaximized) maximizeBtn.classList.add('is-maximized');
    else maximizeBtn.classList.remove('is-maximized');
  });
}

if (controls && typeof controls.onThemeColorChanged === 'function') {
  controls.onThemeColorChanged((color) => {
    applyThemeColor(color);
  });
}

// Hide/show titlebar based on fullscreen state
if (controls && typeof controls.onFullscreenChanged === 'function') {
  controls.onFullscreenChanged((isFullscreen) => {
    if (titlebar) {
      if (isFullscreen) {
        titlebar.style.display = 'none';
      } else {
        titlebar.style.display = '';
      }
    }
  });
}
