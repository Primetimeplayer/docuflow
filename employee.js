/* DocuFlow — employee self-service view (#/me). Fictional data only. */
(function () {
  'use strict';

  const D = window.DocuFlowData;
  const OCR = window.DocuFlowOCR;

  const svg = (inner) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  const ICONS = {
    home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
    doc: svg('<path d="M7.5 3H14l4 4v12.5A1.5 1.5 0 0 1 16.5 21h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3Z"/><path d="M14 3v5h5"/>'),
    bell: svg('<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    check: svg('<path d="m5 12 4.5 4.5L19 7"/>'),
    warn: svg('<path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
    upload: svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    download: svg('<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
    copy: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    chev: svg('<path d="m6 9 6 6 6-6"/>'),
    lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    shield: svg('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'),
    spark: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    card: svg('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>')
  };

  function paintSidebarIcons() {
    document.querySelectorAll('[data-emp-icon]').forEach(function (el) {
      el.innerHTML = ICONS[el.dataset.empIcon] || '';
    });
  }

  const PROFILE_DEFAULTS = {
    middleName: '', province: 'Mazowieckie', maritalStatus: '', prevSurnames: '', prevFirstNames: '',
    motherMaidenName: '', maidenName: '', phone: '+48 512 000 431', whatsapp: 'Same as phone', facebook: '',
    agency: 'Where2Work sp. z o.o.', workplace: 'Rossmann · Warsaw',
    height: '168 cm', weight: '', eyeColour: 'Brown', features: '', clothingSize: 'M', trouserSize: '38', shoeSize: '',
    bankName: '', iban: 'PL61 1090 1014 0000 0712 1981 4821',
    healthExpiry: D.isoInDays(23), palletExpiry: D.isoInDays(-20)
  };

  const SECTIONS = [
    {
      key: 'personal',
      title: 'Personal',
      sub: 'Filled in from your passport',
      open: true,
      fields: [
        { key: 'firstName', label: 'First name', locked: true, verified: true },
        { key: 'surname', label: 'Last name', locked: true, verified: true },
        { key: 'p:middleName', label: 'Middle name', optional: true },
        { key: 'pesel', label: 'PESEL', locked: true, mono: true, copy: true },
        { key: 'dob', label: 'Date of birth', locked: true, date: true },
        { key: 'nationality', label: 'Nationality', locked: true },
        { key: 'p:province', label: 'Province (województwo)' },
        { key: 'p:maritalStatus', label: 'Marital status', type: 'select', options: ['', 'Single', 'Married', 'Divorced', 'Widowed'] },
        { key: 'p:prevSurnames', label: 'Previous surnames', optional: true },
        { key: 'p:prevFirstNames', label: 'Previous first names', optional: true }
      ]
    },
    {
      key: 'family',
      title: 'Family',
      sub: 'Needed for your PESEL and work permit forms',
      open: true,
      fields: [
        { key: 'fatherName', label: "Father's name" },
        { key: 'motherName', label: "Mother's name" },
        { key: 'p:motherMaidenName', label: "Mother's maiden name" },
        { key: 'p:maidenName', label: 'Your maiden name', optional: true }
      ]
    },
    {
      key: 'contact',
      title: 'Contact',
      sub: 'How your coordinator reaches you',
      open: true,
      fields: [
        { key: 'p:phone', label: 'Phone', copy: true },
        { key: 'email', label: 'Email', copy: true },
        { key: 'p:whatsapp', label: 'WhatsApp' },
        { key: 'p:facebook', label: 'Facebook account', optional: true }
      ]
    },
    {
      key: 'work',
      title: 'Work & sizes',
      sub: 'Employer, workwear and appearance for your ID badge',
      open: false,
      fields: [
        { key: 'p:agency', label: 'Hiring agency', locked: true },
        { key: 'p:workplace', label: 'Workplace', locked: true },
        { key: 'p:height', label: 'Height' },
        { key: 'p:eyeColour', label: 'Eye colour' },
        { key: 'p:clothingSize', label: 'Clothing size' },
        { key: 'p:trouserSize', label: 'Trouser size' },
        { key: 'p:shoeSize', label: 'Shoe size' },
        { key: 'p:weight', label: 'Weight', optional: true },
        { key: 'p:features', label: 'Distinctive features', optional: true }
      ]
    },
    {
      key: 'bank',
      title: 'Bank',
      sub: 'Where your salary is paid',
      open: true,
      fields: [
        { key: 'p:bankName', label: 'Bank name' },
        { key: 'p:iban', label: 'Account number (IBAN)', locked: true, mono: true, copy: true, eye: true }
      ]
    }
  ];

  /* -------------------------------------------------------- module state */

  let sub = 'home';
  let editing = null;
  let ibanShown = false;
  let docFilter = 'all';
  let noteFilter = 'all';
  let readIds = {};
  let sessionEvents = [];
  let busyDoc = null;
  let busyPct = 0;
  let pendingDoc = null;
  let lastCtx = null;
  let availability = [true, true, true, false, true, true, false];

  /* -------------------------------------------------------------- helpers */

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function me(ctx) {
    if (!ctx || !ctx.workers) return null;
    const w = ctx.workers.find(function (x) { return x.id === 'w-001'; });
    if (!w) return null;
    if (!w.profile) {
      w.profile = {};
      Object.keys(PROFILE_DEFAULTS).forEach(function (k) { w.profile[k] = PROFILE_DEFAULTS[k]; });
      D.saveWorkers(ctx.workers);
    } else {
      let changed = false;
      Object.keys(PROFILE_DEFAULTS).forEach(function (k) {
        if (!(k in w.profile)) { w.profile[k] = PROFILE_DEFAULTS[k]; changed = true; }
      });
      if (changed) D.saveWorkers(ctx.workers);
    }
    return w;
  }

  function getField(w, key) {
    if (key.indexOf('p:') === 0) return w.profile ? w.profile[key.slice(2)] : '';
    return w[key];
  }

  function setField(w, key, value) {
    if (key.indexOf('p:') === 0) {
      w.profile = w.profile || {};
      w.profile[key.slice(2)] = value;
    } else {
      w[key] = value;
    }
  }

  function requiredFields() {
    const out = [];
    SECTIONS.forEach(function (s) {
      s.fields.forEach(function (f) { if (!f.optional) out.push(f); });
    });
    return out;
  }

  function missingFields(w) {
    return requiredFields().filter(function (f) {
      return !String(getField(w, f.key) || '').trim();
    });
  }

  function sectionMissing(w, section) {
    return section.fields.filter(function (f) {
      return !f.optional && !String(getField(w, f.key) || '').trim();
    }).length;
  }

  function percentComplete(w) {
    const all = requiredFields();
    if (!all.length) return 100;
    const missing = missingFields(w).length;
    return Math.round(((all.length - missing) / all.length) * 100);
  }

  function maskIban(value) {
    const compact = String(value || '').replace(/\s+/g, '');
    if (compact.length < 6) return compact;
    return compact.slice(0, 2) + '•• •••• •••• •••• •••• •••• ' + compact.slice(-4);
  }

  function shortDate(iso) {
    return D.formatDate(iso).slice(0, 5);
  }

  function weekdayShort(iso) {
    return D.formatDate(iso, { weekday: 'short' });
  }

  function toneStatusClass(tone) {
    return tone === 'red' ? 'status-expiring' : tone === 'amber' ? 'status-review' : 'status-complete';
  }

  function pill(label, cls) {
    return '<span class="status ' + cls + '"><span class="status-dot"></span>' + esc(label) + '</span>';
  }

  function iconBox(name, tone) {
    return '<span class="emp-ico' + (tone ? ' ' + tone : '') + '">' + (ICONS[name] || '') + '</span>';
  }

  function setBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count ? String(count) : '';
    el.hidden = !count;
  }

  /* ------------------------------------------------------------ documents */

  function docsFor(w) {
    const list = [];
    const passportSub = [w.nationality, w.passportNo, 'auto-filled by DocuFlow'].filter(Boolean).join(' · ');
    list.push({
      id: 'passport', title: 'Passport', sub: passportSub, chip: 'Main ID',
      field: 'passportExpiry', kind: 'passport', expected: 'passport', icon: 'doc',
      hint: 'renew it before you travel'
    });
    if (w.residenceCardExpiry) {
      list.push({
        id: 'residence', title: 'Residence card', sub: 'Karta pobytu',
        field: 'residenceCardExpiry', kind: 'residence', expected: 'residence card', icon: 'card',
        hint: 'book an appointment at the city office'
      });
    }
    if (w.licenceExpiry) {
      list.push({
        id: 'licence', title: 'Forklift licence', sub: 'UDT licence · ' + (w.forkliftLicenceNo || ''),
        field: 'licenceExpiry', kind: 'licence', expected: 'forklift licence', icon: 'shield',
        hint: 'renew it at UDT'
      });
    }
    list.push({
      id: 'health', title: 'Occupational health clearance', sub: 'Medical certificate',
      field: 'p:healthExpiry', icon: 'check', hint: 'book your medical check-up',
      noOcr: true, expected: 'medical certificate'
    });
    list.push({
      id: 'pallet', title: 'Electric pallet truck certificate', sub: 'UDT licence',
      field: 'p:palletExpiry', icon: 'shield', hint: 'renew it at UDT',
      noOcr: true, expected: 'pallet truck certificate'
    });
    list.push({ id: 'peselDoc', title: 'PESEL number assignment', sub: 'Confirmation from the city office', icon: 'user', noExpiry: true });
    list.push({ id: 'photo', title: 'ID photo', sub: 'Used for your staff badge', icon: 'user', noExpiry: true });
    list.push({ id: 'fee', title: 'Payment fee confirmation', sub: 'Work permit fee', icon: 'card', receipt: true });

    list.forEach(function (doc) {
      if (doc.field) doc.date = getField(w, doc.field);
    });
    return list;
  }

  function docState(doc) {
    if (doc.receipt) {
      return { pill: 'On file', pillClass: 'status-neutral', box: 'Receipt, nothing to renew', small: '—', tone: '', needs: false, days: null, boxTone: '' };
    }
    if (!doc.date) {
      return { pill: 'Valid', pillClass: 'status-complete', box: 'Does not expire', small: '—', tone: '', needs: false, days: null, boxTone: '' };
    }
    const days = D.daysUntil(doc.date);
    const needs = days !== null && days <= 30;
    const tone = needs ? D.toneForDays(days) : 'green';
    let pillText = 'Valid';
    let box;
    let small;
    if (days !== null && days < 0) {
      pillText = 'Expired';
      box = 'Expired on <b>' + D.formatDate(doc.date) + '</b>';
      const ago = Math.abs(days);
      small = ago + (ago === 1 ? ' day ago' : ' days ago');
    } else if (days !== null && days <= 30) {
      pillText = 'Expiring soon';
      box = 'Valid until <b>' + D.formatDate(doc.date) + '</b>';
      small = D.humanDays(days);
    } else {
      box = 'Valid until <b>' + D.formatDate(doc.date) + '</b>';
      if (days !== null && days <= 60) {
        small = D.humanDays(days);
      } else if (days !== null) {
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        const parts = [];
        if (years) parts.push(years + (years === 1 ? ' yr' : ' yrs'));
        if (months || !years) parts.push(months + ' mo');
        small = parts.join(' ') + ' left';
      } else {
        small = '—';
      }
    }
    return {
      pill: pillText,
      pillClass: days !== null && days <= 30 ? toneStatusClass(tone) : 'status-complete',
      box: box,
      small: small,
      tone: needs ? tone : '',
      needs: needs,
      days: days,
      boxTone: needs ? tone : ''
    };
  }

  function needingAction(w) {
    return docsFor(w).filter(function (doc) { return docState(doc).needs; })
      .sort(function (a, b) { return docState(a).days - docState(b).days; });
  }

  function alertText(doc) {
    const state = docState(doc);
    const days = state.days;
    const title = days < 0
      ? doc.title + ' has expired'
      : doc.title + ' expires in ' + days + (days === 1 ? ' day' : ' days');
    const line = days < 0
      ? 'Expired on ' + D.formatDate(doc.date) + ' · ' + state.small
      : 'Valid until ' + D.formatDate(doc.date) + ' · ' + (doc.hint || 'upload a new one before it expires');
    return { title: title, line: line, tone: state.tone };
  }

  /* -------------------------------------------------------------- details */

  function displayValue(w, field) {
    let value = String(getField(w, field.key) || '').trim();
    if (!value) return { text: field.optional ? 'None' : 'Not added', cls: ' none' };
    if (field.key === 'p:iban' && !ibanShown) value = maskIban(value);
    if (field.date) value = D.formatDate(value);
    return { text: value, cls: (field.mono ? ' mono' : '') };
  }

  function buttonsFor(w, field) {
    const value = String(getField(w, field.key) || '').trim();
    const buttons = [];
    if (field.eye) {
      buttons.push('<button type="button" class="emp-icobtn" data-emp="toggle-iban" aria-label="' +
        (ibanShown ? 'Hide number' : 'Show number') + '" title="' + (ibanShown ? 'Hide number' : 'Show number') + '">' +
        ICONS.eye + '</button>');
    }
    if (field.copy && value) {
      buttons.push('<button type="button" class="emp-icobtn" data-emp="copy" data-key="' + esc(field.key) + '" aria-label="Copy ' + esc(field.label) + '" title="Copy">' + ICONS.copy + '</button>');
    }
    if (field.verified) {
      buttons.push('<span class="emp-verified">✓ From passport</span>');
    } else if (!field.locked) {
      if (!value && !field.optional) {
        buttons.push('<button type="button" class="emp-add" data-emp="edit" data-key="' + esc(field.key) + '">+ Add</button>');
      } else {
        buttons.push('<button type="button" class="emp-plain" data-emp="edit" data-key="' + esc(field.key) + '">Edit</button>');
      }
    }
    return buttons.join('');
  }

  function fieldRow(w, field) {
    const isEditing = editing === field.key;
    const display = displayValue(w, field);
    const label = '<label' + (isEditing ? ' for="emp-edit-input"' : '') + '>' + esc(field.label) +
      (field.optional ? ' <em class="emp-opt">· optional</em>' : '') + '</label>';

    if (isEditing) {
      let control;
      if (field.type === 'select') {
        control = '<select id="emp-edit-input">' + field.options.map(function (opt) {
          const value = String(getField(w, field.key) || '');
          return '<option value="' + esc(opt) + '"' + (value === opt ? ' selected' : '') + '>' + (opt ? esc(opt) : '—') + '</option>';
        }).join('') + '</select>';
      } else {
        const value = String(getField(w, field.key) || '');
        const type = field.key === 'email' ? 'email' : field.key === 'p:phone' ? 'tel' : 'text';
        control = '<input id="emp-edit-input" type="' + type + '" value="' + esc(value) + '" autocomplete="off">';
      }
      return '<div class="emp-field">' +
        '<div class="emp-field-main">' + label + control + '</div>' +
        '<button type="button" class="btn btn-primary btn-small" data-emp="save">Save</button>' +
        '<button type="button" class="emp-plain" data-emp="cancel">Cancel</button>' +
        '</div>';
    }

    return '<div class="emp-field">' +
      '<div class="emp-field-main">' + label +
      '<div class="v' + display.cls + '">' + esc(display.text) + '</div></div>' +
      buttonsFor(w, field) +
      '</div>';
  }

  function sectionMarkup(w, section) {
    const missing = sectionMissing(w, section);
    const chip = missing
      ? '<span class="chip chip-neutral">' + missing + ' to add</span>'
      : '<span class="chip chip-blue">Complete</span>';
    return '<details class="card emp-sec"' + (section.open || (editing && section.fields.some(function (f) { return f.key === editing; })) ? ' open' : '') + '>' +
      '<summary><h2>' + esc(section.title) + '</h2><p class="card-sub">' + esc(section.sub) + '</p>' + chip +
      '<span class="chev">' + ICONS.chev + '</span></summary>' +
      '<div class="emp-fields">' + section.fields.map(function (f) { return fieldRow(w, f); }).join('') + '</div>' +
      (section.key === 'bank'
        ? '<div class="emp-lock">' + ICONS.lock + 'Hidden by default. Changing your bank account needs a code sent to your phone.</div>'
        : '') +
      '</details>';
  }

  function detailsView(w) {
    const missing = missingFields(w).length;
    return '<header class="page-head"><div class="page-head-main">' +
      '<p class="eyebrow">My account</p><h1>My details</h1>' +
      '<p class="lede">This is what Where2Work has on file for you. Anything missing has an <b>Add</b> button. Your coordinator checks changes to your name or PESEL against your documents.</p>' +
      '</div></header>' +
      '<div class="emp-tabs"><a class="on" href="#/me/details" aria-current="page">Details</a><a href="#/me/notifications">Notifications</a></div>' +
      SECTIONS.map(function (section) { return sectionMarkup(w, section); }).join('') +
      '<p class="form-footnote">' + (missing ? missing + (missing === 1 ? ' field is' : ' fields are') + ' still missing.' : 'Everything required is filled in.') + '</p>';
  }

  /* ----------------------------------------------------------------- home */

  function greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }

  function nextMondayOffset() {
    const day = new Date().getDay();
    const add = ((8 - day) % 7) || 7;
    return add;
  }

  function homeView(w) {
    const missing = missingFields(w);
    const percent = percentComplete(w);
    const alerts = needingAction(w);
    const shiftIso = D.isoInDays(2);
    const thenIso = D.isoInDays(3);
    const mondayIso = D.isoInDays(nextMondayOffset());
    const sundayIso = D.isoInDays(nextMondayOffset() + 6);
    const shiftDay = D.isoInDays(0);

    const progress = '<section class="card emp-progress">' +
      '<div class="emp-progress-main">' +
      '<strong>' + (missing.length ? 'Your profile is ' + percent + '% complete' : 'Your profile is complete') + '</strong>' +
      '<p>' + (missing.length
        ? missing.length + (missing.length === 1 ? ' field missing' : ' fields missing') + ' – add them so your coordinator doesn\'t have to chase you.'
        : 'Nothing to add. Thank you!') + '</p>' +
      '<div class="emp-bar"><i style="width:' + percent + '%"></i></div>' +
      '</div>' +
      (missing.length ? '<a class="btn btn-primary" href="#/me/details">+ Add missing details</a>' : '') +
      '</section>';

    const alertRows = alerts.length
      ? alerts.map(function (doc) {
        const text = alertText(doc);
        return '<div class="emp-alert">' + iconBox('warn', text.tone) +
          '<div class="emp-alert-main"><strong>' + esc(text.title) + '</strong><span>' + esc(text.line) + '</span></div>' +
          '<button type="button" class="btn btn-secondary btn-small" data-emp="upload" data-doc="' + doc.id + '"' +
          (busyDoc ? ' disabled' : '') + '>Upload new one</button></div>';
      }).join('')
      : '<div class="emp-alert">' + iconBox('check', 'green') +
        '<div class="emp-alert-main"><strong>All your documents are in date</strong><span>We\'ll remind you 30 days before anything runs out.</span></div></div>';

    const attention = '<section class="card emp-card">' +
      '<div class="card-head"><div><h2>Needs your attention</h2><p class="card-sub">Documents that expire soon or have expired</p></div>' +
      '<a class="text-link" href="#/me/documents">All documents</a></div>' +
      alertRows + '</section>';

    const ghostHeights = [60, 80, 20, 80, 70, 8, 8];
    const hours = '<article class="card emp-mini emp-soon">' +
      '<div class="emp-mini-top"><h3>Hours this week</h3><span class="chip chip-blue">Coming soon</span></div>' +
      '<div class="emp-ghost">' + ghostHeights.map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join('') + '</div>' +
      '<p class="emp-sub"><strong>Rossmann card-tap clock.</strong> Your hours will appear here automatically when you tap in and out with your staff card.</p>' +
      '</article>';

    const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const availabilityCard = '<article class="card emp-mini">' +
      '<div class="emp-mini-top"><h3>Availability</h3></div>' +
      '<p class="emp-sub">Next week, ' + shortDate(mondayIso) + ' ' + weekdayShort(mondayIso) + ' – ' + shortDate(sundayIso) + ' ' + weekdayShort(sundayIso) + '</p>' +
      '<div class="emp-days">' + days.map(function (label, index) {
        return '<button type="button" class="' + (availability[index] ? 'on' : '') + '" data-emp="day" data-day="' + index + '" aria-pressed="' + availability[index] + '">' + label + '</button>';
      }).join('') + '</div>' +
      '<p class="emp-sub">Tap a day to change it.</p>' +
      '</article>';

    const shift = '<article class="card emp-mini">' +
      '<div class="emp-mini-top"><h3>Next shift</h3></div>' +
      '<div class="emp-shift">' +
      '<div class="emp-cal"><b>' + weekdayShort(shiftIso).toUpperCase() + '</b><span>' + shortDate(shiftIso).slice(0, 2) + '</span></div>' +
      '<div><b class="time">06:00 – 14:00</b><span class="emp-sub">' + D.formatDate(shiftIso) + ' · Rossmann, ul. Marszałkowska 104, Warsaw</span></div>' +
      '</div>' +
      '<p class="emp-sub">Then: ' + weekdayShort(thenIso) + ' ' + shortDate(thenIso) + ' · 06:00 – 14:00 · 2 more this week</p>' +
      '</article>';

    return '<div class="emp-hello">' +
      '<span class="avatar avatar-lg">' + esc(D.initials(w.firstName, w.surname)) + '</span>' +
      '<div><h1>' + greeting() + ', ' + esc(w.firstName) + '</h1>' +
      '<p>' + D.formatDate(shiftDay, { weekday: 'long' }) + ', ' + D.formatDate(shiftDay) + ' · Rossmann store, Warsaw · via Where2Work sp. z o.o.</p></div>' +
      '</div>' +
      progress + attention +
      '<div class="emp-grid">' + shift + hours + availabilityCard + '</div>';
  }

  /* ------------------------------------------------------------ documents */

  function documentsView(w) {
    const docs = docsFor(w);
    const states = docs.map(docState);
    const counts = {
      all: docs.length,
      needs: states.filter(function (s) { return s.needs; }).length,
      valid: states.filter(function (s) { return !s.needs; }).length
    };
    const filtered = docs.filter(function (doc, index) {
      if (docFilter === 'needs') return states[index].needs;
      if (docFilter === 'valid') return !states[index].needs;
      return true;
    });

    const filters = [
      { key: 'all', label: 'All', count: counts.all },
      { key: 'needs', label: 'Needs action', count: counts.needs },
      { key: 'valid', label: 'Valid', count: counts.valid }
    ].map(function (f) {
      return '<button type="button" class="chip-filter' + (docFilter === f.key ? ' is-active' : '') + '" data-emp="doc-filter" data-value="' + f.key + '" aria-pressed="' + (docFilter === f.key) + '">' +
        f.label + '<span class="chip-count">' + f.count + '</span></button>';
    }).join('');

    const cards = filtered.map(function (doc) {
      const state = docState(doc);
      const uploading = busyDoc === doc.id;
      const actions = [];
      if (doc.upload !== false && !doc.noExpiry && !doc.receipt) {
        const primary = state.needs ? 'btn btn-primary' : 'btn';
        actions.push('<button type="button" class="' + primary + ' btn-small" data-emp="upload" data-doc="' + doc.id + '"' + (busyDoc ? ' disabled' : '') + '>' +
          (uploading ? 'Reading… ' + Math.round(busyPct * 100) + '%' : 'Upload new version') + '</button>');
      }
      actions.push('<button type="button" class="btn btn-small" data-emp="download">Download</button>');

      return '<article class="card emp-doc">' +
        '<div class="emp-doc-top">' + iconBox(doc.icon, state.tone) +
        '<div class="emp-doc-title"><strong>' + esc(doc.title) + '</strong><span>' + esc(doc.sub) + '</span>' +
        (doc.chip ? '<span class="chip chip-blue">' + esc(doc.chip) + '</span>' : '') + '</div>' +
        pill(state.pill, state.pillClass) + '</div>' +
        '<div class="emp-exp' + (state.boxTone ? ' ' + state.boxTone : '') + '"><span>' + state.box + '</span><small>' + esc(state.small) + '</small></div>' +
        '<div class="emp-actions">' + actions.join('') + '</div>' +
        '</article>';
    }).join('');

    return '<header class="page-head"><div class="page-head-main">' +
      '<p class="eyebrow">My account</p><h1>My documents</h1>' +
      '<p class="lede">Everything Where2Work holds for you, with the date each one runs out. We\'ll remind you 30 days before.</p>' +
      '</div></header>' +
      '<div class="card emp-autofill">' + iconBox('spark', 'blue') +
      '<span><strong>Snap a photo, we do the typing.</strong> When you upload a new passport or residence card, DocuFlow reads it and fills in your details for you to check.</span></div>' +
      '<div class="emp-filters">' + filters + '</div>' +
      (cards ? '<div class="emp-grid two">' + cards + '</div>' : '<div class="card"><div class="emp-note"><div class="emp-alert-main"><strong>Nothing in this filter</strong><p>Try another filter to see your documents.</p></div></div></div>');
  }

  /* -------------------------------------------------------- notifications */

  function todayNotes(w) {
    const notes = [];

    sessionEvents.forEach(function (event) {
      notes.push({
        id: event.id,
        icon: 'upload',
        tone: 'blue',
        title: event.title,
        body: event.body,
        meta: ''
      });
    });

    needingAction(w).forEach(function (doc) {
      const state = docState(doc);
      const expired = state.days < 0;
      notes.push({
        id: 'doc:' + doc.id,
        icon: 'warn',
        tone: state.tone,
        title: expired ? doc.title + ' has expired' : doc.title + ' expires in ' + state.days + (state.days === 1 ? ' day' : ' days'),
        body: expired
          ? 'It ran out on ' + D.formatDate(doc.date) + '. Upload the new one so you can keep working.'
          : 'Upload the new one before ' + D.formatDate(doc.date) + '.',
        link: true
      });
    });

    notes.push({
      id: 'signin',
      icon: 'shield',
      tone: 'blue',
      title: 'New sign-in on Chrome, Linux',
      body: 'Warsaw, Poland · 7 min ago',
      actions: true
    });

    return notes;
  }

  function noteMarkup(note) {
    const unread = !note.read && !readIds[note.id];
    const actions = [];
    if (note.link) {
      actions.push('<div class="emp-note-actions"><a class="text-link" href="#/me/documents">Upload new one</a></div>');
    }
    if (note.actions) {
      actions.push('<div class="emp-note-actions">' +
        '<button type="button" class="text-link" data-emp="signin">That was me</button>' +
        '<button type="button" class="text-link" style="color:var(--red)" data-emp="not-me">Not you? Secure account</button>' +
        '</div>');
    }
    return '<div class="emp-note' + (unread ? ' unread' : '') + '">' +
      iconBox(note.icon, note.tone) +
      '<div class="emp-alert-main"><strong>' + esc(note.title) + '</strong><p>' + esc(note.body) + '</p>' +
      (note.meta ? '<div class="emp-meta">' + esc(note.meta) + '</div>' : '') +
      actions.join('') + '</div>' +
      (unread ? '<span class="emp-udot"></span>' : '') +
      '</div>';
  }

  function earlierNotes(w) {
    return [
      {
        id: 'earlier:passport',
        icon: 'check',
        tone: 'green',
        title: 'Your passport was checked and approved',
        body: 'Your coordinator confirmed the details DocuFlow read from it.',
        meta: 'Yesterday, 11:42',
        read: true
      },
      {
        id: 'earlier:safari',
        icon: 'shield',
        tone: 'blue',
        title: 'New sign-in on Safari, iPhone',
        body: 'Warsaw, Poland · ' + D.formatDate(D.isoInDays(-5)) + ', 07:12',
        meta: '',
        read: true
      },
      {
        id: 'earlier:shifts',
        icon: 'cal',
        tone: '',
        title: "Next week's shifts are ready",
        body: '4 shifts at Rossmann, Marszałkowska',
        meta: D.formatDate(D.isoInDays(-6)),
        read: true
      }
    ];
  }

  function notificationsView(w) {
    const today = todayNotes(w);
    const earlier = earlierNotes(w);
    const unread = today.filter(function (n) { return !readIds[n.id]; });
    const all = today.length + earlier.length;
    const visibleToday = noteFilter === 'unread' ? unread : today;
    const visibleEarlier = noteFilter === 'unread' ? [] : earlier;

    const filters = [
      { key: 'all', label: 'All', count: all },
      { key: 'unread', label: 'Unread', count: unread.length }
    ].map(function (f) {
      return '<button type="button" class="chip-filter' + (noteFilter === f.key ? ' is-active' : '') + '" data-emp="note-filter" data-value="' + f.key + '" aria-pressed="' + (noteFilter === f.key) + '">' +
        f.label + '<span class="chip-count">' + f.count + '</span></button>';
    }).join('');

    let body = '';
    if (visibleToday.length) {
      body += '<p class="emp-group">Today</p><section class="card">' + visibleToday.map(noteMarkup).join('') + '</section>';
    }
    if (visibleEarlier.length) {
      body += '<p class="emp-group">Earlier</p><section class="card">' + visibleEarlier.map(noteMarkup).join('') + '</section>';
    }
    if (!visibleToday.length && !visibleEarlier.length) {
      body = '<section class="card"><div class="emp-note"><div class="emp-alert-main"><strong>You\'re all caught up</strong><p>No unread notifications.</p></div></div></section>';
    }

    return '<header class="page-head"><div class="page-head-main">' +
      '<p class="eyebrow">My account</p><h1>Notifications</h1>' +
      '<p class="lede">Reminders, document updates and sign-ins to your account.</p>' +
      '</div></header>' +
      '<div class="emp-filters">' + filters +
      '<a class="text-link" href="#/me/notifications" data-emp="mark-all" style="margin-left:auto">Mark all as read</a></div>' +
      body;
  }

  /* --------------------------------------------------------------- upload */

  function addFileName(w, name) {
    if (!name) return;
    w.documents = w.documents || [];
    if (w.documents.indexOf(name) < 0) w.documents.push(name);
  }

  function updateBusyButtons() {
    document.querySelectorAll('[data-emp="upload"]').forEach(function (button) {
      button.disabled = !!busyDoc;
      if (busyDoc && button.dataset.doc === busyDoc) {
        button.textContent = 'Reading… ' + Math.round(busyPct * 100) + '%';
      }
    });
  }

  function addSessionEvent(title, body) {
    sessionEvents.unshift({
      id: 'ev-' + Date.now().toString(36) + '-' + sessionEvents.length,
      title: title,
      body: body
    });
  }

  function saveAndToast(w, ctx, message) {
    w.status = D.computeStatus(w);
    D.saveWorkers(ctx.workers);
    rerender();
    ctx.toast(message);
  }

  function uploadDocument(file, docId) {
    const ctx = lastCtx;
    const w = me(ctx);
    if (!w) return;
    const doc = docsFor(w).find(function (d) { return d.id === docId; });
    if (!doc) return;
    if (busyDoc) return;

    busyDoc = docId;
    busyPct = 0;
    rerender();

    function fail(message) {
      busyDoc = null;
      busyPct = 0;
      rerender();
      ctx.toast(message, 'error');
    }

    if (doc.noOcr) {
      const iso = D.isoInDays(365);
      setField(w, doc.field, iso);
      addFileName(w, file.name);
      addSessionEvent('You uploaded a new ' + doc.title.toLowerCase(), 'Valid until ' + D.formatDate(iso) + ' · waiting for your coordinator to check');
      busyDoc = null;
      busyPct = 0;
      saveAndToast(w, ctx, doc.title + ' uploaded. Your coordinator will check it.');
      return;
    }

    OCR.readDocument(file, {
      onStatus: function (status) {
        if (busyDoc !== docId) return;
        busyPct = status && typeof status.progress === 'number' ? status.progress : 0;
        updateBusyButtons();
      }
    }).then(function (result) {
      if (result.kind !== doc.kind) {
        fail('That doesn\'t look like a ' + doc.expected + '. Nothing was changed.');
        return;
      }
      const fields = result.fields || {};
      const first = fields.firstName && fields.firstName.value ? String(fields.firstName.value).trim() : '';
      const last = fields.surname && fields.surname.value ? String(fields.surname.value).trim() : '';
      const nameMismatch =
        (first && first.toLowerCase() !== String(w.firstName || '').trim().toLowerCase()) ||
        (last && last.toLowerCase() !== String(w.surname || '').trim().toLowerCase());
      if (nameMismatch) {
        const who = [first, last].filter(Boolean).join(' ') || 'someone else';
        fail('This document belongs to ' + who + ', not you. Nothing was changed.');
        return;
      }

      const keys = doc.id === 'passport'
        ? ['passportNo', 'passportExpiry']
        : doc.id === 'residence'
          ? ['residenceCardExpiry']
          : ['forkliftLicenceNo', 'licenceExpiry'];
      let expiry = '';
      keys.forEach(function (key) {
        const field = fields[key];
        const value = field && field.value ? String(field.value).trim() : '';
        if (!value) return;
        setField(w, key, value);
        if (/Expiry$/.test(key)) expiry = value;
      });
      addFileName(w, result.fileName || file.name);
      addSessionEvent(
        'You uploaded a new ' + doc.title.toLowerCase(),
        (expiry ? 'Valid until ' + D.formatDate(expiry) + ' · ' : '') + 'waiting for your coordinator to check'
      );
      busyDoc = null;
      busyPct = 0;
      saveAndToast(w, ctx, doc.title + ' updated.' + (expiry ? ' Valid until ' + D.formatDate(expiry) + '.' : '') + ' Your coordinator will check it.');
    }).catch(function (err) {
      fail(err && err.message ? err.message : 'That file could not be read. Try a clearer photo.');
    });
  }

  /* -------------------------------------------------------------- editing */

  function saveEdit() {
    if (!editing) return;
    const ctx = lastCtx;
    const w = me(ctx);
    if (!w) return;
    const input = document.getElementById('emp-edit-input');
    const value = input ? String(input.value || '').trim() : '';
    setField(w, editing, value);
    editing = null;
    saveAndToast(w, ctx, 'Saved. Your coordinator can see this now.');
  }

  function copyValue(text) {
    const ctx = lastCtx;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        ctx.toast('Copied');
      }).catch(function () {
        ctx.toast('Could not copy', 'error');
      });
      return;
    }
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'absolute';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      ctx.toast('Copied');
    } catch (err) {
      ctx.toast('Could not copy', 'error');
    }
  }

  /* --------------------------------------------------------------- render */

  function tabbar(counts) {
    const items = [
      { key: 'home', href: '#/me', label: 'Home', icon: 'home' },
      { key: 'details', href: '#/me/details', label: 'Details', icon: 'user', count: counts.details, cls: 'c-blue' },
      { key: 'documents', href: '#/me/documents', label: 'Documents', icon: 'doc', count: counts.docs, cls: 'c-amber' },
      { key: 'notifications', href: '#/me/notifications', label: 'Alerts', icon: 'bell', count: counts.notes, cls: '' }
    ];
    return '<nav class="emp-tabbar" aria-label="My account">' + items.map(function (item) {
      return '<a href="' + item.href + '"' + (sub === item.key ? ' class="is-active" aria-current="page"' : '') + '>' +
        ICONS[item.icon] + item.label +
        (item.count ? '<span class="dot ' + item.cls + '">' + item.count + '</span>' : '') +
        '</a>';
    }).join('') + '</nav>';
  }

  function fileInput() {
    return '<input type="file" id="emp-file" class="sr-only" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf">';
  }

  function render(nextSub, ctx) {
    sub = nextSub || 'home';
    lastCtx = ctx;
    paintSidebarIcons();

    const w = me(ctx);
    if (!w) {
      setBadge('emp-count-details', 0);
      setBadge('emp-count-docs', 0);
      setBadge('emp-count-notes', 0);
      return '<section class="card"><div class="emp-note"><div class="emp-alert-main">' +
        '<strong>Demo employee not found</strong>' +
        '<p>Reset the demo data in Settings to bring Olena Kovalenko back.</p>' +
        '</div></div></section>' + fileInput() + tabbar({ details: 0, docs: 0, notes: 0 });
    }

    const counts = {
      details: missingFields(w).length,
      docs: needingAction(w).length,
      notes: todayNotes(w).filter(function (n) { return !readIds[n.id]; }).length
    };
    setBadge('emp-count-details', counts.details);
    setBadge('emp-count-docs', counts.docs);
    setBadge('emp-count-notes', counts.notes);

    let html;
    if (sub === 'details') html = detailsView(w);
    else if (sub === 'documents') html = documentsView(w);
    else if (sub === 'notifications') html = notificationsView(w);
    else html = homeView(w);

    return html + fileInput() + tabbar(counts);
  }

  function rerender() {
    const view = document.getElementById('view');
    if (!view || !lastCtx || !document.body.classList.contains('is-employee')) return;
    view.innerHTML = render(sub, lastCtx);
    if (editing) {
      const input = document.getElementById('emp-edit-input');
      if (input) {
        const section = input.closest('details');
        if (section) section.open = true;
        input.focus();
        if (input.tagName === 'INPUT' && input.setSelectionRange) {
          const end = input.value.length;
          input.setSelectionRange(end, end);
        }
      }
    }
  }

  /* --------------------------------------------------------------- events */

  document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-emp]');
    if (!el || !lastCtx) return;
    const action = el.dataset.emp;
    const ctx = lastCtx;
    const w = me(ctx);
    if (!w) return;

    if (action === 'copy') {
      let value = getField(w, el.dataset.key);
      if (el.dataset.key === 'p:iban' && !value) value = '';
      copyValue(String(value || ''));
    } else if (action === 'toggle-iban') {
      ibanShown = !ibanShown;
      rerender();
    } else if (action === 'edit') {
      editing = el.dataset.key;
      rerender();
    } else if (action === 'save') {
      saveEdit();
    } else if (action === 'cancel') {
      editing = null;
      rerender();
    } else if (action === 'upload') {
      if (busyDoc) return;
      pendingDoc = el.dataset.doc;
      const input = document.getElementById('emp-file');
      if (input) {
        input.value = '';
        input.click();
      }
    } else if (action === 'download') {
      ctx.toast('Demo only: files aren\'t stored in this demo.');
    } else if (action === 'doc-filter') {
      docFilter = el.dataset.value;
      rerender();
    } else if (action === 'note-filter') {
      noteFilter = el.dataset.value;
      rerender();
    } else if (action === 'mark-all') {
      event.preventDefault();
      todayNotes(w).forEach(function (note) { readIds[note.id] = true; });
      rerender();
    } else if (action === 'signin') {
      readIds.signin = true;
      rerender();
    } else if (action === 'not-me') {
      ctx.toast('Demo only: this would sign out every device and ask for a new password.');
    } else if (action === 'day') {
      const index = Number(el.dataset.day);
      availability[index] = !availability[index];
      rerender();
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target.id !== 'emp-file') return;
    const file = event.target.files && event.target.files[0];
    const docId = pendingDoc;
    pendingDoc = null;
    event.target.value = '';
    if (!file || !docId) return;
    uploadDocument(file, docId);
  });

  document.addEventListener('keydown', function (event) {
    if (!editing) return;
    if (event.target.id !== 'emp-edit-input') return;
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      editing = null;
      rerender();
    }
  });

  paintSidebarIcons();

  window.DocuFlowEmployee = { render: render };
})();
