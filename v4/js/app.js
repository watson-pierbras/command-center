import { initNavigation } from './components/sidebar.js';
import { initTheme } from './components/theme-toggle.js';
import { initCommandPalette } from './components/command-palette.js';
import { initRouter } from './router.js';

function initApp() {
  initTheme();
  initNavigation();
  const app = document.getElementById('app');
  if (app) {
    initRouter(app);
    initCommandPalette();
  }
}

initApp();
