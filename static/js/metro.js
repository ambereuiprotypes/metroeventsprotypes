/* ============================================================
   METRO EVENTS — metro.js v2.0
   Minimal vanilla JS. No jQuery. No heavy frameworks.
   ============================================================ */

/* ── SIDEBAR (mobile toggle) ───────────────────────────────── */
function openSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.add('open');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.remove('open');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ── MODAL SYSTEM ──────────────────────────────────────────── */

/**
 * Opens the global modal backdrop and injects the content
 * identified by `contentId` (a hidden <div> on the page).
 * Usage: openModal('myModalContent')
 */
function openModal(contentId) {
  const backdrop  = document.getElementById('modalBackdrop');
  const container = document.getElementById('modalContainer');
  const source    = document.getElementById(contentId);
  if (!backdrop || !container || !source) return;

  container.innerHTML = source.innerHTML;
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Re-run Lucide so icons inside the modal render
  if (window.lucide) lucide.createIcons();
}

/**
 * Closes the modal and restores scroll.
 */
function closeModal(event) {
  // If called from backdrop click, only close if clicking outside the container
  if (event && event.target !== document.getElementById('modalBackdrop')) return;

  const backdrop = document.getElementById('modalBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

// ESC key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop && backdrop.classList.contains('active')) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

/* ── AUTO-DISMISS FLASH ALERTS ─────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.me-alert');
  alerts.forEach(alert => {
    // Only auto-dismiss non-error alerts
    if (!alert.classList.contains('me-alert-danger')) {
      setTimeout(() => {
        alert.style.transition = 'opacity 400ms ease, transform 400ms ease';
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-6px)';
        setTimeout(() => alert.remove(), 420);
      }, 4500);
    }
  });
});

/* ── CSRF HELPER (for fetch() / AJAX calls) ─────────────────── */
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}

/**
 * Convenience wrapper for JSON POST requests.
 * Usage: await postJson('/events/1/toggle', { key: value })
 */
async function postJson(url, payload = {}) {
  const response = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken':  getCsrfToken(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/* ── TABLE ROW CLICK (if needed on specific pages) ─────────── */
/**
 * Makes entire <tr> rows clickable if they have data-href.
 * Usage in template: <tr data-href="/events/42">
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('tr[data-href]').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      window.location.href = row.dataset.href;
    });
  });
});
