let backdropEl;
let panelEl;
let titleEl;
let bodyEl;
let closeButtonEl;
let isOpen = false;
let previousBodyOverflow = '';

function ensureElements() {
  if (backdropEl) return;

  backdropEl = document.createElement('div');
  backdropEl.className = 'slide-over-backdrop';
  backdropEl.setAttribute('aria-hidden', 'true');

  panelEl = document.createElement('aside');
  panelEl.className = 'slide-over-panel';
  panelEl.setAttribute('role', 'dialog');
  panelEl.setAttribute('aria-label', 'Task detail');

  const header = document.createElement('header');
  header.className = 'slide-over-header';

  titleEl = document.createElement('h2');
  titleEl.className = 'slide-over-title';

  closeButtonEl = document.createElement('button');
  closeButtonEl.type = 'button';
  closeButtonEl.className = 'slide-over-close';
  closeButtonEl.setAttribute('aria-label', 'Close');
  closeButtonEl.textContent = '\u00D7';

  bodyEl = document.createElement('div');
  bodyEl.className = 'slide-over-body';

  header.append(titleEl, closeButtonEl);
  panelEl.append(header, bodyEl);
  backdropEl.append(panelEl);
  document.body.append(backdropEl);

  closeButtonEl.addEventListener('click', closeSlideOver);
  backdropEl.addEventListener('click', (event) => {
    if (event.target === backdropEl) {
      closeSlideOver();
    }
  });
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    closeSlideOver();
  }
}

function bindProjectLinks() {
  bodyEl.querySelectorAll('[data-project-id]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const projectId = link.dataset.projectId;
      if (!projectId) return;
      window.location.hash = `#/projects/${projectId}`;
      closeSlideOver();
    });
  });
}

export function openSlideOver({ title, content }) {
  ensureElements();

  titleEl.textContent = title || 'Task';
  bodyEl.innerHTML = content || '';
  bindProjectLinks();

  if (!isOpen) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
  }

  isOpen = true;
  backdropEl.classList.add('open');
  backdropEl.setAttribute('aria-hidden', 'false');
  closeButtonEl.focus();
}

export function closeSlideOver() {
  if (!backdropEl || !isOpen) return;

  isOpen = false;
  backdropEl.classList.remove('open');
  backdropEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = previousBodyOverflow;
  document.removeEventListener('keydown', onKeydown);
}

export function isSlideOverOpen() {
  return isOpen;
}
