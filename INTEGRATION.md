# Metro Events — UI Refactor Integration Guide
## Step-by-step: dropping the new workspace UI into your Flask app

---

## What changed (file map)

| Old file | New file | Action |
|---|---|---|
| `templates/base.html` | `templates/base.html` | **Replace entirely** |
| `templates/dashboard/index.html` | `templates/dashboard/index.html` | **Replace entirely** |
| `templates/events/list.html` | `templates/events/list.html` | **Replace entirely** |
| `templates/clients/list.html` | `templates/clients/list.html` | **Replace entirely** |
| `templates/events/form.html` | `templates/events/form.html` | **Replace entirely** |
| `static/css/metro.css` | `static/css/metro.css` | **Replace entirely** |
| `static/js/metro.js` | `static/js/metro.js` | **Replace entirely** |

**Nothing in your Python routes, models, or database changes.**

---

## Step 1 — Remove Bootstrap from base.html (already done)

The new `base.html` drops the Bootstrap CDN link entirely and loads:

```html
<!-- Tailwind CSS (Play CDN — swap for compiled build in production) -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Lucide icons (replaces all emoji nav icons) -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

<!-- Google Fonts: Outfit + Plus Jakarta Sans -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800
     &family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
```

**Why Tailwind Play CDN?** Zero build step — it works immediately in your Flask dev
server. When you're ready to deploy, run the Tailwind CLI to compile a ~5KB purged
CSS file instead.

---

## Step 2 — Update your child templates (other pages not included above)

Every template that extended `base.html` still works **without changes** because
the block names are identical:

```
{% block title %}        → unchanged
{% block page_title %}   → unchanged
{% block breadcrumb %}   → unchanged
{% block topbar_actions %}→ unchanged
{% block content %}      → unchanged
{% block scripts %}      → unchanged
```

### Migrate old Bootstrap classes to new design-token classes

| Old class | New class | Notes |
|---|---|---|
| `btn-gold` | `me-btn me-btn-primary` | Add Lucide icon instead of emoji |
| `btn-outline-gold` | `me-btn me-btn-secondary` | |
| `btn btn-sm btn-outline-secondary` | `me-btn me-btn-secondary me-btn-sm` | |
| `me-form-control` | `me-input` or `me-select` | Same look, no Bootstrap dep |
| `me-form-label` | `me-label` | |
| `me-card` | `me-card` | Identical class name — no change |
| `me-card-header` | `me-card-header` | Identical |
| `me-card-body` | `me-card-body` | Identical |
| `me-table` | `me-table` | Identical — table structure unchanged |
| `badge bg-success` | `me-badge me-badge-green` | |
| `badge bg-danger` | `me-badge me-badge-red` | |
| `badge bg-warning text-dark`| `me-badge me-badge-yellow` | |
| `badge bg-secondary` | `me-badge me-badge-slate` | |
| `kpi-card` | `me-kpi` | Restructured — see dashboard template |

### Replace emoji nav icons

In `base.html` all nav icons are now Lucide SVGs. The pattern is:
```html
<!-- OLD -->
<span class="nav-icon">🎉</span> Events

<!-- NEW -->
<i data-lucide="calendar-days" class="w-4 h-4"></i>
<span>Events</span>
```

Always call `lucide.createIcons()` after any dynamic content insertion
(already handled in `base.html` and `metro.js`).

---

## Step 3 — Flask route: no changes needed

Your routes pass exactly the same context variables to the templates.
Example — `dashboard.index` still passes:
```python
return render_template("dashboard/index.html",
    total_events=total_events,
    active_events=active_events,
    ...
)
```
The new template consumes identical variable names.

### One optional enhancement: add `now` to context_processor

The new `base.html` footer references `{{ now.year }}`. Add this to
`inject_globals()` in `app.py`:

```python
from datetime import datetime

@app.context_processor
def inject_globals():
    base = {
        "APP_NAME":    app.config["APP_NAME"],
        "APP_TAGLINE": app.config["APP_TAGLINE"],
        "now":         datetime.utcnow(),   # <-- add this
        "overdue_count":  0,
        "due_soon_count": 0,
    }
    ...
    return base
```

---

## Step 4 — Status colour mapping

The templates use `me-badge-{{ e.status_color }}`. Your `Event` model already
returns colour strings. Map them to the new token-based badge classes by updating
the model property (or adding a Jinja filter):

```python
# models/event.py — add/update status_color property
STATUS_BADGE = {
    "planning":    "blue",
    "production":  "yellow",
    "ready":       "green",
    "event_day":   "amber",
    "done":        "green",
    "cancelled":   "red",
    "inquiry":     "slate",
}

@property
def status_color(self):
    return self.STATUS_BADGE.get(self.status, "slate")
```

Same pattern applies to `Client.stage_color`.

---

## Step 5 — Modal usage pattern

The new system uses a single global modal backdrop in `base.html`.
To wire a quick-action modal on any page:

```html
<!-- 1. Hidden content source (anywhere in {% block content %}) -->
<div id="myModalContent" class="hidden">
  <div class="me-modal-header">
    <h2 class="me-modal-title">Confirm Action</h2>
    <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600">
      <i data-lucide="x" class="w-5 h-5"></i>
    </button>
  </div>
  <div class="me-modal-body">
    <p>Are you sure?</p>
  </div>
  <div class="me-modal-footer">
    <button onclick="closeModal()" class="me-btn me-btn-secondary">Cancel</button>
    <button class="me-btn me-btn-primary">Confirm</button>
  </div>
</div>

<!-- 2. Trigger button -->
<button onclick="openModal('myModalContent')" class="me-btn me-btn-primary">
  Open Modal
</button>
```

---

## Step 6 — Production Tailwind (when ready to deploy)

Replace the Play CDN with a compiled build:

```bash
# Install Tailwind CLI
npm install -D tailwindcss

# Create tailwind.config.js (scan your templates folder)
npx tailwindcss init

# tailwind.config.js
module.exports = {
  content: ["./templates/**/*.html", "./static/js/**/*.js"],
  theme: { extend: { /* same tokens as in base.html config block */ } },
}

# Compile to static/css/tailwind.min.css
npx tailwindcss -o static/css/tailwind.min.css --minify
```

Then swap the CDN `<script>` for:
```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/tailwind.min.css') }}" />
```

---

## Checklist

- [ ] Replace `base.html`, `metro.css`, `metro.js`
- [ ] Replace `dashboard/index.html`, `events/list.html`, `clients/list.html`, `events/form.html`
- [ ] Add `now` to `inject_globals()` in `app.py`
- [ ] Update `status_color` / `stage_color` model properties to return token names
- [ ] Migrate remaining page templates (other list/form/detail pages) using the class mapping table above
- [ ] Remove Bootstrap CDN from any remaining templates
- [ ] Test all Flask routes — route functions need zero changes
- [ ] (Optional) Compile Tailwind before deploying to production
