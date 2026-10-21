/* DocuFlow — routing, views and interaction. */
(function () {
  'use strict';

  const D = window.DocuFlowData;
  const OCR = window.DocuFlowOCR;
  const S = window.DocuFlowStore;

  const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/></svg>',
    workers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="3.2"/><path d="M22 20v-1.4a3.6 3.6 0 0 0-2.8-3.5"/><path d="M15.6 4.1a3.2 3.2 0 0 1 0 6.1"/></svg>',
    documents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.5h7.5A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8.5a6 6 0 0 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3h8l4 4v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"/><path d="M15 3v5h5"/></svg>',
    id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.6 3.6 0 0 1 6.4 0M15 10h3M15 13.5h3"/></svg>'
  };

  const FIELDS = [
    { key: 'firstName', label: 'First name', placeholder: 'First name' },
    { key: 'surname', label: 'Surname', placeholder: 'Surname' },
    { key: 'dob', label: 'Date of birth', type: 'date' },
    { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Ukrainian' },
    { key: 'passportNo', label: 'Passport number', placeholder: '9 characters' },
    { key: 'passportExpiry', label: 'Passport expiry', type: 'date' },
    { key: 'pesel', label: 'PESEL', placeholder: '11 digits', inputmode: 'numeric', maxlength: 11 },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
    { key: 'fatherName', label: "Father's name", placeholder: 'Optional' },
    { key: 'motherName', label: "Mother's name", placeholder: 'Optional' },
    { key: 'forkliftLicenceNo', label: 'Forklift licence no.', placeholder: 'UDT/YYYY/NNNNN' },
    { key: 'licenceExpiry', label: 'Licence expiry', type: 'date' },
    { key: 'residenceCardExpiry', label: 'Residence card expiry', type: 'date' }
  ];

  const ALERT_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'passport', label: 'Passport' },
    { key: 'visa', label: 'Visa or residence card' },
    { key: 'forklift', label: 'Forklift licence' }
  ];

  function blankFields() {
    const out = {};
    FIELDS.forEach((f) => { out[f.key] = ''; });
    return out;
  }

  function freshFlow() {
    return {
      busy: false,
      progress: 0,
      statusLabel: '',
      preview: '',
      detection: '',
      fileName: '',
      files: [],
      fields: blankFields(),
      auto: {},
      result: null,
      error: '',
      step: 1,
      uploads: [],
      match: null,
      dirty: false,
      draftSaved: false
    };
  }

  const state = {
    workers: D.loadWorkers(),
    workersQuery: '',
    workersStatus: 'All',
    workersSort: { key: 'name', dir: 1 },
    alertFilter: 'all',
    editing: false,
    workerDraft: null,
    docStatus: 'All',
    docType: 'all',
    docQuery: '',
    zoom: 100,
    flow: freshFlow(),
    route: null
  };

  const view = document.getElementById('view');
  const toasts = document.getElementById('toasts');

  /* --------------------------------------------------------------- helpers */

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(name, cls) {
    return '<span class="icon ' + (cls || '') + '">' + (ICONS[name] || '') + '</span>';
  }

  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function currentRoute() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw || raw === '/') return { name: 'dashboard' };
    const parts = raw.split('/').filter(Boolean);
    if (parts[0] === 'workers' && parts[1]) return { name: 'worker', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'documents' && parts[1]) return { name: 'doc', id: decodeURIComponent(parts[1]) };
    if (parts[0] === 'me') return { name: 'me', sub: ['details','documents','notifications'].indexOf(parts[1]) >= 0 ? parts[1] : 'home' };
    if (['dashboard', 'workers', 'new', 'alerts', 'documents', 'reports', 'settings'].indexOf(parts[0]) >= 0) {
      return { name: parts[0] };
    }
    return { name: 'notfound' };
  }

  function toast(message, tone) {
    if (!toasts) return;
    const el = document.createElement('div');
    el.className = 'toast' + (tone ? ' toast-' + tone : '');
    el.innerHTML = '<span class="toast-mark">' + (tone === 'error' ? '!' : '✓') + '</span><span>' + esc(message) + '</span>';
    toasts.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    setTimeout(function () {
      el.classList.remove('is-in');
      setTimeout(function () { el.remove(); }, 180);
    }, 3400);
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    const button = document.querySelector('[data-action="toggle-nav"]');
    if (button) button.setAttribute('aria-expanded', 'false');
  }

  function matchesQuery(worker, query) {
    if (!query) return true;
    const haystack = [
      D.fullName(worker),
      worker.firstName,
      worker.surname,
      worker.pesel,
      worker.passportNo,
      worker.forkliftLicenceNo,
      worker.email,
      worker.nationality
    ].join(' ').toLowerCase();
    return haystack.indexOf(query.trim().toLowerCase()) >= 0;
  }

  function filteredWorkers() {
    let list = state.workers.filter(function (w) { return matchesQuery(w, state.workersQuery); });
    if (state.workersStatus !== 'All') {
      list = list.filter(function (w) { return w.status === state.workersStatus; });
    }
    const key = state.workersSort.key;
    const dir = state.workersSort.dir;
    return list.slice().sort(function (a, b) {
      let av = '';
      let bv = '';
      if (key === 'name') { av = D.fullName(a).toLowerCase(); bv = D.fullName(b).toLowerCase(); }
      else if (key === 'passport') { av = a.passportNo || ''; bv = b.passportNo || ''; }
      else if (key === 'licence') { av = a.forkliftLicenceNo || ''; bv = b.forkliftLicenceNo || ''; }
      else if (key === 'status') { av = a.status || ''; bv = b.status || ''; }
      return av.localeCompare(bv) * dir;
    });
  }

  function statusPill(status) {
    const cls = status === 'Complete' ? 'complete' : status === 'Expiring' ? 'expiring' : 'review';
    return '<span class="status status-' + cls + '"><span class="status-dot"></span>' + esc(status) + '</span>';
  }

  function toneClass(tone) {
    return 'tone-' + tone;
  }

  function avatar(worker, extra) {
    return '<span class="avatar ' + (extra || '') + '">' + esc(D.initials(worker.firstName, worker.surname)) + '</span>';
  }

  function emptyState(title, text, action, actionLabel) {
    return '<div class="empty">' +
      '<span class="empty-icon">' + ICONS.search + '</span>' +
      '<p class="empty-title">' + esc(title) + '</p>' +
      '<p class="empty-text">' + esc(text) + '</p>' +
      (action ? '<button type="button" class="btn btn-quiet btn-small" data-action="' + action + '">' + esc(actionLabel) + '</button>' : '') +
      '</div>';
  }

  function pageHead(eyebrow, title, lede, actions) {
    return '<header class="page-head">' +
      '<div class="page-head-main">' +
      (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + '</p>' : '') +
      '<h1>' + title + '</h1>' +
      (lede ? '<p class="lede">' + lede + '</p>' : '') +
      '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') +
      '</header>';
  }

  function docLabel(name) {
    if (/passport/i.test(name)) return 'Passport';
    if (/licen[cs]e/i.test(name)) return 'Forklift licence';
    if (/residence|visa/i.test(name)) return 'Visa or residence card';
    return 'Document';
  }

  function peselInfoText(value, dob) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return { state: 'empty', text: '11 digits · checksum checked automatically' };
    if (digits.length !== 11) return { state: 'empty', text: digits.length + ' of 11 digits' };
    const info = D.peselInfo(digits, dob);
    if (info.state === 'valid') return { state: 'valid', text: '✓ Valid checksum' };
    return { state: 'invalid', text: '! ' + info.message };
  }

  /* ------------------------------------------------------------ chrome */

  function updateChrome() {
    const near = D.expiryItems(state.workers).filter(function (i) { return i.days <= 30; });
    const badge = document.getElementById('nav-alert-count');
    if (badge) {
      badge.textContent = near.length ? String(near.length) : '';
      badge.hidden = near.length === 0;
    }
    const docsBadge = document.getElementById('nav-doc-count');
    if (docsBadge) {
      const pending = S.all().filter(function (doc) { return doc.status === 'Awaiting review'; }).length;
      docsBadge.textContent = pending ? String(pending) : '';
      docsBadge.hidden = pending === 0;
    }
  }

  function markNav(route) {
    const active = route.name === 'worker' ? 'workers' : route.name === 'doc' ? 'documents' : route.name === 'me' ? 'me-' + route.sub : route.name;
    document.querySelectorAll('.nav-link[data-route]').forEach(function (a) {
      const on = a.dataset.route === active;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function setTitle(title) {
    document.title = (title ? title + ' · ' : '') + 'DocuFlow';
  }

  /* ----------------------------------------------------------- dashboard */

  function dashboardView() {
    const workers = state.workers;
    const docs = workers.reduce(function (sum, w) { return sum + (w.documents ? w.documents.length : 0); }, 0);
    const minutes = docs * 6;
    const items = D.expiryItems(workers);
    const near = items.filter(function (i) { return i.days <= 30; });
    const breakdown = D.expiryBreakdown(items, 30);
    const recent = workers.slice(0, 6);

    return pageHead(
      'Overview',
      (new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening') + ', Anna',
      'Here is what needs your attention across the agency today.',
      '<a class="btn btn-primary" href="#/new"><span class="plus">+</span> Upload documents</a>'
    ) +
      '<p class="page-date">' + esc(new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())) + '</p>' +
      '<form class="search search-dashboard" data-form="dashboard-search" role="search">' +
        '<span class="search-icon">' + ICONS.search + '</span>' +
        '<input type="search" name="q" value="' + esc(state.workersQuery) + '" placeholder="Search workers by name, PESEL or passport" aria-label="Search workers">' +
        '<button class="btn btn-quiet btn-small search-submit" type="submit">Search</button>' +
      '</form>' +
      '<section class="stats" aria-label="Key figures">' +
        statCard('Active workers', String(workers.length), 'All records in this demo', icon('workers')) +
        statCard('Documents processed', String(docs), 'Across all worker records', icon('docs')) +
        statCard('Hours saved this month', D.formatMinutes(minutes), docs + ' documents × 6 min', icon('clock')) +
        statCard('Expiring in 30 days', String(near.length), breakdown || 'Nothing expiring in the next 30 days', icon('bell'), near.length ? 'attention' : '') +
      '</section>' +
      '<div class="dash-grid">' +
        '<section class="card">' +
          '<div class="card-head">' +
            '<div><h2>Recent workers</h2><p class="card-sub">Latest records in DocuFlow</p></div>' +
            '<a class="text-link" href="#/workers">View all</a>' +
          '</div>' +
          (recent.length ? recentTable(recent) : emptyState('No workers yet', 'Upload a passport to add your first worker.', 'go-new', 'Upload documents')) +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head">' +
            '<div><h2>Expiry alerts</h2><p class="card-sub">Sorted by days remaining</p></div>' +
            '<a class="text-link" href="#/alerts">View all</a>' +
          '</div>' +
          (items.length ? '<ul class="alert-list alert-list-compact">' + items.slice(0, 5).map(alertItem).join('') + '</ul>' : emptyState('Everything is in date', 'No document expiries are recorded yet.', '', '')) +
        '</section>' +
      '</div>';
  }

  function statCard(label, value, sub, iconMarkup, tone) {
    return '<article class="card stat ' + (tone === 'attention' ? 'stat-attention' : '') + '">' +
      '<div class="stat-top"><span class="stat-label">' + esc(label) + '</span><span class="stat-icon">' + iconMarkup + '</span></div>' +
      '<p class="stat-value">' + esc(value) + '</p>' +
      '<p class="stat-sub">' + esc(sub) + '</p>' +
      '</article>';
  }

  function recentTable(list) {
    return '<div class="table-wrap"><table class="table">' +
      '<thead><tr><th>Worker</th><th>Passport</th><th>Forklift licence</th><th>Status</th></tr></thead><tbody>' +
      list.map(function (w) {
        return '<tr data-href="#/workers/' + encodeURIComponent(w.id) + '" tabindex="0">' +
          '<td><div class="person">' + avatar(w) + '<div class="person-text"><span class="person-name">' + esc(D.fullName(w)) + '</span><span class="person-meta">' + esc(w.nationality) + '</span></div></div></td>' +
          '<td><span class="mono">' + esc(w.passportNo || '—') + '</span></td>' +
          '<td><span class="mono">' + esc(w.forkliftLicenceNo || '—') + '</span></td>' +
          '<td>' + statusPill(w.status) + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function alertItem(item) {
    const tone = D.toneForDays(item.days);
    const detail = [item.type, item.number].filter(Boolean).join(' · ');
    return '<li class="alert-item-li">' +
      '<a class="alert-item" href="#/workers/' + encodeURIComponent(item.workerId) + '">' +
        '<span class="alert-dot ' + toneClass(tone) + '"></span>' +
        '<span class="alert-main"><strong>' + esc(D.fullName(item.worker)) + '</strong><span>' + esc(detail) + '</span></span>' +
        '<span class="alert-when"><span class="alert-date">' + esc(D.formatDate(item.date)) + '</span><span class="days-pill ' + toneClass(tone) + '">' + esc(D.humanDays(item.days)) + '</span></span>' +
      '</a></li>';
  }

  /* ------------------------------------------------------------- workers */

  function workersView() {
    const list = filteredWorkers();
    const counts = {
      All: state.workers.length,
      Complete: state.workers.filter(function (w) { return w.status === 'Complete'; }).length,
      Review: state.workers.filter(function (w) { return w.status === 'Review'; }).length,
      Expiring: state.workers.filter(function (w) { return w.status === 'Expiring'; }).length
    };
    const chips = ['All', 'Complete', 'Review', 'Expiring'].map(function (status) {
      return '<button type="button" class="chip-filter' + (state.workersStatus === status ? ' is-active' : '') + '" data-action="filter-workers" data-value="' + status + '" aria-pressed="' + (state.workersStatus === status) + '">' +
        esc(status) + '<span class="chip-count">' + counts[status] + '</span></button>';
    }).join('');

    return pageHead('Records', 'Workers', 'Search by name, PESEL or passport number. Open a record to review its documents.', '<a class="btn btn-primary" href="#/new"><span class="plus">+</span> Upload documents</a>') +
      '<section class="card">' +
        '<div class="table-toolbar">' +
          '<form class="search" data-form="workers-search" role="search">' +
            '<span class="search-icon">' + ICONS.search + '</span>' +
            '<input type="search" data-search="workers" value="' + esc(state.workersQuery) + '" placeholder="Search name, PESEL or passport" aria-label="Search workers">' +
            '<button type="button" class="search-clear" data-action="clear-workers-search" aria-label="Clear search"' + (state.workersQuery ? '' : ' hidden') + '>' + ICONS.close + '</button>' +
          '</form>' +
          '<div class="chips" role="group" aria-label="Filter by status">' + chips + '</div>' +
        '</div>' +
        '<div id="workers-results">' + workersResults(list) + '</div>' +
      '</section>';
  }

  function workersResults(list) {
    if (!list.length) {
      return emptyState('No workers match your search', 'Try another name, PESEL or passport number, or clear the status filter.', 'clear-all-filters', 'Clear filters');
    }
    return '<p class="result-count">' + list.length + ' worker' + (list.length === 1 ? '' : 's') + '</p>' +
      '<div class="table-wrap"><table class="table table-workers">' +
        '<thead><tr>' +
          sortHeader('name', 'Worker') +
          '<th>PESEL</th>' +
          sortHeader('passport', 'Passport') +
          sortHeader('licence', 'Forklift licence') +
          sortHeader('status', 'Status') +
        '</tr></thead><tbody>' +
        list.map(function (w) {
          return '<tr data-href="#/workers/' + encodeURIComponent(w.id) + '" tabindex="0">' +
            '<td><div class="person">' + avatar(w) + '<div class="person-text"><span class="person-name">' + esc(D.fullName(w)) + '</span><span class="person-meta">' + esc(w.nationality) + ' · ' + esc(w.email || 'No email') + '</span></div></div></td>' +
            '<td><span class="mono">' + esc(w.pesel || '—') + '</span></td>' +
            '<td><span class="mono">' + esc(w.passportNo || '—') + '</span></td>' +
            '<td><span class="mono">' + esc(w.forkliftLicenceNo || '—') + '</span></td>' +
            '<td>' + statusPill(w.status) + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table></div>';
  }

  function sortHeader(key, label) {
    const active = state.workersSort.key === key;
    const arrow = active ? (state.workersSort.dir > 0 ? '↑' : '↓') : '↕';
    return '<th><button type="button" class="th-sort' + (active ? ' is-active' : '') + '" data-action="sort-workers" data-key="' + key + '">' + esc(label) + '<span class="sort-arrow">' + arrow + '</span></button></th>';
  }

  /* -------------------------------------------------------- worker detail */

  function workerView(route) {
    const worker = state.workers.find(function (w) { return w.id === route.id; });
    if (!worker) {
      return pageHead('Records', 'Worker not found', 'That record is not in this demo.', '<a class="btn btn-quiet" href="#/workers">Back to workers</a>') +
        '<section class="card">' + emptyState('This worker is not here', 'The record may have been removed, or the link may be incorrect.', 'go-workers', 'Back to workers') + '</section>';
    }
    if (state.editing && (!state.workerDraft || state.workerDraft.id !== worker.id)) {
      state.workerDraft = D.cloneWorker(worker);
    }
    const draft = state.editing ? state.workerDraft : worker;

    const actions = state.editing
      ? '<button type="button" class="btn btn-quiet" data-action="cancel-edit">Cancel</button><button type="button" class="btn btn-primary" data-action="save-worker">Save</button>'
      : '<button type="button" class="btn btn-quiet" data-action="edit-worker">Edit</button>';

    return '<a class="back-link" href="#/workers">' + ICONS.back + ' All workers</a>' +
      '<header class="page-head worker-head">' +
        '<div class="page-head-main worker-title">' +
          '<span class="avatar avatar-lg">' + esc(D.initials(worker.firstName, worker.surname)) + '</span>' +
          '<div><div class="worker-name-row"><h1>' + esc(D.fullName(worker)) + '</h1>' + statusPill(worker.status) + '</div>' +
          '<p class="lede">' + esc(worker.nationality) + ' · Passport ' + esc(worker.passportNo || 'not recorded') + ' · ' + (worker.documents ? worker.documents.length : 0) + ' document' + ((worker.documents ? worker.documents.length : 0) === 1 ? '' : 's') + '</p></div>' +
        '</div>' +
        '<div class="page-actions">' + actions + '</div>' +
      '</header>' +
      '<div class="detail-grid">' +
        '<section class="card form-card">' +
          '<div class="card-head"><div><h2>Worker details</h2><p class="card-sub">' + (state.editing ? 'Editing this record' : 'Read-only until you choose Edit') + '</p></div>' + (state.editing ? '<span class="chip chip-blue">Editing</span>' : '') + '</div>' +
          '<div class="form-grid two">' +
            FIELDS.map(function (f) {
              const value = draft[f.key] || '';
              const hint = f.key === 'pesel' ? peselHintMarkup(value, draft.dob) : '';
              const dateText = !state.editing && f.type === 'date';
              return '<div class="field" data-worker-wrap="' + f.key + '">' +
                '<label for="w-' + f.key + '">' + esc(f.label) + '</label>' +
                '<input id="w-' + f.key + '" data-worker-field="' + f.key + '" type="' + (dateText ? 'text' : (f.type || 'text')) + '" value="' + esc(dateText ? (value ? D.formatDate(value) : '') : value) + '"' +
                (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '') +
                (state.editing ? '' : ' disabled') + ' placeholder="Not recorded">' +
                hint +
                '</div>';
            }).join('') +
          '</div>' +
        '</section>' +
        '<div class="detail-side">' +
          documentsCard(worker) +
          expiryCard(worker) +
        '</div>' +
      '</div>';
  }

  function peselHintMarkup(value, dob) {
    const info = peselInfoText(value, dob);
    return '<p class="field-hint' + (info.state === 'valid' ? ' is-valid' : info.state === 'invalid' ? ' is-invalid' : '') + '" data-pesel-hint>' + esc(info.text) + '</p>';
  }

  const REVIEWER = 'Anna Kowalska';

  function docDate(iso) {
    return iso ? D.formatDate(String(iso).slice(0, 10)) : '—';
  }

  function docStatusPill(status) {
    const cls = status === 'Verified' ? 'status-complete' : status === 'Rejected' ? 'status-expiring' : 'status-review';
    return '<span class="status ' + cls + '"><span class="status-dot"></span>' + esc(status) + '</span>';
  }

  function uploaderLabel(doc) {
    return doc.uploadedBy === 'employee' ? 'Employee' : 'Recruiter';
  }

  function documentsCard(worker) {
    const stored = S.forWorker(worker.id);
    const demo = (worker.documents || []).filter(function (name) {
      return !stored.some(function (doc) { return doc.fileName === name; });
    });
    const total = stored.length + demo.length;
    const slots = [];
    stored.forEach(function (doc) {
      const slot = S.slotOf(doc);
      if (slots.indexOf(slot) < 0) slots.push(slot);
    });
    return '<section class="card">' +
      '<div class="card-head"><div><h2>Documents</h2><p class="card-sub">' + total + ' file' + (total === 1 ? '' : 's') + ' on record</p></div></div>' +
      (total
        ? '<ul class="doc-list">' +
          stored.filter(function (doc) { return doc.status === 'Awaiting review'; }).map(function (doc) {
            return '<li class="doc-item">' +
              '<span class="doc-icon">' + ICONS.file + '</span>' +
              '<span class="doc-text"><span class="doc-name">' + esc(doc.fileName) + '</span><span class="doc-meta">' + esc(doc.type) + ' · ' + esc(docDate(doc.uploadedAt)) + '</span></span>' +
              docStatusPill(doc.status) +
              '<a class="btn btn-quiet btn-small" href="#/documents/' + encodeURIComponent(doc.id) + '">View</a>' +
              '</li>';
          }).join('') +
          slots.map(function (slot) {
            const hist = S.history(worker.id, slot);
            const html = S.historyHtml(worker.id, slot, { review: true });
            if (!html) return '';
            return '<li class="hist-group"><p class="hist-title">' + esc(hist[0].type) + ' · History</p>' + html + '</li>';
          }).join('') +
          demo.map(function (name) {
            return '<li class="doc-item">' +
              '<span class="doc-icon">' + ICONS.file + '</span>' +
              '<span class="doc-text"><span class="doc-name">' + esc(name) + '</span><span class="doc-meta">' + esc(docLabel(name)) + '</span></span>' +
              '<span class="chip chip-neutral chip-tiny">Demo file</span>' +
              '</li>';
          }).join('') +
          '</ul>'
        : '<div class="empty empty-small"><p class="empty-title">No documents yet</p><p class="empty-text">Upload a passport or licence to add files.</p></div>') +
      '</section>';
  }

  /* ---------------------------------------------------- documents library */

  const DOC_STATUSES = ['All', 'Awaiting review', 'Verified', 'Rejected'];

  function filteredDocs(list) {
    const query = state.docQuery.trim().toLowerCase();
    return list.filter(function (doc) {
      if (state.docStatus !== 'All' && doc.status !== state.docStatus) return false;
      if (state.docType !== 'all' && doc.kind !== state.docType) return false;
      if (!query) return true;
      const worker = state.workers.find(function (w) { return w.id === doc.workerId; });
      return !!worker && D.fullName(worker).toLowerCase().indexOf(query) >= 0;
    });
  }

  function libraryView() {
    const all = S.all();
    const counts = {};
    DOC_STATUSES.forEach(function (status) {
      counts[status] = status === 'All' ? all.length : all.filter(function (doc) { return doc.status === status; }).length;
    });
    const chips = DOC_STATUSES.map(function (status) {
      return '<button type="button" class="chip-filter' + (state.docStatus === status ? ' is-active' : '') + '" data-action="doc-status" data-value="' + esc(status) + '" aria-pressed="' + (state.docStatus === status) + '">' +
        esc(status) + '<span class="chip-count">' + counts[status] + '</span></button>';
    }).join('');
    const types = Object.keys(S.TYPES).map(function (kind) {
      return '<option value="' + esc(kind) + '"' + (state.docType === kind ? ' selected' : '') + '>' + esc(S.TYPES[kind]) + '</option>';
    }).join('');

    return pageHead('Records', 'Documents', 'Every document uploaded by workers and recruiters. Open one to check it against the worker’s record.') +
      '<section class="card">' +
        '<div class="table-toolbar">' +
          '<div class="search"><span class="search-icon">' + ICONS.search + '</span>' +
            '<input type="search" data-search="docs" value="' + esc(state.docQuery) + '" placeholder="Search by worker name" aria-label="Search by worker name">' +
          '</div>' +
          '<select class="doc-type-select" data-filter="doc-type" aria-label="Filter by document type"><option value="all">All types</option>' + types + '</select>' +
          '<div class="chips" role="group" aria-label="Filter by status">' + chips + '</div>' +
        '</div>' +
        '<div id="docs-results">' + docsResults(filteredDocs(all)) + '</div>' +
      '</section>';
  }

  function docsResults(list) {
    if (!S.all().length) {
      return emptyState('No documents yet', 'Documents appear here when a worker or recruiter uploads one.', '', '');
    }
    if (!list.length) {
      return emptyState('No documents match these filters', 'Try another type or status, or search for a different worker.', '', '');
    }
    return '<p class="result-count">' + list.length + ' document' + (list.length === 1 ? '' : 's') + '</p>' +
      '<div class="table-wrap"><table class="table table-docs">' +
        '<thead><tr><th>Document</th><th>Worker</th><th>Uploaded</th><th>Status</th></tr></thead><tbody>' +
        list.map(function (doc) {
          const worker = state.workers.find(function (w) { return w.id === doc.workerId; });
          const src = S.url(doc);
          const who = uploaderLabel(doc);
          return '<tr data-href="#/documents/' + encodeURIComponent(doc.id) + '" tabindex="0">' +
            '<td><div class="person">' +
              (src ? '<img class="doc-thumb" src="' + src + '" alt="">' : '') +
              '<div class="person-text"><span class="person-name">' + esc(doc.type) + '</span><span class="person-meta">Worker · ' + esc(who) + ' · ' + esc(docDate(doc.uploadedAt)) + '</span></div>' +
            '</div></td>' +
            '<td>' + (worker ? '<div class="person">' + avatar(worker) + '<div class="person-text"><span class="person-name">' + esc(D.fullName(worker)) + '</span><span class="person-meta">' + esc(worker.nationality) + '</span></div></div>' : '—') + '</td>' +
            '<td>' + esc(who) + ' · ' + esc(docDate(doc.uploadedAt)) + '</td>' +
            '<td>' + docStatusPill(doc.status) + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table></div>';
  }

  function reviewView(route) {
    const doc = S.get(route.id);
    if (!doc) {
      return '<a class="back-link" href="#/documents">' + ICONS.back + ' All documents</a>' +
        pageHead('Records', 'Document not found', 'That document is not in this browser’s store.', '<a class="btn btn-quiet" href="#/documents">Back to documents</a>') +
        '<section class="card">' + emptyState('This document is not here', 'It may have been cleared with the demo data.', '', '') + '</section>';
    }
    const worker = state.workers.find(function (w) { return w.id === doc.workerId; });
    const src = S.url(doc);
    const original = S.url(doc, 'original');
    const who = doc.uploadedBy === 'employee' ? 'the employee' : 'a recruiter';
    const pending = doc.status === 'Awaiting review';
    const rows = pending ? reviewRows(doc, worker) : readOnlyRows(doc);
    const currentVersion = pending ? null : S.current(doc.workerId, S.slotOf(doc));

    return '<a class="back-link" href="#/documents">' + ICONS.back + ' All documents</a>' +
      pageHead(pending ? 'Document review' : 'Document record', esc(doc.type) + ' · ' + esc(worker ? D.fullName(worker) : 'Unknown worker'),
        'Uploaded by ' + who + ' on ' + esc(docDate(doc.uploadedAt)) + ' · ' + esc(doc.fileName),
        docStatusPill(doc.status)) +
      '<div class="review-grid">' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Preview</h2><p class="card-sub">' + esc(doc.fileName) + '</p></div>' +
            '<div class="zoom-controls">' +
              '<button type="button" class="btn btn-quiet btn-small" data-action="zoom" data-value="out" aria-label="Zoom out">−</button>' +
              '<button type="button" class="btn btn-quiet btn-small" data-action="zoom" data-value="fit">Fit</button>' +
              '<button type="button" class="btn btn-quiet btn-small" data-action="zoom" data-value="in" aria-label="Zoom in">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="zoom-frame">' +
            (src ? '<img data-zoom-img src="' + src + '" alt="Preview of ' + esc(doc.fileName) + '" style="width:' + state.zoom + '%">' : '<p class="card-sub">No preview is stored for this file.</p>') +
          '</div>' +
          '<div class="form-actions">' +
            (original ? '<a class="btn btn-quiet btn-small" href="' + original + '" target="_blank" rel="noopener">Open original file</a>' : '') +
            '<button type="button" class="btn btn-quiet btn-small" data-hist-download="' + esc(doc.id) + '">Download</button>' +
          '</div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><div><h2>Read from document</h2><p class="card-sub">' + (pending ? 'Changed values are highlighted' : 'Read-only copy kept for reference') + '</p></div></div>' +
          (doc.warning ? '<div class="notice notice-warn"><strong>Check this</strong><span>' + esc(doc.warning) + '</span></div>' : '') +
          (rows
            ? (pending
              ? '<div class="table-wrap"><table class="table table-review"><thead><tr><th>Field</th><th>On record</th><th>On document</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
              : '<div class="table-wrap"><table class="table table-review table-readonly"><thead><tr><th>Field</th><th>On document</th></tr></thead><tbody>' + rows + '</tbody></table></div>')
            : '<div class="empty empty-small"><p class="empty-title">No fields were read</p><p class="empty-text">Check the preview before you apply it.</p></div>') +
          (pending
            ? '<label class="review-reject">Reason if you reject<textarea id="reject-reason" rows="2"></textarea></label>' +
              '<div class="form-actions">' +
                '<button type="button" class="btn btn-quiet" data-action="reject-doc" data-id="' + esc(doc.id) + '">Reject</button>' +
                '<button type="button" class="btn btn-primary" data-action="verify-doc" data-id="' + esc(doc.id) + '">Verify &amp; apply</button>' +
              '</div>'
            : '<div class="notice ' + (doc.status === 'Rejected' ? 'notice-warn' : 'notice-ok') + '"><strong data-audit>' + esc(S.auditLine(doc)) + '</strong>' +
              (doc.status === 'Verified' ? '<span>' + (currentVersion && currentVersion.id === doc.id ? 'Current version' : 'Older version, kept for reference') + '</span>' : '') +
              (doc.reason ? '<span>Reason: ' + esc(doc.reason) + '</span>' : '') + '</div>') +
        '</section>' +
      '</div>';
  }

  const REVIEW_LABELS = { sex: 'Sex' };
  const REVIEW_DATES = /^(dob|.*Expiry)$/;

  function reviewLabel(key) {
    if (REVIEW_LABELS[key]) return REVIEW_LABELS[key];
    const field = FIELDS.find(function (f) { return f.key === key; });
    if (field) return field.label;
    if (key.indexOf('p:') === 0) {
      const words = key.slice(2).replace(/([A-Z])/g, ' $1').toLowerCase();
      return words.charAt(0).toUpperCase() + words.slice(1);
    }
    return key;
  }

  function reviewRows(doc, worker) {
    const read = doc.fields || {};
    return Object.keys(read).map(function (key) {
      const label = reviewLabel(key);
      const next = String(read[key] === null || read[key] === undefined ? '' : read[key]).trim();
      let current = '';
      if (worker) current = key.indexOf('p:') === 0 ? (worker.profile ? worker.profile[key.slice(2)] : '') : worker[key];
      current = String(current || '').trim();
      const date = REVIEW_DATES.test(key);
      const show = function (value) {
        if (!value) return '—';
        return esc(date ? D.formatDate(value) : value);
      };
      const changed = !!next && next !== current;
      return '<tr' + (changed ? ' class="is-changed"' : '') + '>' +
        '<td>' + esc(label) + '</td>' +
        '<td>' + (changed ? '<span class="old">' + show(current) + '</span> →' : show(current)) + '</td>' +
        '<td>' + (changed ? '<span class="new">' + show(next) + '</span>' : show(next)) + '</td>' +
        '</tr>';
    }).join('');
  }

  function readOnlyRows(doc) {
    const read = doc.fields || {};
    return Object.keys(read).map(function (key) {
      const value = String(read[key] === null || read[key] === undefined ? '' : read[key]).trim();
      if (!value) return '';
      const shown = REVIEW_DATES.test(key) ? D.formatDate(value) : value;
      return '<tr><td>' + esc(reviewLabel(key)) + '</td><td>' + esc(shown) + '</td></tr>';
    }).join('');
  }

  function verifyDocument(id) {
    const doc = S.get(id);
    if (!doc) return;
    const worker = state.workers.find(function (w) { return w.id === doc.workerId; });
    if (!worker) { toast('That worker is no longer in records.', 'error'); return; }
    Object.keys(doc.fields || {}).forEach(function (key) {
      if (key === 'sex') return;
      const value = doc.fields[key];
      if (value === null || value === undefined || String(value).trim() === '') return;
      if (key.indexOf('p:') === 0) {
        worker.profile = worker.profile || {};
        worker.profile[key.slice(2)] = String(value);
      } else {
        worker[key] = String(value);
      }
    });
    worker.documents = worker.documents || [];
    if (doc.fileName && worker.documents.indexOf(doc.fileName) < 0) worker.documents.push(doc.fileName);
    worker.status = D.computeStatus(worker);
    D.saveWorkers(state.workers);
    S.update(id, { status: 'Verified', reason: '', reviewedAt: new Date().toISOString(), reviewedBy: REVIEWER }).then(function () {
      toast('Verified · ' + D.fullName(worker) + '’s record updated');
      render();
    });
  }

  function rejectDocument(id) {
    const reasonEl = document.getElementById('reject-reason');
    const reason = reasonEl ? String(reasonEl.value || '').trim().replace(/\.+$/, '') : '';
    if (!reason) {
      toast('Add a reason so the worker knows what to fix.', 'error');
      if (reasonEl) reasonEl.focus();
      return;
    }
    S.update(id, { status: 'Rejected', reason: reason, reviewedAt: new Date().toISOString(), reviewedBy: REVIEWER }).then(function () {
      toast('Document rejected · the worker will see your reason');
      render();
    });
  }

  function expiryCard(worker) {
    const items = D.expiryItems([worker]);
    return '<section class="card">' +
      '<div class="card-head"><div><h2>Expiry timeline</h2><p class="card-sub">Upcoming document dates</p></div></div>' +
      (items.length
        ? '<ul class="timeline">' + items.map(function (item) {
            const tone = D.toneForDays(item.days);
            const pct = Math.max(3, Math.min(100, Math.round((Math.max(item.days, 0) / 90) * 100)));
            return '<li class="timeline-item">' +
              '<span class="timeline-marker ' + toneClass(tone) + '"></span>' +
              '<div class="timeline-body">' +
                '<div class="timeline-row"><strong>' + esc(item.type) + '</strong><span class="days-pill ' + toneClass(tone) + '">' + esc(D.humanDays(item.days)) + '</span></div>' +
                '<p class="timeline-meta">' + (item.number ? esc(item.number) + ' · ' : '') + esc(D.formatDate(item.date)) + '</p>' +
                '<div class="timeline-track"><span class="timeline-fill ' + toneClass(tone) + '" style="width:' + pct + '%"></span></div>' +
              '</div>' +
              '</li>';
          }).join('') + '</ul>'
        : '<div class="empty empty-small"><p class="empty-title">No expiry dates</p><p class="empty-text">Add passport or licence dates to see the timeline.</p></div>') +
      '</section>';
  }

  /* ------------------------------------------------------------- new flow */

  function newView() {
    const flow = state.flow;
    const step = flow.step;
    const steps = [
      ['Upload', 'Add a document'],
      ['Auto-fill', 'Review what was read'],
      ['Confirm', 'Save the worker']
    ];

    return pageHead('New worker', 'Upload documents', 'Drop a passport, licence or residence card. DocuFlow reads it on this device and pre-fills the record.', '<a class="btn btn-quiet" href="#/workers">Cancel</a>') +
      '<ol class="steps" id="steps">' +
        steps.map(function (s, i) {
          const index = i + 1;
          const stateCls = index < step ? 'is-done' : index === step ? 'is-active' : '';
          return '<li class="step ' + stateCls + '">' +
            '<span class="step-num">' + (index < step ? ICONS.check : index) + '</span>' +
            '<span class="step-text"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></span>' +
            '</li>';
        }).join('') +
      '</ol>' +
      '<div class="new-grid">' +
        '<section class="card upload-card">' +
          '<div class="card-head"><div><h2>Document</h2><p class="card-sub">JPG, PNG or PDF · first page only</p></div><span class="chip chip-neutral">Read locally</span></div>' +
          uploadMarkup() +
          (flow.busy ? progressMarkup(flow) : '') +
          (flow.error ? '<div class="notice notice-error"><strong>Could not read that document</strong><span>' + esc(flow.error) + '</span></div>' : '') +
          (flow.result ? resultMarkup(flow.result) : '') +
          samplesMarkup(flow) +
          '<p class="privacy-note">' + ICONS.check + ' Files are read in this browser tab. Nothing is uploaded or stored until you confirm.</p>' +
        '</section>' +
        '<section class="card form-card">' +
          '<div class="card-head"><div><h2>Worker details</h2><p class="card-sub">Green fields were read automatically. Amber fields need a quick check.</p></div></div>' +
          '<form id="worker-form" class="form-grid two" autocomplete="off" data-form="new-worker">' +
            FIELDS.map(newFieldMarkup).join('') +
          '</form>' +
          matchMarkup() +
          '<div class="form-actions">' +
            '<button type="button" class="btn btn-quiet" data-action="save-draft"' + (flow.busy ? ' disabled' : '') + '>Save draft</button>' +
            '<button type="button" class="btn btn-primary" data-action="confirm-worker"' + (flow.busy ? ' disabled' : '') + '>Confirm &amp; save worker</button>' +
          '</div>' +
          '<p class="form-footnote">' + (flow.draftSaved ? '<span class="draft-flag">Draft kept in this tab</span> · ' : '') + 'Nothing is saved until you confirm.</p>' +
        '</section>' +
      '</div>';
  }

  function changedFields(worker, fields) {
    return FIELDS.filter(function (f) {
      const next = String(fields[f.key] === null || fields[f.key] === undefined ? '' : fields[f.key]).trim();
      if (!next) return false;
      return next !== String(worker[f.key] || '').trim();
    }).map(function (f) {
      return { key: f.key, label: f.label, old: String(worker[f.key] || '').trim(), value: String(fields[f.key]).trim() };
    });
  }

  function fieldValueMarkup(key, value) {
    if (!value) return '—';
    return esc(/^(dob|passportExpiry|licenceExpiry|residenceCardExpiry)$/.test(key) ? D.formatDate(value) : value);
  }

  function matchMarkup() {
    const flow = state.flow;
    if (!flow.match) return '';
    const worker = state.workers.find(function (w) { return w.id === flow.match.id; });
    if (!worker) return '';
    const changes = changedFields(worker, flow.fields);
    const formDob = String(flow.fields.dob || '');
    const dobDiffers = formDob && worker.dob && formDob !== worker.dob;
    return '<div class="notice notice-warn" data-match>' +
      '<strong>' + esc(D.fullName(worker)) + ' is already in records</strong>' +
      '<span>Born ' + fieldValueMarkup('dob', worker.dob) + ' · PESEL ' + esc(worker.pesel || '—') + ' · Passport ' + esc(worker.passportNo || '—') + '</span>' +
      (dobDiffers ? '<span><strong>Date of birth differs:</strong> this document says ' + fieldValueMarkup('dob', formDob) + '. Check it is the same person.</span>' : '') +
      (changes.length
        ? '<ul class="match-changes">' + changes.map(function (change) {
            return '<li><b>' + esc(change.label) + ':</b> <span class="old">' + fieldValueMarkup(change.key, change.old) + '</span> → <span class="new">' + fieldValueMarkup(change.key, change.value) + '</span></li>';
          }).join('') + '</ul>'
        : '') +
      '<div class="match-actions">' +
        (flow.match.hard ? '' : '<button type="button" class="btn btn-quiet btn-small" data-action="create-new">Create new worker</button>') +
        '<button type="button" class="btn btn-primary btn-small" data-action="update-existing">Update existing worker ' + esc(D.fullName(worker)) + '</button>' +
      '</div>' +
      '</div>';
  }

  function newFieldMarkup(f) {
    const flow = state.flow;
    const value = flow.fields[f.key] || '';
    const meta = flow.auto[f.key];
    let cls = '';
    let tag = '';
    if (meta) {
      if (meta.confidence < 80) {
        cls = ' check';
        tag = '<span class="source-tag tag-check">Check · ' + Math.round(meta.confidence) + '%</span>';
      } else {
        cls = ' auto';
        tag = '<span class="source-tag tag-ok">✓ ' + esc(meta.source) + '</span>';
      }
    }
    const hint = f.key === 'pesel' ? peselHintMarkup(value, flow.fields.dob) : '';
    return '<div class="field' + cls + '" data-wrap="' + f.key + '">' +
      '<div class="field-top"><label for="n-' + f.key + '">' + esc(f.label) + '</label>' + tag + '</div>' +
      '<input id="n-' + f.key + '" data-field="' + f.key + '" type="' + (f.type || 'text') + '" value="' + esc(value) + '"' +
      (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + (f.maxlength ? ' maxlength="' + f.maxlength + '"' : '') +
      ' placeholder="' + esc(f.placeholder || 'Not on document') + '">' +
      hint +
      '</div>';
  }

  function uploadMarkup() {
    const flow = state.flow;
    if (flow.preview) {
      return '<div class="preview" id="dropzone">' +
        '<div class="preview-frame"><img src="' + flow.preview + '" alt="Preview of the document being read"></div>' +
        '<div class="preview-meta">' +
          (flow.detection ? '<span class="pill-detect">' + esc(flow.detection) + '</span>' : '<span class="chip chip-neutral">' + (flow.busy ? 'Reading document…' : 'Document loaded') + '</span>') +
          '<button type="button" class="btn btn-quiet btn-small" data-action="choose-file">Replace file</button>' +
        '</div>' +
        '<input type="file" id="file-input" class="sr-only" aria-label="Choose a document file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">' +
        '</div>';
    }
    return '<div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="Upload a document">' +
      '<span class="dropzone-icon">' + ICONS.upload + '</span>' +
      '<p class="dropzone-title">Drop a document here</p>' +
      '<p class="dropzone-text">or <button type="button" class="link-button" data-action="choose-file">browse your files</button></p>' +
      '<p class="dropzone-hint">JPG, PNG or PDF · first page</p>' +
      '<input type="file" id="file-input" class="sr-only" aria-label="Choose a document file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">' +
      '</div>';
  }

  function progressMarkup(flow) {
    const pct = Math.round(Math.max(0, Math.min(1, flow.progress)) * 100);
    return '<div class="progress-block" id="ocr-progress">' +
      '<div class="progress-label"><span class="progress-status" id="ocr-status">' + esc(flow.statusLabel || 'Reading document…') + '</span><span id="ocr-percent">' + pct + '%</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Reading document"><span id="ocr-bar" style="width:' + pct + '%"></span></div>' +
      '</div>';
  }

  function resultMarkup(result) {
    if (result.kind === 'unknown') {
      return '<div class="result-card result-error">' +
        '<span class="result-mark">!</span>' +
        '<div><p class="result-title">No fields were recognised</p><p class="result-sub">Try a sharper image, or use a sample document below.</p></div>' +
        '</div>';
    }
    const checks = result.checksTotal
      ? 'MRZ checks ' + result.checksPassed + ' of ' + result.checksTotal + ' passed · '
      : '';
    return '<div class="result-card">' +
      '<span class="result-mark">✓</span>' +
      '<div class="result-body">' +
        '<p class="result-title">Filled ' + result.filled + ' of ' + result.total + ' fields in ' + result.seconds + ' second' + (result.seconds === 1 ? '' : 's') + '</p>' +
        '<p class="result-sub">' + result.highlighted + ' field' + (result.highlighted === 1 ? '' : 's') + ' highlighted for a quick human check</p>' +
        '<p class="result-note">' + checks + 'Read locally on this device</p>' +
      '</div>' +
      '</div>';
  }

  function samplesMarkup(flow) {
    return '<div class="samples">' +
      '<p class="samples-label">No document handy? Try a built-in sample:</p>' +
      '<div class="samples-row">' +
        '<button type="button" class="btn btn-secondary btn-small" data-action="sample" data-kind="passport"' + (flow.busy ? ' disabled' : '') + '>Try a sample passport</button>' +
        '<button type="button" class="btn btn-quiet btn-small" data-action="sample" data-kind="licence"' + (flow.busy ? ' disabled' : '') + '>Sample licence</button>' +
        '<button type="button" class="btn btn-quiet btn-small" data-action="sample" data-kind="residence"' + (flow.busy ? ' disabled' : '') + '>Sample residence card</button>' +
      '</div>' +
      '</div>';
  }

  function renderResultProgress() {
    if (!state.flow.busy) return;
    const bar = document.getElementById('ocr-bar');
    const pct = document.getElementById('ocr-percent');
    const label = document.getElementById('ocr-status');
    const value = Math.round(Math.max(0, Math.min(1, state.flow.progress)) * 100);
    if (bar) bar.style.width = value + '%';
    if (pct) pct.textContent = value + '%';
    if (label) label.textContent = state.flow.statusLabel;
    const wrap = document.getElementById('ocr-progress');
    if (wrap) wrap.querySelector('.progress').setAttribute('aria-valuenow', String(value));
  }

  /* -------------------------------------------------------------- alerts */

  function alertsView() {
    const all = D.expiryItems(state.workers);
    const filtered = state.alertFilter === 'all' ? all : all.filter(function (i) { return i.short === state.alertFilter; });
    const near = all.filter(function (i) { return i.days <= 30; });
    const counts = {
      all: all.length,
      passport: all.filter(function (i) { return i.short === 'passport'; }).length,
      visa: all.filter(function (i) { return i.short === 'visa'; }).length,
      forklift: all.filter(function (i) { return i.short === 'forklift'; }).length
    };
    const chips = ALERT_FILTERS.map(function (f) {
      return '<button type="button" class="chip-filter' + (state.alertFilter === f.key ? ' is-active' : '') + '" data-action="filter-alerts" data-value="' + f.key + '" aria-pressed="' + (state.alertFilter === f.key) + '">' +
        esc(f.label) + '<span class="chip-count">' + counts[f.key] + '</span></button>';
    }).join('');

    return pageHead('Compliance', 'Expiry alerts', 'Every recorded document date, soonest first. ' + near.length + ' items need attention in the next 30 days.', '<a class="btn btn-primary" href="#/new"><span class="plus">+</span> Upload documents</a>') +
      '<section class="card">' +
        '<div class="table-toolbar"><div class="chips" role="group" aria-label="Filter alerts">' + chips + '</div></div>' +
        (filtered.length
          ? '<ul class="alert-list">' + filtered.map(alertItem).join('') + '</ul>'
          : '<div class="empty"><span class="empty-icon">' + ICONS.check + '</span><p class="empty-title">No alerts in this category</p><p class="empty-text">Nothing recorded here is expiring. Try another filter.</p></div>') +
      '</section>' +
      '<p class="legend"><span class="alert-dot tone-red"></span> Under 14 days <span class="alert-dot tone-amber"></span> Under 30 days <span class="alert-dot tone-green"></span> More than 30 days</p>';
  }

  /* -------------------------------------------------------- simple pages */

  function placeholderView(page, title, copy) {
    return pageHead('Demo', title, copy, '<a class="btn btn-quiet" href="#/workers">Back to workers</a>') +
      '<section class="card placeholder-card">' +
        '<span class="placeholder-icon">' + (page === 'settings' ? ICONS.settings : page === 'reports' ? ICONS.reports : ICONS.documents) + '</span>' +
        '<h2>' + esc(title) + ' is outside this demo</h2>' +
        '<p>DocuFlow here focuses on worker records, document auto-fill and expiry alerts. The sidebar keeps the full product shape so the workflow is easy to picture.</p>' +
        (page === 'settings'
          ? '<div class="placeholder-actions"><button type="button" class="btn btn-quiet" data-action="reset-demo">Reset demo data</button></div><p class="form-footnote">Restores the 12 fictional workers and clears this browser’s demo storage.</p>'
          : '<a class="text-link" href="#/workers">Review worker records →</a>') +
      '</section>';
  }

  function notFoundView() {
    return pageHead('404', 'Page not found', 'That route does not exist in this demo.', '<a class="btn btn-primary" href="#/dashboard">Back to dashboard</a>') +
      '<section class="card">' + emptyState('Nothing at this address', 'Use the sidebar, or return to the dashboard to keep exploring.', 'go-dashboard', 'Go to dashboard') + '</section>';
  }

  /* --------------------------------------------------------------- render */

  function render() {
    const route = currentRoute();
    const previous = state.route;
    state.route = route;

    if (route.name !== 'worker') {
      state.editing = false;
      state.workerDraft = null;
    } else if (!previous || previous.name !== 'worker' || previous.id !== route.id) {
      state.editing = false;
      state.workerDraft = null;
    }

    let html = '';
    if (route.name === 'dashboard') html = dashboardView();
    else if (route.name === 'workers') html = workersView();
    else if (route.name === 'worker') html = workerView(route);
    else if (route.name === 'new') html = newView();
    else if (route.name === 'alerts') html = alertsView();
    else if (route.name === 'documents') html = libraryView();
    else if (route.name === 'doc') html = reviewView(route);
    else if (route.name === 'reports') html = window.DocuFlowReports.render({ workers: state.workers, pageHead: pageHead, rerender: render });
    else if (route.name === 'settings') html = placeholderView('settings', 'Settings', 'Workspace preferences and team permissions.');
    else if (route.name === 'me') html = window.DocuFlowEmployee.render(route.sub, { workers: state.workers, toast: toast });
    else html = notFoundView();

    document.body.classList.toggle('is-employee', route.name === 'me');
    view.innerHTML = html;
    markNav(route);
    updateChrome();
    closeNav();
    wirePage();
    setTitle({
      dashboard: 'Dashboard',
      workers: 'Workers',
      worker: 'Worker record',
      new: 'Upload documents',
      alerts: 'Expiry alerts',
      documents: 'Documents',
      doc: 'Document review',
      reports: 'Reports',
      settings: 'Settings',
      me: 'My account'
    }[route.name] || 'Page not found');
    window.scrollTo(0, 0);
  }

  function wirePage() {
    if (state.route.name !== 'new') return;
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) startUpload(fileInput.files[0]);
      });
    }
    if (!dropzone) return;
    dropzone.addEventListener('click', function (event) {
      if (event.target.closest('button[data-action="choose-file"]')) return;
      if (fileInput && !state.flow.busy) fileInput.click();
    });
    dropzone.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (fileInput && !state.flow.busy) fileInput.click();
      }
    });
    ['dragenter', 'dragover'].forEach(function (type) {
      dropzone.addEventListener(type, function (event) {
        event.preventDefault();
        if (!state.flow.busy) dropzone.classList.add('is-over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (type) {
      dropzone.addEventListener(type, function () { dropzone.classList.remove('is-over'); });
    });
    dropzone.addEventListener('drop', function (event) {
      event.preventDefault();
      dropzone.classList.remove('is-over');
      if (state.flow.busy) return;
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) startUpload(file);
    });
  }

  /* ----------------------------------------------------------- OCR wiring */

  function beginDocument() {
    const flow = state.flow;
    flow.busy = true;
    flow.progress = 0.03;
    flow.statusLabel = 'Opening document…';
    flow.error = '';
    flow.detection = '';
    flow.preview = '';
    flow.result = null;
    flow.auto = {};
    flow.dirty = false;
    flow.step = 2;
    flow.draftSaved = false;
    render();
  }

  function startUpload(file) {
    if (state.flow.busy) return;
    beginDocument();
    state.flow.fileName = file.name || 'document';
    const started = performance.now();
    OCR.readDocument(file, {
      onPreview: function (preview) {
        state.flow.preview = preview;
        render();
      },
      onStatus: function (status) {
        state.flow.progress = status.progress;
        state.flow.statusLabel = status.label;
        renderResultProgress();
      }
    }).then(function (parsed) {
      parsed.file = file;
      finishDocument(parsed, started);
    }).catch(function (err) {
      failDocument(err);
    });
  }

  function startSample(kind) {
    if (state.flow.busy) return;
    beginDocument();
    const started = performance.now();
    OCR.runSample(kind, {
      onPreview: function (preview) {
        state.flow.preview = preview;
        render();
      },
      onStatus: function (status) {
        state.flow.progress = status.progress;
        state.flow.statusLabel = status.label;
        renderResultProgress();
      }
    }).then(function (parsed) {
      finishDocument(parsed, started);
    }).catch(function (err) {
      failDocument(err);
    });
  }

  function finishDocument(parsed, started) {
    const flow = state.flow;
    flow.busy = false;
    flow.progress = 1;
    flow.statusLabel = 'Document read';
    flow.preview = parsed.preview || flow.preview;
    flow.detection = parsed.typeLabel || '';
    flow.error = '';
    flow.step = 2;
    flow.dirty = false;
    flow.uploads = [];

    const incoming = parsed.fields && parsed.fields.surname && parsed.fields.surname.value;
    const current = String(flow.fields.surname || '').trim();
    if (incoming && current && incoming.toLowerCase() !== current.toLowerCase()) {
      flow.fields = blankFields(); flow.auto = {}; flow.files = [];
      toast('Different person detected. Form cleared for this document.');
    }

    FIELDS.forEach(function (f) {
      const read = parsed.fields && parsed.fields[f.key];
      if (read && read.value) {
        flow.fields[f.key] = read.value;
        flow.auto[f.key] = {
          confidence: read.confidence,
          source: read.source,
          note: read.note || ''
        };
      }
    });

    if (parsed.fileName) { flow.fileName = parsed.fileName; if (flow.files.indexOf(parsed.fileName) < 0) flow.files.push(parsed.fileName); }

    const snap = {};
    Object.keys(parsed.fields || {}).forEach(function (key) {
      const field = parsed.fields[key];
      if (field && field.value !== null && field.value !== undefined && String(field.value).trim()) snap[key] = field.value;
    });
    if (parsed.kind && parsed.kind !== 'unknown') {
      flow.uploads.push({
        file: parsed.file || null,
        preview: parsed.preview || '',
        kind: parsed.kind,
        fileName: parsed.fileName || 'document',
        fields: snap
      });
    }
    flow.match = null;

    const filled = FIELDS.filter(function (f) { return String(flow.fields[f.key] || '').trim(); }).length;
    const highlighted = FIELDS.filter(function (f) {
      return flow.auto[f.key] && flow.auto[f.key].confidence < 80;
    }).length;

    flow.result = {
      kind: parsed.kind,
      filled: filled,
      total: FIELDS.length,
      seconds: Math.max(1, Math.round((performance.now() - started) / 1000)),
      highlighted: highlighted,
      checksPassed: parsed.checksPassed,
      checksTotal: parsed.checksTotal
    };

    render();
    if (parsed.kind === 'passport' && parsed.checksTotal) {
      toast('Passport read · ' + parsed.checksPassed + ' of ' + parsed.checksTotal + ' MRZ checks passed', parsed.checksPassed === parsed.checksTotal ? 'success' : 'error');
    }
  }

  function failDocument(err) {
    const flow = state.flow;
    flow.busy = false;
    flow.result = null;
    flow.error = (err && err.message) ? err.message : 'Something went wrong while reading that document.';
    flow.step = 2;
    render();
  }

  /* ------------------------------------------------------------ form state */

  function updateStepBar() {
    const list = document.getElementById('steps');
    if (!list) return;
    Array.prototype.forEach.call(list.children, function (li, index) {
      const step = index + 1;
      li.classList.toggle('is-active', step === state.flow.step);
      li.classList.toggle('is-done', step < state.flow.step);
      const num = li.querySelector('.step-num');
      if (num) {
        if (step < state.flow.step) num.innerHTML = ICONS.check;
        else num.textContent = String(step);
      }
    });
  }

  function updatePeselHintFor(input, dob) {
    const wrap = input.closest('.field');
    if (!wrap) return;
    const hint = wrap.querySelector('[data-pesel-hint]');
    if (!hint) return;
    const info = peselInfoText(input.value, dob);
    hint.textContent = info.text;
    hint.className = 'field-hint' + (info.state === 'valid' ? ' is-valid' : info.state === 'invalid' ? ' is-invalid' : '');
  }

  function saveDraft() {
    const flow = state.flow;
    const hasAnything = flow.preview || FIELDS.some(function (f) { return String(flow.fields[f.key] || '').trim(); });
    if (!hasAnything) {
      toast('Add a document or some details before saving a draft.', 'error');
      return;
    }
    flow.draftSaved = true;
    render();
    toast('Draft kept in this tab. Nothing is stored until you confirm.');
  }

  function confirmNewWorker() {
    const flow = state.flow;
    if (!String(flow.fields.firstName || '').trim() || !String(flow.fields.surname || '').trim()) {
      toast('Add a first name and surname before saving.', 'error');
      const target = document.querySelector('[data-field="' + (!flow.fields.firstName ? 'firstName' : 'surname') + '"]');
      if (target) target.focus();
      return;
    }
    const pesel = String(flow.fields.pesel || '').trim();
    if (flow.fields.pesel && flow.auto.pesel && !D.peselInfo(pesel, '').checksumValid) {
      toast('The PESEL read from the document fails its check digit. Correct it or clear the field before saving.', 'error');
      const target = document.querySelector('[data-field="pesel"]');
      if (target) target.focus();
      return;
    }
    const pNo = String(flow.fields.passportNo || '').trim();
    const first = String(flow.fields.firstName || '').trim().toLowerCase();
    const last = String(flow.fields.surname || '').trim().toLowerCase();
    const hard = state.workers.find(function (w) { return (pNo && w.passportNo === pNo) || (pesel && w.pesel === pesel); });
    const soft = state.workers.find(function (w) {
      return String(w.firstName || '').trim().toLowerCase() === first && String(w.surname || '').trim().toLowerCase() === last;
    });
    const match = hard || soft;
    if (match) {
      flow.match = { id: match.id, hard: !!hard };
      render();
      const panel = document.querySelector('[data-match]');
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    createNewWorker();
  }

  function createNewWorker() {
    const flow = state.flow;
    const worker = D.createWorker(flow.fields);
    worker.documents = flow.files.slice();
    worker.status = D.computeStatus(worker);
    state.workers.unshift(worker);
    D.saveWorkers(state.workers);
    const done = storeUploads(worker);
    state.flow = freshFlow();
    state.workersQuery = '';
    state.workersStatus = 'All';
    toast('Worker saved to records');
    done.then(function () {
      navigate('#/workers/' + encodeURIComponent(worker.id));
      render();
    });
  }

  function updateExistingWorker() {
    const flow = state.flow;
    if (!flow.match) return;
    const index = state.workers.findIndex(function (w) { return w.id === flow.match.id; });
    if (index < 0) return;
    const worker = state.workers[index];
    const oldPesel = String(worker.pesel || '');
    const changes = changedFields(worker, flow.fields);
    changes.forEach(function (change) { worker[change.key] = change.value; });
    worker.documents = worker.documents || [];
    flow.files.forEach(function (name) { if (worker.documents.indexOf(name) < 0) worker.documents.push(name); });
    worker.status = D.computeStatus(worker);
    D.saveWorkers(state.workers);
    const done = storeUploads(worker);
    const name = D.fullName(worker);
    const newPesel = String(worker.pesel || '');
    state.flow = freshFlow();
    state.workersQuery = '';
    state.workersStatus = 'All';
    done.then(function () {
      if (newPesel && newPesel !== oldPesel) toast(name + ' updated · PESEL ' + oldPesel + ' → ' + newPesel);
      else toast(name + ' updated · ' + changes.length + ' field' + (changes.length === 1 ? '' : 's') + ' changed');
      navigate('#/workers/' + encodeURIComponent(worker.id));
      render();
    });
  }

  function storeUploads(worker) {
    const uploads = state.flow.uploads.slice();
    return Promise.all(uploads.map(function (upload) {
      return S.add({
        workerId: worker.id,
        kind: upload.kind,
        fileName: upload.fileName,
        uploadedBy: 'recruiter',
        fields: upload.fields,
        status: 'Verified',
        reviewedAt: new Date().toISOString(),
        reviewedBy: REVIEWER
      }, upload.file, upload.preview);
    }));
  }

  function saveWorkerEdit() {
    const route = currentRoute();
    const draft = state.workerDraft;
    if (!draft) return;
    if (!String(draft.firstName || '').trim() || !String(draft.surname || '').trim()) {
      toast('First name and surname are required.', 'error');
      return;
    }
    draft.status = D.computeStatus(draft);
    const index = state.workers.findIndex(function (w) { return w.id === route.id; });
    if (index < 0) return;
    state.workers[index] = draft;
    D.saveWorkers(state.workers);
    state.editing = false;
    state.workerDraft = null;
    toast('Worker record saved');
    render();
  }

  /* --------------------------------------------------------------- events */

  document.addEventListener('click', function (event) {
    const actionEl = event.target.closest('[data-action]');
    const menuButton = event.target.closest('[data-action="toggle-nav"]');

    if (event.target.closest('.nav-scrim')) closeNav();
    if (event.target.closest('.nav-link:not(.is-disabled)')) closeNav();
    if (menuButton) {
      const open = document.body.classList.toggle('nav-open');
      menuButton.setAttribute('aria-expanded', String(open));
      return;
    }
    if (!actionEl) {
      const row = event.target.closest('tr[data-href]');
      if (row) navigate(row.dataset.href);
      return;
    }

    const action = actionEl.dataset.action;
    if (action === 'filter-workers') {
      state.workersStatus = actionEl.dataset.value;
      render();
    } else if (action === 'sort-workers') {
      const key = actionEl.dataset.key;
      if (state.workersSort.key === key) state.workersSort.dir *= -1;
      else state.workersSort = { key: key, dir: 1 };
      render();
    } else if (action === 'clear-workers-search') {
      state.workersQuery = '';
      render();
    } else if (action === 'clear-all-filters') {
      state.workersQuery = '';
      state.workersStatus = 'All';
      render();
    } else if (action === 'filter-alerts') {
      state.alertFilter = actionEl.dataset.value;
      render();
    } else if (action === 'edit-worker') {
      const route = currentRoute();
      const worker = state.workers.find(function (w) { return w.id === route.id; });
      if (worker) {
        state.workerDraft = D.cloneWorker(worker);
        state.editing = true;
        render();
      }
    } else if (action === 'cancel-edit') {
      state.editing = false;
      state.workerDraft = null;
      render();
    } else if (action === 'save-worker') {
      saveWorkerEdit();
    } else if (action === 'choose-file') {
      const input = document.getElementById('file-input');
      if (input && !state.flow.busy) input.click();
    } else if (action === 'sample') {
      startSample(actionEl.dataset.kind || 'passport');
    } else if (action === 'save-draft') {
      saveDraft();
    } else if (action === 'confirm-worker') {
      confirmNewWorker();
    } else if (action === 'update-existing') {
      updateExistingWorker();
    } else if (action === 'create-new') {
      createNewWorker();
    } else if (action === 'doc-status') {
      state.docStatus = actionEl.dataset.value;
      render();
    } else if (action === 'zoom') {
      const value = actionEl.dataset.value;
      if (value === 'fit') state.zoom = 100;
      else state.zoom = Math.max(50, Math.min(300, state.zoom + (value === 'in' ? 25 : -25)));
      const img = document.querySelector('[data-zoom-img]');
      if (img) img.style.width = state.zoom + '%';
    } else if (action === 'verify-doc') {
      verifyDocument(actionEl.dataset.id);
    } else if (action === 'reject-doc') {
      rejectDocument(actionEl.dataset.id);
    } else if (action === 'go-new') {
      navigate('#/new');
    } else if (action === 'go-workers') {
      navigate('#/workers');
    } else if (action === 'go-dashboard') {
      navigate('#/dashboard');
    } else if (action === 'reset-demo') {
      if (window.confirm('Reset the demo? The 12 fictional workers will be restored and any added records removed.')) {
        try { localStorage.removeItem(D.STORE_KEY); } catch (err) { /* ignore */ }
        S.clear();
        state.workers = D.loadWorkers();
        state.flow = freshFlow();
        state.editing = false;
        state.workerDraft = null;
        toast('Demo data restored');
        navigate('#/dashboard');
        render();
      }
    }
  });

  document.addEventListener('input', function (event) {
    const docsSearch = event.target.closest('[data-search="docs"]');
    if (docsSearch) {
      state.docQuery = docsSearch.value;
      const results = document.getElementById('docs-results');
      if (results) results.innerHTML = docsResults(filteredDocs(S.all()));
      return;
    }

    const docType = event.target.closest('[data-filter="doc-type"]');
    if (docType) {
      state.docType = docType.value;
      const results = document.getElementById('docs-results');
      if (results) results.innerHTML = docsResults(filteredDocs(S.all()));
      return;
    }

    const workersSearch = event.target.closest('[data-search="workers"]');
    if (workersSearch) {
      state.workersQuery = workersSearch.value;
      const results = document.getElementById('workers-results');
      if (results) results.innerHTML = workersResults(filteredWorkers());
      const clear = document.querySelector('[data-action="clear-workers-search"]');
      if (clear) clear.hidden = !state.workersQuery;
      return;
    }

    const field = event.target.closest('[data-field]');
    if (field) {
      const key = field.dataset.field;
      state.flow.fields[key] = field.value;
      if (!state.flow.dirty) {
        state.flow.dirty = true;
        state.flow.step = 3;
        updateStepBar();
      }
      state.flow.draftSaved = false;
      const wrap = field.closest('.field');
      if (wrap) {
        wrap.classList.remove('auto', 'check');
        const tag = wrap.querySelector('.source-tag');
        if (tag) tag.remove();
      }
      delete state.flow.auto[key];
      if (key === 'pesel') updatePeselHintFor(field, state.flow.fields.dob);
    }

    const workerField = event.target.closest('[data-worker-field]');
    if (workerField && state.workerDraft) {
      const key = workerField.dataset.workerField;
      state.workerDraft[key] = workerField.value;
      if (key === 'pesel') updatePeselHintFor(workerField, state.workerDraft.dob);
    }

    if (state.flow.match) {
      state.flow.match = null;
      const panel = document.querySelector('[data-match]');
      if (panel) panel.remove();
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target.closest('[data-form]');
    if (!form) return;
    event.preventDefault();
    if (form.dataset.form === 'dashboard-search') {
      const input = form.querySelector('input[type="search"]');
      state.workersQuery = input ? input.value.trim() : '';
      navigate('#/workers');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNav();
    if ((event.key === 'Enter' || event.key === ' ') && document.activeElement) {
      const row = document.activeElement.closest ? document.activeElement.closest('tr[data-href]') : null;
      if (row) {
        event.preventDefault();
        navigate(row.dataset.href);
      }
    }
  });

  window.addEventListener('hashchange', function () {
    closeNav();
    render();
  });

  if (!location.hash) {
    try { history.replaceState(null, '', '#/dashboard'); } catch (err) { location.hash = '#/dashboard'; }
  }
  render();
  S.init().then(render);
})();
