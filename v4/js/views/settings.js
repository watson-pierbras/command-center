export function render(container) {
  container.innerHTML = `
    <section class="app-view">
      <h1 class="h-title">Settings</h1>
      <div class="stack-4">
        <article class="surface-card" style="padding: var(--space-4);">
          <h2 style="font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);">Appearance</h2>
          <div class="subtle">Theme preference is controlled via the sidebar toggle.</div>
        </article>
        <article class="surface-card" style="padding: var(--space-4);">
          <h2 style="font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);">API Configuration</h2>
          <div class="subtle">Backend connection settings will be available in Phase 2 when the Cloudflare Worker is deployed.</div>
        </article>
        <article class="surface-card" style="padding: var(--space-4);">
          <h2 style="font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); margin-bottom: var(--space-3);">About</h2>
          <div class="stack-2">
            <div class="subtle">Command Center v4</div>
            <div class="subtle">Architecture: CRM-style object associations</div>
            <div class="subtle">Backend: Cloudflare Workers + D1 (Phase 2)</div>
            <div class="subtle">Frontend: Vanilla JS + CSS Custom Properties</div>
          </div>
        </article>
      </div>
    </section>
  `;
}
