/* DocuFlow — Settings page (#/settings/<tab>). Fictional data only. */
(function () {
  'use strict';

  const D = window.DocuFlowData;
  const S = window.DocuFlowStore;
  const SET = window.DocuFlowSettings;

  const TABS = [
    ['organisation', 'Organisation'],
    ['users', 'Users & roles'],
    ['required', 'Required documents'],
    ['expiry', 'Expiry reminders'],
    ['ocr', 'OCR & review'],
    ['notifications', 'Notifications'],
    ['privacy', 'Data & privacy'],
    ['security', 'Security'],
    ['appearance', 'Appearance & language'],
    ['about', 'About']
  ];
  const PERSONAL = ['appearance.theme', 'appearance.lang', 'viewAs'];
  let ctx = null;
  let tab = 'organisation';
  let auditArea = 'All';

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function locked(path) { return !SET.can('settings') && PERSONAL.indexOf(path) < 0; }
  function dis(path) { return locked(path) ? ' disabled' : ''; }
  function initials(name) { const p = String(name).trim().split(/\s+/); return (p[0] || '').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : ''); }

  /* -------------------------------------------------------------- controls */
  function card(title, sub, body, extra) {
    return '<section class="card set-card"' + (extra || '') + '>' +
      '<div class="card-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p class="card-sub">' + sub + '</p>' : '') + '</div></div>' +
      body + '</section>';
  }
  function row(title, desc, control) {
    return '<div class="set-row"><div class="set-row-text"><strong>' + esc(title) + '</strong>' + (desc ? '<span>' + desc + '</span>' : '') + '</div>' +
      '<div class="set-row-control">' + control + '</div></div>';
  }
  function toggle(path, label, opts) {
    const on = opts && 'checked' in opts ? opts.checked : !!SET.get(path);
    const off = opts && opts.disabled;
    return '<label class="switch"><input type="checkbox" data-set="' + path + '" data-label="' + esc(label) + '"' + (on ? ' checked' : '') + (off ? ' disabled' : dis(path)) + '>' +
      '<span class="switch-track" aria-hidden="true"></span><span class="sr-only">' + esc(label) + '</span></label>';
  }
  function select(path, label, options, num) {
    const value = String(SET.get(path));
    return '<select class="set-select" data-set="' + path + '" data-label="' + esc(label) + '"' + (num ? ' data-num' : '') + ' aria-label="' + esc(label) + '"' + dis(path) + '>' +
      options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === value ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }
  function segmented(path, label, options) {
    const value = String(SET.get(path));
    return '<div class="chips" role="group" aria-label="' + esc(label) + '">' + options.map(function (o) {
      const on = String(o[0]) === value;
      return '<button type="button" class="chip-filter' + (on ? ' is-active' : '') + '" data-set-btn="' + path + '" data-value="' + esc(o[0]) + '" data-label="' + esc(label) + '" aria-pressed="' + on + '"' + dis(path) + '>' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function listBox(path, value, label, asSwitch) {
    const on = (SET.get(path) || []).indexOf(value) >= 0;
    const box = '<input type="checkbox"' + (asSwitch ? '' : ' class="set-check"') + ' data-set-list="' + path + '" value="' + esc(value) + '" data-label="' + esc(label) + '"' + (on ? ' checked' : '') + dis(path) + ' aria-label="' + esc(label) + '">';
    return asSwitch ? '<label class="switch">' + box + '<span class="switch-track" aria-hidden="true"></span></label>' : box;
  }
  function input(path, label, type) {
    return '<input class="set-input" type="' + (type || 'text') + '" data-set="' + path + '" data-label="' + esc(label) + '" value="' + esc(SET.get(path)) + '" aria-label="' + esc(label) + '"' + dis(path) + '>';
  }

  /* ------------------------------------------------------------------ tabs */
  function organisationTab() {
    const users = SET.get('users').filter(function (u) { return u.role !== 'Viewer'; });
    const places = SET.get('org.workplaces') || [];
    return card('Agency', 'Shown in the sidebar, on employee pages and in exports',
        row('Agency name', 'Legal name used on employee pages and the consent text', input('org.name', 'Agency name')) +
        row('Short name', 'Used in short labels, for example “Admin · Where2Work”', input('org.short', 'Short name')) +
        row('Logo initials', 'Up to 3 letters for the agency badge', '<span class="set-badge" aria-hidden="true">' + esc(SET.get('org.initials')) + '</span>' + input('org.initials', 'Logo initials')) +
        row('Default coordinator', 'Shown to employees as their contact and checks their uploads',
          select('org.coordinator', 'Default coordinator', users.map(function (u) { return [u.id, u.name + ' · ' + u.role]; })))) +
      card('Client workplaces', places.length + ' Rossmann locations where your workers are placed',
        '<ul class="set-list">' + places.map(function (p, i) {
          return '<li><span>' + esc(p) + '</span>' + (locked('org.workplaces') ? '' : '<button type="button" class="btn btn-quiet btn-small" data-settings="remove-workplace" data-index="' + i + '">Remove</button>') + '</li>';
        }).join('') + '</ul>' +
        (locked('org.workplaces') ? '' :
          '<form class="set-inline-form" data-settings-form="workplace"><input class="set-input" name="workplace" placeholder="e.g. Rossmann · Gdańsk, Galeria Bałtycka" aria-label="New workplace" required>' +
          '<button type="submit" class="btn btn-secondary btn-small">Add workplace</button></form>'));
  }

  function usersTab() {
    const users = SET.get('users');
    const two = SET.get('security.twoFactor');
    const adminOnly = !SET.can('settings');
    const roleOptions = ['Admin', 'Recruiter', 'Viewer'];
    const tableRows = users.map(function (u) {
      const self = u.id === 'u-anna';
      const roleCell = self || adminOnly
        ? esc(u.role) + (self ? ' <span class="chip chip-neutral chip-tiny">You</span>' : '')
        : '<select class="set-select" data-user-role="' + esc(u.id) + '" aria-label="Role for ' + esc(u.name) + '">' + roleOptions.map(function (r) { return '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>';
      return '<tr data-user="' + esc(u.id) + '">' +
        '<td><div class="person"><span class="avatar">' + esc(initials(u.name)) + '</span><div class="person-text"><span class="person-name">' + esc(u.name) + '</span><span class="person-meta">' + esc(u.email) + '</span></div></div></td>' +
        '<td>' + roleCell + '</td>' +
        '<td><span class="status ' + (u.status === 'Active' ? 'status-complete' : 'status-review') + '"><span class="status-dot"></span>' + esc(u.status) + '</span></td>' +
        '<td>' + (u.status === 'Invited' ? (two ? 'Set up at first sign-in' : 'Optional') : (two ? 'On' : 'Optional')) + '</td>' +
        '<td>' + (self || adminOnly ? '' : '<button type="button" class="btn btn-quiet btn-small" data-settings="remove-user" data-id="' + esc(u.id) + '">Remove</button>') + '</td>' +
        '</tr>';
    }).join('');
    const restore = SET.get('restoreBy') === 'admin-recruiter';
    const masked = SET.get('privacy.mask');
    const matrix = [
      ['View workers, documents and reports', 1, 1, 1],
      ['Upload documents and edit workers', 1, 1, 0],
      ['Verify or reject documents', 1, 1, 0],
      ['Restore an older verified version', 1, restore ? 1 : 0, 0],
      ['See full PESEL and passport numbers', 1, 1, masked.length ? 0 : 1],
      ['Export data and the audit log', 1, 0, 0],
      ['Change settings and invite users', 1, 0, 0]
    ];
    return card('Preview as role', 'See DocuFlow the way a Recruiter or Viewer sees it. You stay signed in as Anna Kowalska.',
        row('View as', 'Changes buttons, masking and what can be edited across the app', segmented('viewAs', 'View as role', [['Admin', 'Admin'], ['Recruiter', 'Recruiter'], ['Viewer', 'Viewer']]))) +
      card('Team', users.length + ' people can sign in to this workspace',
        '<div class="table-wrap"><table class="table set-table" data-users-table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>2-step sign-in</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + tableRows + '</tbody></table></div>' +
        (adminOnly ? '' :
          '<form class="set-invite" data-settings-form="invite">' +
            '<input class="set-input" name="name" placeholder="Full name" aria-label="Full name" required>' +
            '<input class="set-input" name="email" type="email" placeholder="name@where2work.example" aria-label="Email" required>' +
            '<select class="set-select" name="role" aria-label="Role"><option>Recruiter</option><option>Viewer</option><option>Admin</option></select>' +
            '<button type="submit" class="btn btn-primary btn-small">Invite user</button>' +
          '</form>')) +
      card('Who can restore older versions', 'Restoring makes an older verified document the current one again',
        row('Restore permission', 'Admins can always restore', select('restoreBy', 'Restore permission', [['admin-recruiter', 'Admins and Recruiters'], ['admin', 'Admins only']]))) +
      card('Role permissions', 'Read-only summary of what each role can do',
        '<div class="table-wrap"><table class="table set-matrix" data-matrix><thead><tr><th>Permission</th><th>Admin</th><th>Recruiter</th><th>Viewer</th></tr></thead><tbody>' +
        matrix.map(function (m) {
          return '<tr><td>' + esc(m[0]) + '</td>' + [1, 2, 3].map(function (i) { return '<td>' + (m[i] ? '<span class="set-yes">✓<span class="sr-only"> Yes</span></span>' : '<span class="set-no">—<span class="sr-only"> No</span></span>') + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>');
  }

  function requiredTab() {
    const head = '<thead><tr><th>Item</th><th>Non-EU workers</th><th>Polish &amp; EU workers</th></tr></thead>';
    const rowsFor = function (group) {
      return SET.ITEMS.filter(function (i) { return i.group === group; }).map(function (i) {
        const hint = i.fields.map(function (f) { return f[1]; }).join(' · ');
        return '<tr><td>' + esc(i.label) + (hint !== i.label ? '<span class="set-hint">' + esc(hint) + '</span>' : '') + '</td>' +
          '<td>' + listBox('required.nonEu', i.key, i.label + ' required for non-EU workers') + '</td>' +
          '<td>' + listBox('required.eu', i.key, i.label + ' required for Polish and EU workers') + '</td></tr>';
      }).join('');
    };
    const workers = ctx.workers || [];
    const incomplete = workers.filter(function (w) { return SET.missingFor(w).length; }).length;
    return card('Required documents', 'A worker is <b>Complete</b> only when everything ticked here is on their record. Anything missing puts them in <b>Review</b> and on the Missing information report.',
        '<div class="table-wrap"><table class="table set-matrix" data-required="doc">' + head + '<tbody>' + rowsFor('doc') + '</tbody></table></div>') +
      card('Mandatory fields', 'First name and surname are always required',
        '<div class="table-wrap"><table class="table set-matrix" data-required="field">' + head + '<tbody>' + rowsFor('field') + '</tbody></table></div>' +
        '<p class="set-foot" data-required-summary>' + incomplete + ' of ' + workers.length + ' workers are missing something under these rules · <a class="text-link" href="#/reports">Open the Missing information report</a></p>');
  }

  function expiryTab() {
    const days = SET.expiryDays();
    const notify = SET.get('expiry.notify');
    const who = [['coordinator', 'Coordinator', 'The worker’s coordinator'], ['admins', 'Admins', 'Everyone with the Admin role'], ['worker', 'Worker', 'The worker, in their DocuFlow account']];
    return card('Reminder window', 'Drives the Expiring status, dashboard and alert counts, the Reports page and employee reminders',
        row('Remind before expiry', 'Documents expiring within this many days are flagged', segmented('expiry.days', 'Remind before expiry', [[30, '30 days'], [60, '60 days'], [90, '90 days']])) +
        row('Employee reminders', 'Workers see expiry reminders in their Notifications', toggle('expiry.employeeReminders', 'Employee reminders'))) +
      card('Who gets reminded', 'Shown on the Expiry alerts page',
        who.map(function (w) { return row(w[1], w[2], listBox('expiry.notify', w[0], 'Remind ' + w[1], true)); }).join('') +
        '<p class="set-foot">Right now: ' + D.expiryItems(ctx.workers || []).filter(function (i) { return i.days <= days; }).length + ' documents expire within ' + days + ' days' + (notify.length ? '' : ' · nobody is reminded') + '.</p>');
  }

  function ocrTab() {
    const types = [['jpg', 'JPG'], ['png', 'PNG'], ['pdf', 'PDF (first page)']];
    return card('Auto-fill', 'How DocuFlow treats what it reads from a document',
        row('Confidence threshold', 'Fields read below this confidence are highlighted amber for a human check', select('ocr.threshold', 'Confidence threshold', [[70, '70%'], [80, '80% (recommended)'], [90, '90%'], [95, '95%']], true)) +
        row('Require human verification for employee uploads', 'Employee uploads never change a record until a coordinator presses Verify &amp; apply. This is always on.', toggle('ocr.humanCheck', 'Require human verification', { checked: true, disabled: true })) +
        row('Recognition language', 'Latin script and passport MRZ lines', '<span class="set-value">English (eng)</span>')) +
      card('Uploads', 'Applies to recruiter and employee uploads',
        types.map(function (ty) { return row(ty[1], '', listBox('ocr.types', ty[0], 'Allow ' + ty[1], true)); }).join('') +
        row('Maximum file size', 'Bigger files are refused before they are read', select('ocr.maxMb', 'Maximum file size', [[2, '2 MB'], [5, '5 MB'], [10, '10 MB'], [20, '20 MB']], true)));
  }

  function notificationsTab() {
    const events = [
      ['review', 'Document awaiting review', 'In-app: red count on Documents in the sidebar'],
      ['expiry', 'Document entering the reminder window', 'In-app: red count on Expiry alerts in the sidebar'],
      ['digest', 'Weekly compliance summary', 'Monday 08:00 summary of expiring and missing items']
    ];
    return card('Recruiter notifications', 'In-app notifications work straight away. Email is sent once DocuFlow is connected to your mail server.',
      '<div class="table-wrap"><table class="table set-matrix" data-notify><thead><tr><th>Event</th><th>In-app</th><th>Email</th></tr></thead><tbody>' +
      events.map(function (e) {
        return '<tr><td>' + esc(e[1]) + '<span class="set-hint">' + esc(e[2]) + '</span></td>' +
          '<td>' + (e[0] === 'digest' ? '<span class="set-no">—</span>' : toggle('notify.' + e[0] + '.app', e[1] + ' in-app')) + '</td>' +
          '<td>' + toggle('notify.' + e[0] + '.email', e[1] + ' by email') + '</td></tr>';
      }).join('') + '</tbody></table></div>');
  }

  function auditRows() {
    const docs = window.DocuFlowReports && window.DocuFlowReports.events ? window.DocuFlowReports.events(ctx.workers || []) : [];
    const settings = SET.auditLog().map(function (e) { return { at: e.at, area: e.area || 'Settings', action: e.action, by: e.by }; });
    return settings.concat(docs.map(function (e) { return { at: e.at, area: 'Documents', action: e.action + ' · ' + e.doc.type + ' · ' + e.worker, by: e.by }; }))
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
  }

  function privacyTab() {
    const all = auditRows();
    const log = auditArea === 'All' ? all : all.filter(function (e) { return e.area === auditArea; });
    const areaChips = ['All', 'Settings', 'Documents'].map(function (a) {
      const count = a === 'All' ? all.length : all.filter(function (e) { return e.area === a; }).length;
      return '<button type="button" class="chip-filter' + (auditArea === a ? ' is-active' : '') + '" data-settings="audit-area" data-value="' + a + '" aria-pressed="' + (auditArea === a) + '">' + a + '<span class="chip-count">' + count + '</span></button>';
    }).join('');
    const canExport = SET.can('export');
    const masks = [['pesel', 'PESEL', 'Shown as •••••••2341'], ['passportNo', 'Passport number', 'Shown as FP•••••71'], ['dob', 'Date of birth', 'Shown as ••.••.1991']];
    return card('Retention (RODO)', 'How long records are kept after a worker leaves',
        row('Keep records for', 'Polish law: personnel files are kept 10 years after employment ends. Shown on every worker record.', select('privacy.retentionYears', 'Keep records for', [[3, '3 years'], [5, '5 years'], [10, '10 years (personnel files)']], true))) +
      card('Masking for the Viewer role', 'Viewers see these values partly hidden everywhere in DocuFlow',
        masks.map(function (m) { return row(m[1], m[2], listBox('privacy.mask', m[0], 'Mask ' + m[1] + ' for Viewers', true)); }).join('')) +
      card('Consent text shown to employees', 'Appears at the bottom of My details in the employee view',
        '<div class="set-pad"><textarea class="set-input set-textarea" rows="4" data-set="privacy.consent" data-label="Consent text" aria-label="Consent text"' + dis('privacy.consent') + '>' + esc(SET.get('privacy.consent')) + '</textarea></div>') +
      card('Export', canExport ? 'Download everything in this workspace' : 'Only Admins can export data',
        '<div class="set-actions">' +
          '<button type="button" class="btn btn-quiet" data-settings="export-json"' + (canExport ? '' : ' disabled') + '>Export all data (JSON)</button>' +
          '<button type="button" class="btn btn-quiet" data-settings="export-csv"' + (canExport ? '' : ' disabled') + '>Export workers (CSV)</button>' +
        '</div>') +
      card('Audit log', all.length + ' events · settings changes and document actions, newest first',
        '<div class="set-actions"><div class="chips" role="group" aria-label="Filter audit log">' + areaChips + '</div></div>' +
        (log.length
          ? '<div class="table-wrap"><table class="table set-table" data-audit-log><thead><tr><th>When</th><th>Area</th><th>Action</th><th>By</th></tr></thead><tbody>' +
            log.slice(0, 50).map(function (e) { return '<tr><td>' + esc(S.stamp(e.at)) + '</td><td>' + esc(e.area) + '</td><td class="set-wrap">' + esc(e.action) + '</td><td>' + esc(e.by) + '</td></tr>'; }).join('') +
            '</tbody></table></div>'
          : '<div class="empty empty-small"><p class="empty-title">No activity yet</p><p class="empty-text">Settings changes and document reviews appear here.</p></div>') +
        '<div class="set-actions"><button type="button" class="btn btn-quiet btn-small" data-settings="export-audit"' + (canExport && log.length ? '' : ' disabled') + '>Export audit log (CSV)</button></div>') +
      card('Reset', 'Start the pitch from a clean slate',
        row('Reset demo data', 'Restores the 12 fictional workers, removes stored documents and clears the audit log. Settings are kept.',
          '<button type="button" class="btn btn-quiet" data-action="reset-demo"' + (SET.can('settings') ? '' : ' disabled') + '>Reset demo data</button>') +
        row('Restore default settings', 'Puts every setting on this page back to how DocuFlow ships',
          '<button type="button" class="btn btn-quiet" data-settings="reset-settings"' + (SET.can('settings') ? '' : ' disabled') + '>Restore defaults</button>'));
  }

  function securityTab() {
    const day = function (n) { return D.formatDate(D.isoInDays(n)); };
    const signins = [
      [day(0) + ' 09:12', 'Chrome on Windows', 'Warsaw, PL', 'This device'],
      [day(-1) + ' 17:48', 'Safari on iPhone', 'Warsaw, PL', 'Signed in'],
      [day(-3) + ' 08:05', 'Chrome on Windows', 'Warsaw, PL', 'Signed in'],
      [day(-6) + ' 21:30', 'Firefox on Linux', 'Kraków, PL', 'Blocked · 2-step code not entered']
    ];
    return card('Sign-in policy', 'Applies to everyone in this workspace',
        row('Require 2-step sign-in', 'Everyone confirms a code from an authenticator app when they sign in', toggle('security.twoFactor', 'Require 2-step sign-in')) +
        row('Sign out after inactivity', 'Ends idle sessions on shared office computers', select('security.timeout', 'Sign out after inactivity', [[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour'], [480, '8 hours']], true))) +
      card('Recent sign-ins', 'Anna Kowalska · last 7 days',
        '<div class="table-wrap"><table class="table set-table" data-signins><thead><tr><th>When</th><th>Device</th><th>Location</th><th>Result</th></tr></thead><tbody>' +
        signins.map(function (s) { return '<tr><td>' + esc(s[0]) + '</td><td>' + esc(s[1]) + '</td><td>' + esc(s[2]) + '</td><td>' + esc(s[3]) + '</td></tr>'; }).join('') +
        '</tbody></table></div>');
  }

  function appearanceTab() {
    return card('Appearance', 'Saved for this browser',
        row('Theme', 'System follows your device setting', segmented('appearance.theme', 'Theme', [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']])) +
        row('Date format', 'Polish standard, used everywhere including exports', '<span class="set-value">DD.MM.YYYY · ' + esc(D.formatDate(today())) + '</span>')) +
      card('Language', 'Translates navigation, page titles and settings tabs. Worker data and documents stay as entered.',
        row('Interface language', '', segmented('appearance.lang', 'Interface language', [['en', 'English'], ['pl', 'Polski'], ['uk', 'Українська']])));
  }

  function aboutTab() {
    const stored = S.all().length;
    return card('DocuFlow', 'Worker records, document auto-fill and expiry alerts for ' + esc(SET.get('org.name')),
        row('Version', '', '<span class="set-value">1.5 · ' + esc(D.formatDate(today())) + '</span>') +
        row('Where data is kept', 'Everything stays in this browser (localStorage and IndexedDB). Nothing is sent to a server; documents are read on this device.', '<span class="set-value">' + (ctx.workers || []).length + ' workers · ' + stored + ' stored documents</span>') +
        row('Data', 'All people, numbers and documents are fictional', '<span class="set-value">Fictional</span>')) +
      card('What these settings change', '',
        '<ul class="set-bullets">' +
          '<li><b>Applied across the app:</b> agency name, coordinator, view-as role and masking, required documents (status and Missing information), reminder window, employee reminders, confidence threshold, file types and size, in-app badges, retention notice, consent text, theme and language.</li>' +
          '<li><b>Saved for when DocuFlow is connected to your servers:</b> email notifications, 2-step sign-in and the inactivity timeout.</li>' +
        '</ul>');
  }

  /* ---------------------------------------------------------------- render */
  function render(nextTab, context) {
    ctx = context;
    tab = TABS.some(function (x) { return x[0] === nextTab; }) ? nextTab : 'organisation';
    const views = { organisation: organisationTab, users: usersTab, required: requiredTab, expiry: expiryTab, ocr: ocrTab, notifications: notificationsTab, privacy: privacyTab, security: securityTab, appearance: appearanceTab, about: aboutTab };
    const current = TABS.find(function (x) { return x[0] === tab; });
    return context.pageHead('Account', SET.t('Settings'), 'Workspace preferences for ' + esc(SET.get('org.name')) + ' · changes save automatically') +
      (SET.can('settings') ? '' : '<div class="notice notice-warn set-notice" data-settings-locked><strong>Viewing as ' + esc(SET.role()) + '</strong><span>Only Admins can change workspace settings. Switch back under Users &amp; roles → View as.</span></div>') +
      '<div class="set-layout">' +
        '<nav class="set-tabs" aria-label="Settings sections">' + TABS.map(function (x) {
          const on = x[0] === tab;
          return '<a class="set-tab' + (on ? ' is-active' : '') + '" href="#/settings/' + x[0] + '" data-tab="' + x[0] + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(SET.t(x[1])) + '</a>';
        }).join('') + '</nav>' +
        '<div class="set-panel" data-panel="' + tab + '"><h2 class="sr-only">' + esc(SET.t(current[1])) + '</h2>' + views[tab]() + '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------- events */
  function after(message) { ctx.toast(message || 'Saved'); ctx.rerender(); }
  function download(name, type, text) {
    const href = URL.createObjectURL(new Blob([text], { type: type }));
    const link = document.createElement('a');
    link.href = href; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }
  function csv(rows) {
    return '\ufeff' + rows.map(function (r) {
      return r.map(function (v) { const s = String(v === null || v === undefined ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',');
    }).join('\r\n');
  }
  function optionText(el) { return el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value; }

  document.addEventListener('change', function (event) {
    if (!ctx) return;
    const el = event.target;
    if (el.matches('[data-set]')) {
      let value = el.type === 'checkbox' ? el.checked : el.value;
      if (el.hasAttribute('data-num')) value = Number(value);
      if (el.dataset.set === 'org.initials') value = String(value).toUpperCase().slice(0, 3);
      if (typeof value === 'string' && !value.trim() && el.dataset.set !== 'privacy.consent') { ctx.toast(el.dataset.label + ' can’t be empty.', 'error'); ctx.rerender(); return; }
      SET.set(el.dataset.set, value, el.dataset.label + ': ' + optionText(el));
      after('Saved · ' + el.dataset.label);
    } else if (el.matches('[data-set-list]')) {
      const path = el.dataset.setList;
      const list = (SET.get(path) || []).filter(function (v) { return v !== el.value; });
      if (el.checked) list.push(el.value);
      if (path === 'ocr.types' && !list.length) { ctx.toast('Keep at least one file type allowed.', 'error'); ctx.rerender(); return; }
      SET.set(path, list, el.dataset.label + ': ' + (el.checked ? 'on' : 'off'));
      after('Saved · ' + el.dataset.label);
    } else if (el.matches('[data-user-role]')) {
      const users = SET.get('users').map(function (u) { return u.id === el.dataset.userRole ? Object.assign({}, u, { role: el.value }) : u; });
      const user = users.find(function (u) { return u.id === el.dataset.userRole; });
      SET.set('users', users, 'Changed ' + user.name + '’s role to ' + el.value);
      after(user.name + ' is now ' + el.value);
    }
  });

  document.addEventListener('click', function (event) {
    if (!ctx) return;
    const btn = event.target.closest('[data-set-btn]');
    if (btn) {
      const path = btn.dataset.setBtn;
      const raw = btn.dataset.value;
      const value = /^\d+$/.test(raw) ? Number(raw) : raw;
      if (String(SET.get(path)) === String(value)) return;
      SET.set(path, value, btn.dataset.label + ': ' + btn.textContent.trim());
      after('Saved · ' + btn.dataset.label + ': ' + btn.textContent.trim());
      return;
    }
    const el = event.target.closest('[data-settings]');
    if (!el) return;
    const action = el.dataset.settings;
    if (action === 'audit-area') {
      auditArea = el.dataset.value;
      ctx.rerender();
    } else if (action === 'remove-workplace') {
      const list = SET.get('org.workplaces').slice();
      const removed = list.splice(Number(el.dataset.index), 1)[0];
      SET.set('org.workplaces', list, 'Removed workplace ' + removed);
      after('Removed ' + removed);
    } else if (action === 'remove-user') {
      const user = SET.get('users').find(function (u) { return u.id === el.dataset.id; });
      if (!user || !window.confirm('Remove ' + user.name + ' from this workspace? They will no longer be able to sign in.')) return;
      const patch = { users: SET.get('users').filter(function (u) { return u.id !== user.id; }) };
      if (SET.get('org.coordinator') === user.id) SET.set('org.coordinator', 'u-anna');
      SET.set('users', patch.users, 'Removed user ' + user.name);
      after(user.name + ' removed');
    } else if (action === 'export-json') {
      const docs = S.all().map(function (d) { const o = Object.assign({}, d); delete o.preview; delete o.original; delete o.isCurrent; delete o.replacedAt; return o; });
      download('docuflow-export-' + today() + '.json', 'application/json', JSON.stringify({ exportedAt: new Date().toISOString(), agency: SET.get('org.name'), workers: ctx.workers, documents: docs, settings: SET.all(), audit: SET.auditLog() }, null, 2));
      SET.log('Exported all data (JSON)');
      after('Export downloaded');
    } else if (action === 'export-csv') {
      const cols = ['id', 'firstName', 'surname', 'dob', 'nationality', 'passportNo', 'passportExpiry', 'pesel', 'email', 'forkliftLicenceNo', 'licenceExpiry', 'residenceCardExpiry', 'status'];
      download('docuflow-workers-' + today() + '.csv', 'text/csv;charset=utf-8', csv([cols].concat(ctx.workers.map(function (w) {
        return cols.map(function (c) { return /Expiry$|^dob$/.test(c) && w[c] ? D.formatDate(w[c]) : (c === 'status' ? D.computeStatus(w) : w[c]); });
      }))));
      SET.log('Exported workers (CSV)');
      after('Export downloaded');
    } else if (action === 'export-audit') {
      download('docuflow-audit-' + today() + '.csv', 'text/csv;charset=utf-8', csv([['When', 'Area', 'Action', 'By']].concat(auditRows().map(function (e) { return [S.stamp(e.at), e.area, e.action, e.by]; }))));
      SET.log('Exported audit log (CSV)');
      after('Audit log downloaded');
    } else if (action === 'reset-settings') {
      if (!window.confirm('Restore default settings? Your role preview, theme and language go back to the defaults too.')) return;
      SET.reset();
      after('Default settings restored');
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target.closest('[data-settings-form]');
    if (!form || !ctx) return;
    event.preventDefault();
    if (form.dataset.settingsForm === 'workplace') {
      const value = String(form.workplace.value || '').trim();
      if (!value) return;
      SET.set('org.workplaces', SET.get('org.workplaces').concat([value]), 'Added workplace ' + value);
      after('Added ' + value);
    } else if (form.dataset.settingsForm === 'invite') {
      const name = String(form.elements.name.value || '').trim();
      const email = String(form.elements.email.value || '').trim().toLowerCase();
      const role = form.elements.role.value;
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { ctx.toast('Add a name and a valid email address.', 'error'); return; }
      if (SET.get('users').some(function (u) { return u.email.toLowerCase() === email; })) { ctx.toast(email + ' is already in this workspace.', 'error'); return; }
      const user = { id: 'u-' + Date.now().toString(36), name: name, email: email, phone: '', role: role, status: 'Invited' };
      SET.set('users', SET.get('users').concat([user]), 'Invited ' + name + ' as ' + role);
      after(name + ' invited as ' + role);
    }
  });

  window.DocuFlowSettingsPage = { render: render, TABS: TABS };
})();
