# Metro Events UI v2.0 — Integration Guide

## Overview

This package contains a complete front-end overhaul for the Metro Events
Flask + SQLite application. It replaces all templates and the CSS file.

---

## Files Included

```
static/
  css/
    metro.css          ← Complete design system (replaces old metro.css)
  js/
    metro.js           ← Sidebar, modals, animations, utilities

templates/
  base.html            ← Admin + team master layout (sidebar)
  base_client.html     ← Client portal master layout (top-nav)
  landing.html         ← Public landing page
  auth/
    login.html         ← Team/admin login (split-panel)
    register.html      ← Team/admin register (split-panel)
  client/
    login.html         ← Client portal login (standalone)
  dashboard/
    index.html         ← Admin dashboard (KPI grid, upcoming events)
  events/
    list.html          ← Events table with live filter
    form.html          ← New/edit event form
  portal/
    home.html          ← Client portal home (event cards)
    event.html         ← Client event workspace detail
  errors/
    404.html           ← 404 error page
```

---

## Step 1 — Drop In Files

Replace (overwrite) the following in your project root:

```bash
# Copy static assets
cp -r static/css/metro.css  your_project/static/css/metro.css
cp -r static/js/metro.js    your_project/static/js/metro.js

# Copy templates (merge, do not delete extra templates you have)
cp templates/base.html          your_project/templates/base.html
cp templates/base_client.html   your_project/templates/base_client.html
cp templates/landing.html       your_project/templates/landing.html
cp -r templates/auth/           your_project/templates/auth/
cp -r templates/client/         your_project/templates/client/
cp -r templates/dashboard/      your_project/templates/dashboard/
cp -r templates/events/         your_project/templates/events/
cp -r templates/portal/         your_project/templates/portal/
cp -r templates/errors/         your_project/templates/errors/
```

---

## Step 2 — Required Jinja2 Global Variables

In your `app.py` (or wherever you set up Flask globals), ensure these are
available in every template context:

```python
# app.py

APP_NAME    = "Metro Events"
APP_TAGLINE = "Where every detail matters"

@app.context_processor
def inject_globals():
    from datetime import datetime
    # Counts injected for sidebar badges and topbar warnings
    overdue_count   = 0   # replace with your real query
    due_soon_count  = 0   # replace with your real query
    new_inquiries   = 0   # replace with your real query
    today           = datetime.now()

    # Example real queries (adjust to your models):
    # from models.task import Task
    # overdue_count = Task.query.filter(
    #     Task.due_date < datetime.today(),
    #     Task.status != 'done'
    # ).count()

    return dict(
        APP_NAME=APP_NAME,
        APP_TAGLINE=APP_TAGLINE,
        today=today,
        overdue_count=overdue_count,
        due_soon_count=due_soon_count,
        new_inquiries=new_inquiries,
    )
```

---

## Step 3 — Jinja2 Filters

Add these custom filters to `app.py` (or a `filters.py` module):

```python
# app.py — register custom template filters

from babel.numbers import format_currency
from datetime import datetime

@app.template_filter('dateformat')
def dateformat(value, fmt='%b %d, %Y'):
    """Format a date object: {{ event.event_date | dateformat }}"""
    if value is None:
        return '—'
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%d')
        except ValueError:
            return value
    return value.strftime(fmt)

@app.template_filter('peso')
def peso_filter(value):
    """Format a number as Philippine Peso: {{ amount | peso }}"""
    if value is None:
        return '₱0.00'
    try:
        return '₱{:,.2f}'.format(float(value))
    except (ValueError, TypeError):
        return '₱0.00'
```

> Install Babel if needed: `pip install babel`

---

## Step 4 — Route & Blueprint Check

The templates reference these Flask endpoints. Verify yours match:

| Template reference                       | Expected endpoint                  |
|------------------------------------------|------------------------------------|
| `url_for('dashboard.index')`             | Blueprint `dashboard`, func `index`|
| `url_for('events.list_events')`          | Blueprint `events`, `list_events`  |
| `url_for('events.new_event')`            | Blueprint `events`, `new_event`    |
| `url_for('events.detail', event_id=...)` | Blueprint `events`, `detail`       |
| `url_for('events.edit_event', ...)`      | Blueprint `events`, `edit_event`   |
| `url_for('clients.list_clients')`        | Blueprint `clients`, `list_clients`|
| `url_for('clients.detail', ...)`         | Blueprint `clients`, `detail`      |
| `url_for('portal.home')`                 | Blueprint `portal`, `home`         |
| `url_for('portal.event_overview', ...)`  | Blueprint `portal`, `event_overview`|
| `url_for('portal.upload_peg', ...)`      | Blueprint `portal`, `upload_peg`   |
| `url_for('portal.feedback', ...)`        | Blueprint `portal`, `feedback`     |
| `url_for('auth.login')`                  | Blueprint `auth`, `login`          |
| `url_for('auth.logout')`                 | Blueprint `auth`, `logout`         |
| `url_for('auth.register')`               | Blueprint `auth`, `register`       |
| `url_for('auth.profile')`                | Blueprint `auth`, `profile`        |
| `url_for('auth.users_list')`             | Blueprint `auth`, `users_list`     |
| `url_for('client_auth.login')`           | Blueprint `client_auth`, `login`   |
| `url_for('client_auth.register')`        | Blueprint `client_auth`, `register`|
| `url_for('client_auth.forgot_password')` | Blueprint `client_auth`, `forgot_password`|
| `url_for('inventory.list_items')`        | Blueprint `inventory`, `list_items`|
| `url_for('suppliers.list_suppliers')`    | Blueprint `suppliers`, `list_suppliers`|
| `url_for('meetings.index')`              | Blueprint `meetings`, `index`      |
| `url_for('reports.index')`              | Blueprint `reports`, `index`       |
| `url_for('admin.approval_queue')`        | Blueprint `admin`, `approval_queue`|
| `url_for('public.index')`                | Blueprint `public`, `index`        |

If any blueprint name differs in your project, do a find-and-replace in the
templates. For example if your reports blueprint is called `report` (no `s`):

```bash
grep -r "reports.index" templates/ | xargs sed -i "s/reports.index/report.index/g"
```

---

## Step 5 — Dashboard Route Data

The `dashboard/index.html` expects these variables passed from the route:

```python
# routes/dashboard.py

from datetime import datetime, timedelta

@dashboard_bp.route('/')
@login_required
def index():
    today = datetime.now()
    thirty_days = today + timedelta(days=30)

    upcoming = Event.query.filter(
        Event.event_date >= today.date(),
        Event.event_date <= thirty_days.date(),
        Event.status != 'cancelled'
    ).order_by(Event.event_date).limit(8).all()

    # Inject days_until onto each event object
    for e in upcoming:
        delta = (e.event_date - today.date())
        e.days_until = delta.days

    return render_template('dashboard/index.html',
        total_events   = Event.query.count(),
        active_events  = Event.query.filter(
            Event.status.in_(['planning','production','ready','event_day'])
        ).count(),
        total_clients  = Client.query.count(),
        new_inquiries  = Client.query.filter_by(pipeline_stage='inquiry').count(),
        upcoming       = upcoming,
        overdue_tasks  = Task.query.filter(
            Task.due_date < today.date(),
            Task.status  != 'done'
        ).limit(5).all(),
        low_stock      = InventoryItem.query.filter(
            InventoryItem.available_qty <= InventoryItem.reorder_level
        ).limit(6).all(),
        recent_clients = Client.query.order_by(
            Client.created_at.desc()
        ).limit(5).all(),
        overdue_payments = Payment.query.filter(
            Payment.due_date < today.date(),
            Payment.status  != 'paid'
        ).limit(5).all(),
        today = today,
    )
```

---

## Step 6 — Client Portal Route Data

The `portal/home.html` expects:

```python
# routes/client_portal.py

@portal_bp.route('/')
@client_login_required
def home():
    from datetime import datetime
    today = datetime.now()

    client = current_user.client_profile  # or however your model links
    events = Event.query.filter_by(client_id=client.id)\
                        .order_by(Event.event_date).all()

    for e in events:
        delta = (e.event_date - today.date())
        e.days_until = delta.days

    return render_template('portal/home.html', events=events)
```

The `portal/event.html` expects:

```python
@portal_bp.route('/event/<int:event_id>')
@client_login_required
def event_overview(event_id):
    event    = Event.query.get_or_404(event_id)
    quote    = event.quotes[-1] if event.quotes else None
    payments = event.payments
    pegs     = event.mood_pegs.all()

    from datetime import datetime
    today = datetime.now().date()
    event.days_until = (event.event_date - today).days

    return render_template('portal/event.html',
        event=event,
        quote=quote,
        payments=payments,
        pegs=pegs,
        peg_categories=['flowers','lighting','table','outfit','food','venue','other'],
        today=today,
    )
```

---

## Step 7 — Register Error Handlers

```python
# app.py

@app.errorhandler(404)
def not_found(e):
    return render_template('errors/404.html'), 404

@app.errorhandler(403)
def forbidden(e):
    return render_template('errors/404.html'), 403  # reuse 404 template
```

---

## Step 8 — client_auth Blueprint (if not yet created)

If you don't have a separate `client_auth` blueprint, create one:

```python
# routes/client_auth.py

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user

client_auth_bp = Blueprint('client_auth', __name__, url_prefix='/portal')

@client_auth_bp.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        # your login logic using User.role == 'client'
        pass
    return render_template('client/login.html')

@client_auth_bp.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        pass
    return render_template('client/register.html')  # (create this if needed)

@client_auth_bp.route('/forgot-password')
def forgot_password():
    return render_template('client/forgot_password.html')  # create if needed
```

Register it in `app.py`:
```python
from routes.client_auth import client_auth_bp
app.register_blueprint(client_auth_bp)
```

---

## Design System Quick Reference

### Color Tokens (CSS variables)
```
--brand         Gold accent (#D4A843)
--admin-sidebar Deep navy (#0F172A)
--admin-canvas  Light grey page bg (#F8FAFC)
--client-canvas Warm off-white (#FAFAF9)
```

### Status Badge Classes
Apply to any `<span class="status-badge ___">`:
```
planning | production | ready | event_day | done | cancelled
```

### Button Variants
```html
<!-- Admin buttons -->
<button class="btn-me btn-gold">Primary Gold</button>
<button class="btn-me btn-outline-me">Secondary</button>
<button class="btn-me btn-danger-me">Danger</button>
<button class="btn-me btn-sm-me btn-gold">Small Gold</button>
<button class="btn-icon">Icon Only</button>

<!-- Client portal buttons -->
<a class="btn-client btn-client-gold">Portal Gold</a>
<a class="btn-client btn-client-outline">Portal Outline</a>
```

### Modals
```html
<!-- Trigger -->
<button data-modal-open="myModal">Open Modal</button>

<!-- Modal HTML -->
<div class="me-modal-overlay" id="myModal">
  <div class="me-modal">
    <div class="me-modal-header">
      <h4>Modal Title</h4>
      <button class="me-modal-close" data-modal-close>
        <svg><!-- X icon --></svg>
      </button>
    </div>
    <div class="me-modal-body">
      <!-- content -->
    </div>
    <div class="me-modal-footer">
      <button data-modal-close class="btn-me btn-outline-me">Cancel</button>
      <button class="btn-me btn-gold">Confirm</button>
    </div>
  </div>
</div>
```

### KPI Cards
```html
<div class="kpi-card gold">   <!-- gold | blue | green | red -->
  <div class="kpi-icon gold"><!-- SVG icon --></div>
  <div>
    <div class="kpi-value">42</div>
    <div class="kpi-label">Label</div>
    <div class="kpi-delta up">Trend text</div>  <!-- up | down -->
  </div>
</div>
```

---

## Fonts Used (loaded via Google Fonts)

| Font                | Used in                  |
|---------------------|--------------------------|
| Sora                | Admin UI, headings       |
| Cormorant Garamond  | Client portal, landing   |
| DM Sans             | Client portal body text  |
| JetBrains Mono      | IDs, code, values        |

All fonts are loaded via CDN in `base.html` and `base_client.html`.
No local font files are needed.

---

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
Mobile: iOS Safari 14+, Chrome Android 90+
