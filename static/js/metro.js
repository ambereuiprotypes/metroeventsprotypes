/**
 * Metro Events — UI JavaScript v2.0
 * Handles: sidebar toggle, modals, form enhancements, table filtering
 */

(function () {
  "use strict";

  // ── SIDEBAR TOGGLE (mobile) ──────────────────────────────
  const sidebar  = document.getElementById("meSidebar");
  const overlay  = document.getElementById("sidebarOverlay");
  const toggleBtn = document.getElementById("sidebarToggle");

  function openSidebar() {
    sidebar  && sidebar.classList.add("open");
    overlay  && overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar  && sidebar.classList.remove("open");
    overlay  && overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
  if (overlay)   overlay.addEventListener("click",   closeSidebar);

  // Close sidebar on navigation (mobile UX)
  document.querySelectorAll(".me-nav a, .me-sidebar-footer a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  // ── MODAL SYSTEM ────────────────────────────────────────
  /**
   * Usage:
   *   openModal('myModalId')   — opens a .me-modal-overlay
   *   closeModal('myModalId')  — closes it
   *
   * Add data-modal-open="modalId" to any button to auto-wire it.
   * Add data-modal-close to any close button inside the modal.
   */
  window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  };

  window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("open");
      document.body.style.overflow = "";
    }
  };

  // Auto-wire [data-modal-open] and [data-modal-close]
  document.querySelectorAll("[data-modal-open]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.modalOpen));
  });

  document.querySelectorAll("[data-modal-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".me-modal-overlay");
      if (modal) {
        modal.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  });

  // Close on overlay click (click outside modal box)
  document.querySelectorAll(".me-modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".me-modal-overlay.open").forEach(m => {
        m.classList.remove("open");
        document.body.style.overflow = "";
      });
    }
  });

  // ── AUTO-DISMISS FLASH ALERTS ────────────────────────────
  // Success alerts disappear after 5s, others persist.
  document.querySelectorAll(".me-alert-success").forEach(alert => {
    setTimeout(() => {
      alert.style.transition = "opacity 0.4s ease, max-height 0.4s ease";
      alert.style.opacity    = "0";
      alert.style.maxHeight  = "0";
      alert.style.overflow   = "hidden";
      alert.style.margin     = "0";
      alert.style.padding    = "0";
      setTimeout(() => alert.remove(), 450);
    }, 5000);
  });

  // ── ACTIVE NAV LINK HIGHLIGHTING ────────────────────────
  // Adds active class based on exact or prefix URL match
  const path = window.location.pathname;
  document.querySelectorAll(".me-nav a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    // Exact match wins; prefix match if link isn't just "/"
    if (href === path || (href !== "/" && path.startsWith(href))) {
      link.classList.add("active");
    }
  });

  // ── STATUS BADGE MAP ─────────────────────────────────────
  // Utility for dynamically updating status badges after AJAX
  window.updateStatusBadge = function (el, status) {
    const classMap = {
      planning:   "planning",
      production: "production",
      ready:      "ready",
      event_day:  "event_day",
      done:       "done",
      cancelled:  "cancelled",
    };
    el.className = "status-badge " + (classMap[status] || "done");
    el.textContent = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  // ── FORM ENHANCEMENT: Character counters ─────────────────
  document.querySelectorAll("[data-maxlength]").forEach(input => {
    const max    = parseInt(input.dataset.maxlength, 10);
    const hint   = document.createElement("div");
    hint.style.cssText = "font-size:11px;color:var(--admin-text-muted);margin-top:3px;text-align:right;";
    input.parentNode.appendChild(hint);
    const update = () => {
      const rem = max - input.value.length;
      hint.textContent = rem + " characters remaining";
      hint.style.color = rem < 20 ? "var(--danger)" : "var(--admin-text-muted)";
    };
    update();
    input.addEventListener("input", update);
  });

  // ── CONFIRM DELETE HELPER ────────────────────────────────
  window.confirmDelete = function (formId, message) {
    if (confirm(message || "Are you sure? This action cannot be undone.")) {
      document.getElementById(formId).submit();
    }
  };

  // ── COPY TO CLIPBOARD ────────────────────────────────────
  window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn ? btn.innerHTML : null;
      if (btn) {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        btn.style.color = "var(--success)";
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.color = "";
        }, 2000);
      }
    });
  };

  // ── SEARCH + FILTER TABLE UTILITY ───────────────────────
  // Generic: attach to any table with data-searchable attribute
  const searchableTable = document.querySelector("[data-searchable]");
  const globalSearch    = document.getElementById("globalSearch");

  if (searchableTable && globalSearch) {
    globalSearch.addEventListener("input", function () {
      const q = this.value.toLowerCase();
      searchableTable.querySelectorAll("tbody tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  // ── SMOOTH SCROLL for anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ── TOOLTIP INIT (simple title-based) ───────────────────
  // Enhances native browser title tooltips with a small delay
  // (Bootstrap tooltips are available if needed via data-bs-toggle="tooltip")
  const bsTooltipEls = document.querySelectorAll('[title]');
  if (bsTooltipEls.length && typeof bootstrap !== 'undefined') {
    bsTooltipEls.forEach(el => {
      if (!el.closest('.me-table-actions')) return; // only action buttons
      new bootstrap.Tooltip(el, { placement: 'top', trigger: 'hover' });
    });
  }

  // ── PROGRESS BARS: Animate on page load ─────────────────
  function animateProgressBars() {
    document.querySelectorAll(".client-progress-fill").forEach(bar => {
      const target = bar.style.width;
      bar.style.width = "0%";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = target;
        });
      });
    });
  }
  animateProgressBars();

  // ── KPI CARD NUMBER ANIMATION ────────────────────────────
  function animateCountUp(el) {
    const target = parseInt(el.textContent.replace(/[^0-9]/g, ""), 10);
    if (isNaN(target) || target === 0) return;
    let current    = 0;
    const duration = 700; // ms
    const step     = Math.ceil(target / (duration / 16));
    const timer    = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 16);
  }

  document.querySelectorAll(".kpi-value").forEach(el => {
    // Only animate pure integer values (not currency)
    if (/^\d+$/.test(el.textContent.trim())) {
      animateCountUp(el);
    }
  });

  // ── FORM VALIDATION STYLES ───────────────────────────────
  // Mark invalid fields with red border on submit
  document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", () => {
      form.querySelectorAll("[required]").forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = "var(--danger)";
          field.style.boxShadow   = "0 0 0 3px rgba(239,68,68,0.12)";
        } else {
          field.style.borderColor = "";
          field.style.boxShadow   = "";
        }
      });
    });
  });

  // Clear error style on input
  document.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => {
      if (field.value.trim()) {
        field.style.borderColor = "";
        field.style.boxShadow   = "";
      }
    });
  });

  // ── PASSWORD TOGGLE (global helper) ─────────────────────
  window.togglePwd = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    if (btn) {
      btn.setAttribute("aria-label",
        input.type === "password" ? "Show password" : "Hide password"
      );
    }
  };

})();
