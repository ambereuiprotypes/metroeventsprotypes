/**
 * Metro Events — UI JavaScript v2.1
 * Mobile-first: sidebar swipe, bottom nav, tab persistence,
 * modal traps, live search, form polish, count-up, progress animation.
 */
(function () {
  "use strict";

  /* ── SIDEBAR ──────────────────────────────────────────────── */
  const sidebar    = document.getElementById("meSidebar");
  const sOverlay   = document.getElementById("sidebarOverlay");
  const toggleBtn  = document.getElementById("sidebarToggle");
  let   touchStart = null;

  function openSidebar()  {
    sidebar && sidebar.classList.add("open");
    sOverlay && sOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeSidebar() {
    sidebar && sidebar.classList.remove("open");
    sOverlay && sOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openSidebar);
  if (sOverlay)  sOverlay.addEventListener("click",  closeSidebar);

  // Close on nav link tap (mobile)
  document.querySelectorAll(".me-nav a, .me-sidebar-footer a").forEach(a =>
    a.addEventListener("click", () => { if (window.innerWidth < 768) closeSidebar(); })
  );

  // Swipe-to-close (left edge drag)
  document.addEventListener("touchstart", e => { touchStart = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend",   e => {
    if (touchStart === null) return;
    const dx = e.changedTouches[0].clientX - touchStart;
    if (sidebar && sidebar.classList.contains("open") && dx < -60) closeSidebar();
    if (sidebar && !sidebar.classList.contains("open") && touchStart < 24 && dx > 60) openSidebar();
    touchStart = null;
  }, { passive: true });

  /* ── MODAL SYSTEM ─────────────────────────────────────────── */
  window.openModal  = id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("open");
    document.body.style.overflow = "hidden";
    // Focus first input
    setTimeout(() => { const f = el.querySelector("input:not([type=hidden]),select,textarea"); f && f.focus(); }, 120);
  };
  window.closeModal = id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("open");
    document.body.style.overflow = "";
  };

  document.querySelectorAll("[data-modal-open]").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.modalOpen))
  );
  document.querySelectorAll("[data-modal-close]").forEach(btn =>
    btn.addEventListener("click", () => {
      const m = btn.closest(".me-modal-overlay");
      if (m) { m.classList.remove("open"); document.body.style.overflow = ""; }
    })
  );
  document.querySelectorAll(".me-modal-overlay").forEach(ov =>
    ov.addEventListener("click", e => {
      if (e.target === ov) { ov.classList.remove("open"); document.body.style.overflow = ""; }
    })
  );
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".me-modal-overlay.open").forEach(m => {
      m.classList.remove("open"); document.body.style.overflow = "";
    });
    if (sidebar && sidebar.classList.contains("open")) closeSidebar();
  });

  /* Focus trap inside open modals */
  document.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const modal = document.querySelector(".me-modal-overlay.open .me-modal");
    if (!modal) return;
    const focusable = [...modal.querySelectorAll(
      'a,button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )].filter(el => !el.closest("[style*='display:none']"));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ── FLASH AUTO-DISMISS ───────────────────────────────────── */
  document.querySelectorAll(".me-alert-success").forEach(a => {
    setTimeout(() => {
      a.style.transition = "opacity .4s,max-height .4s,margin .4s,padding .4s";
      a.style.opacity = "0"; a.style.maxHeight = "0";
      a.style.overflow = "hidden"; a.style.margin = "0"; a.style.padding = "0";
      setTimeout(() => a.remove(), 450);
    }, 4500);
  });

  /* ── ACTIVE NAV ───────────────────────────────────────────── */
  const path = window.location.pathname;
  document.querySelectorAll(".me-nav a").forEach(a => {
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    if (href === path || (href.length > 1 && path.startsWith(href)))
      a.classList.add("active");
  });

  /* ── PROGRESS BARS ANIMATE IN ─────────────────────────────── */
  function animateBars() {
    document.querySelectorAll(".client-progress-fill, .reliability-fill").forEach(bar => {
      const w = bar.style.width;
      bar.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = w; }));
    });
  }
  animateBars();

  /* ── KPI COUNT-UP ─────────────────────────────────────────── */
  document.querySelectorAll(".kpi-value").forEach(el => {
    const raw = el.textContent.trim();
    const num = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num) && num > 0 && /^\d+$/.test(raw)) {
      let cur = 0;
      const step = Math.max(1, Math.ceil(num / 40));
      const t = setInterval(() => {
        cur = Math.min(cur + step, num);
        el.textContent = cur.toLocaleString();
        if (cur >= num) clearInterval(t);
      }, 16);
    }
  });

  /* ── TAB PERSISTENCE (workspace) ─────────────────────────── */
  // Tabs use URL ?tab= — nothing needed client-side, but we scroll
  // the active tab into view on load (important for mobile).
  const activeTab = document.querySelector(".me-workspace-tabs .tab-btn.active");
  if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });

  /* ── TABLE SEARCH UTIL (generic) ─────────────────────────── */
  const gSearch = document.getElementById("globalSearch");
  const gTable  = document.querySelector("[data-searchable]");
  if (gSearch && gTable) {
    gSearch.addEventListener("input", function () {
      const q = this.value.toLowerCase();
      gTable.querySelectorAll("tbody tr").forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  /* ── FORM HELPERS ─────────────────────────────────────────── */
  // Required-field highlight on submit
  document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", () => {
      form.querySelectorAll("[required]").forEach(f => {
        const empty = f.type === "checkbox" ? !f.checked : !f.value.trim();
        f.style.borderColor = empty ? "var(--danger)" : "";
        f.style.boxShadow   = empty ? "0 0 0 3px rgba(239,68,68,.12)" : "";
      });
    });
  });
  // Clear error style on input
  document.querySelectorAll("input,select,textarea").forEach(f => {
    f.addEventListener("input", () => { f.style.borderColor = ""; f.style.boxShadow = ""; });
  });

  // Character counter
  document.querySelectorAll("[data-maxlength]").forEach(inp => {
    const max  = parseInt(inp.dataset.maxlength, 10);
    const hint = document.createElement("div");
    hint.style.cssText = "font-size:11px;color:var(--admin-text-muted);margin-top:3px;text-align:right;";
    inp.parentNode.appendChild(hint);
    const upd = () => {
      const rem = max - inp.value.length;
      hint.textContent = rem + " chars remaining";
      hint.style.color = rem < 20 ? "var(--danger)" : "var(--admin-text-muted)";
    };
    upd(); inp.addEventListener("input", upd);
  });

  /* ── PASSWORD TOGGLE ──────────────────────────────────────── */
  window.togglePwd = (id) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.type = inp.type === "password" ? "text" : "password";
  };

  /* ── COPY TO CLIPBOARD ────────────────────────────────────── */
  window.copyToClipboard = (text, btn) => {
    navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
      btn.style.color = "var(--success)";
      setTimeout(() => { btn.innerHTML = orig; btn.style.color = ""; }, 2000);
    });
  };

  /* ── CONFIRM DELETE ───────────────────────────────────────── */
  window.confirmDelete = (formId, msg) => {
    if (confirm(msg || "Delete this item? This cannot be undone."))
      document.getElementById(formId).submit();
  };

  /* ── STATUS BADGE UPDATER (AJAX use) ─────────────────────── */
  window.updateStatusBadge = (el, status) => {
    const map = { planning:"planning", production:"production", ready:"ready",
                  event_day:"event_day", done:"done", cancelled:"cancelled" };
    el.className = "status-badge " + (map[status] || "done");
    el.textContent = status.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase());
  };

  /* ── MOBILE TABLE → CARD CONVERSION ──────────────────────── */
  // Any <table> inside .me-table-wrap gets auto data-labels from <thead>
  document.querySelectorAll(".me-table-wrap table").forEach(tbl => {
    const headers = [...tbl.querySelectorAll("thead th")].map(th => th.textContent.trim());
    tbl.querySelectorAll("tbody tr").forEach(tr => {
      [...tr.querySelectorAll("td")].forEach((td, i) => {
        if (headers[i] && !td.dataset.label) td.dataset.label = headers[i];
      });
    });
  });

  /* ── SMOOTH SCROLL ────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  });

  /* ── INVENTORY VIEW TOGGLE ────────────────────────────────── */
  window.setView = v => {
    const grid  = document.getElementById("gridView");
    const table = document.getElementById("tableView");
    const bG    = document.getElementById("btnGrid");
    const bT    = document.getElementById("btnTable");
    if (!grid || !table) return;
    grid.style.display  = v === "grid"  ? "" : "none";
    table.style.display = v === "table" ? "" : "none";
    if (bG) bG.style.background = v === "grid"  ? "var(--brand-light)" : "";
    if (bT) bT.style.background = v === "table" ? "var(--brand-light)" : "";
  };

  /* ── TOOLTIP INIT ─────────────────────────────────────────── */
  if (typeof bootstrap !== "undefined") {
    document.querySelectorAll(".me-table-actions [title]").forEach(el =>
      new bootstrap.Tooltip(el, { placement: "top", trigger: "hover" })
    );
  }

})();
