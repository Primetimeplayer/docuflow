/* DocuFlow — workspace settings, roles and audit log (localStorage). Fictional data only. */
(function (global) {
  'use strict';

  const KEY = 'docuflow_settings';
  const LOG_KEY = 'docuflow_audit';
  const ME = 'Anna Kowalska';

  const DEFAULTS = {
    org: {
      name: 'Where2Work sp. z o.o.',
      short: 'Where2Work',
      initials: 'W2',
      coordinator: 'u-anna',
      workplaces: ['Rossmann · Warsaw, ul. Marszałkowska 104', 'Rossmann · Warsaw, Galeria Mokotów', 'Rossmann · Kraków, Galeria Krakowska', 'Rossmann distribution centre · Łódź']
    },
    users: [
      { id: 'u-anna', name: 'Anna Kowalska', email: 'anna.kowalska@where2work.example', phone: '+48 600 100 200', role: 'Admin', status: 'Active' },
      { id: 'u-piotr', name: 'Piotr Nowak', email: 'piotr.nowak@where2work.example', phone: '+48 600 100 201', role: 'Recruiter', status: 'Active' },
      { id: 'u-magda', name: 'Magdalena Zielińska', email: 'magdalena.zielinska@where2work.example', phone: '+48 600 100 202', role: 'Recruiter', status: 'Active' },
      { id: 'u-tomasz', name: 'Tomasz Wójcik', email: 'tomasz.wojcik@rossmann.example', phone: '', role: 'Viewer', status: 'Active' }
    ],
    viewAs: 'Admin',
    restoreBy: 'admin-recruiter',
    required: {
      nonEu: ['passport', 'residence', 'pesel', 'dob', 'nationality', 'email'],
      eu: ['passport', 'pesel', 'dob', 'nationality', 'email']
    },
    expiry: { days: 30, notify: ['coordinator', 'worker'], employeeReminders: true },
    ocr: { threshold: 80, types: ['jpg', 'png', 'pdf'], maxMb: 10 },
    notify: { review: { app: true, email: false }, expiry: { app: true, email: true }, digest: { app: false, email: true } },
    privacy: {
      retentionYears: 10,
      mask: ['pesel', 'passportNo'],
      consent: 'Where2Work sp. z o.o. is the controller of your personal data. We use it to employ you and place you with our client Rossmann (RODO art. 6(1)(b) and (c)). Only your coordinator and authorised Where2Work staff can see it. You can ask to see, correct or limit your data at any time through your coordinator.'
    },
    security: { twoFactor: true, timeout: 30 },
    appearance: { theme: 'light', lang: 'en' }
  };

  /* Required items: one key can stand for several record fields. */
  const ITEMS = [
    { key: 'passport', label: 'Passport', group: 'doc', fields: [['passportNo', 'Passport number'], ['passportExpiry', 'Passport expiry']] },
    { key: 'residence', label: 'Residence card', group: 'doc', fields: [['residenceCardExpiry', 'Residence card expiry']] },
    { key: 'pesel', label: 'PESEL', group: 'doc', fields: [['pesel', 'PESEL']] },
    { key: 'licence', label: 'Forklift licence', group: 'doc', fields: [['forkliftLicenceNo', 'Forklift licence no.'], ['licenceExpiry', 'Licence expiry']] },
    { key: 'dob', label: 'Date of birth', group: 'field', fields: [['dob', 'Date of birth']] },
    { key: 'nationality', label: 'Nationality', group: 'field', fields: [['nationality', 'Nationality']] },
    { key: 'email', label: 'Email', group: 'field', fields: [['email', 'Email']] },
    { key: 'parents', label: "Father's and mother's names", group: 'field', fields: [['fatherName', "Father's name"], ['motherName', "Mother's name"]] }
  ];
  /* Order used in the Missing information report. */
  const ORDER = ['firstName', 'surname', 'dob', 'nationality', 'passportNo', 'passportExpiry', 'pesel', 'email', 'residenceCardExpiry', 'forkliftLicenceNo', 'licenceExpiry', 'fatherName', 'motherName'];
  const EU = ['Austrian', 'Belgian', 'Bulgarian', 'Croatian', 'Cypriot', 'Czech', 'Danish', 'Dutch', 'Estonian', 'Finnish', 'French', 'German', 'Greek', 'Hungarian', 'Irish', 'Italian', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Maltese', 'Polish', 'Portuguese', 'Romanian', 'Slovak', 'Slovenian', 'Spanish', 'Swedish'];

  const PERMS = {
    edit: ['Admin', 'Recruiter'],
    verify: ['Admin', 'Recruiter'],
    export: ['Admin'],
    settings: ['Admin']
  };

  let data = load();

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function load() {
    let saved = {};
    try { saved = JSON.parse(global.localStorage.getItem(KEY) || '{}') || {}; } catch (err) { saved = {}; }
    const out = clone(DEFAULTS);
    Object.keys(saved).forEach(function (k) {
      if (saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k]) && out[k] && !Array.isArray(out[k])) Object.assign(out[k], saved[k]);
      else out[k] = saved[k];
    });
    return out;
  }
  function persist() { try { global.localStorage.setItem(KEY, JSON.stringify(data)); } catch (err) { /* memory only */ } }
  function get(path) { return path.split('.').reduce(function (o, k) { return o === undefined || o === null ? undefined : o[k]; }, data); }
  function set(path, value, note) {
    const keys = path.split('.');
    let o = data;
    keys.slice(0, -1).forEach(function (k) { o[k] = o[k] || {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
    persist();
    if (note) log(note);
    apply();
  }
  function reset() { data = clone(DEFAULTS); persist(); log('Restored default settings'); apply(); }

  /* ------------------------------------------------------------ audit */
  function auditLog() { try { return JSON.parse(global.localStorage.getItem(LOG_KEY) || '[]'); } catch (err) { return []; } }
  function log(action) {
    const list = auditLog();
    list.unshift({ at: new Date().toISOString(), by: ME + ' (' + role() + ')', action: action });
    try { global.localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 200))); } catch (err) { /* ignore */ }
  }
  function clearLog() { try { global.localStorage.removeItem(LOG_KEY); } catch (err) { /* ignore */ } }

  /* ------------------------------------------------------------ roles */
  function role() { return ['Admin', 'Recruiter', 'Viewer'].indexOf(data.viewAs) >= 0 ? data.viewAs : 'Admin'; }
  function can(action) {
    const r = role();
    if (action === 'restore') return r === 'Admin' || (r === 'Recruiter' && data.restoreBy === 'admin-recruiter');
    if (action === 'unmasked') return r !== 'Viewer';
    return (PERMS[action] || []).indexOf(r) >= 0;
  }
  function mask(key, value) {
    const v = String(value || '');
    if (!v || can('unmasked') || data.privacy.mask.indexOf(key) < 0) return v;
    if (key === 'pesel') return '•••••••' + v.slice(-4);
    if (key === 'passportNo') return v.slice(0, 2) + '•••••' + v.slice(-2);
    if (key === 'dob') return '••.••.' + v.slice(0, 4);
    return '••••';
  }
  function coordinator() {
    return data.users.find(function (u) { return u.id === data.org.coordinator; }) || data.users[0];
  }

  /* -------------------------------------------------------- completeness */
  function isEu(nationality) { return EU.indexOf(String(nationality || '').trim()) >= 0; }
  function requiredItems(worker) { return data.required[isEu(worker.nationality) ? 'eu' : 'nonEu'] || []; }
  function missingFor(worker) {
    const want = { firstName: 'First name', surname: 'Surname' };
    ITEMS.forEach(function (item) {
      if (requiredItems(worker).indexOf(item.key) >= 0) item.fields.forEach(function (f) { want[f[0]] = f[1]; });
    });
    return ORDER.filter(function (k) { return want[k] && !String(worker[k] || '').trim(); }).map(function (k) { return want[k]; });
  }
  function expiryDays() { return Number(data.expiry.days) || 30; }

  /* ---------------------------------------------------------------- files */
  const TYPES = { jpg: { label: 'JPG', ext: ['.jpg', '.jpeg'], mime: ['image/jpeg'] }, png: { label: 'PNG', ext: ['.png'], mime: ['image/png'] }, pdf: { label: 'PDF', ext: ['.pdf'], mime: ['application/pdf'] } };
  function accept() {
    return data.ocr.types.reduce(function (all, t) { return TYPES[t] ? all.concat(TYPES[t].ext, TYPES[t].mime) : all; }, []).join(',');
  }
  function typesLabel() {
    const labels = data.ocr.types.map(function (t) { return TYPES[t].label; });
    return labels.length > 1 ? labels.slice(0, -1).join(', ') + ' or ' + labels[labels.length - 1] : (labels[0] || 'No file types');
  }
  function checkFile(file) {
    const name = String(file && file.name || '').toLowerCase();
    const type = Object.keys(TYPES).find(function (t) {
      return TYPES[t].ext.some(function (e) { return name.endsWith(e); }) || TYPES[t].mime.indexOf(file && file.type) >= 0;
    });
    if (!type || data.ocr.types.indexOf(type) < 0) {
      return (type ? TYPES[type].label + ' files are' : 'This file type is') + ' not allowed. Allowed: ' + typesLabel() + ' (Settings → OCR & review).';
    }
    if (file.size > data.ocr.maxMb * 1048576) return 'This file is larger than ' + data.ocr.maxMb + ' MB. Upload a smaller photo or scan.';
    return '';
  }

  /* ------------------------------------------------------ language & theme */
  const DICT = {
    'Workspace': ['Obszar roboczy', 'Робочий простір'],
    'Dashboard': ['Pulpit', 'Панель'],
    'Workers': ['Pracownicy', 'Працівники'],
    'Documents': ['Dokumenty', 'Документи'],
    'Expiry alerts': ['Alerty ważności', 'Терміни дії'],
    'Reports': ['Raporty', 'Звіти'],
    'Account': ['Konto', 'Обліковий запис'],
    'Settings': ['Ustawienia', 'Налаштування'],
    'Me': ['Moje konto', 'Мій профіль'],
    'Home': ['Start', 'Головна'],
    'My details': ['Moje dane', 'Мої дані'],
    'My documents': ['Moje dokumenty', 'Мої документи'],
    'Notifications': ['Powiadomienia', 'Сповіщення'],
    'Details': ['Dane', 'Дані'],
    'Alerts': ['Alerty', 'Нагадування'],
    'My account': ['Moje konto', 'Мій профіль'],
    'Switch to employee view': ['Widok pracownika', 'Вигляд працівника'],
    'Switch to recruiter view': ['Widok rekrutera', 'Вигляд рекрутера'],
    'Upload documents': ['Dodaj dokumenty', 'Завантажити документи'],
    'Overview': ['Przegląd', 'Огляд'],
    'Records': ['Ewidencja', 'Облік'],
    'Compliance': ['Zgodność', 'Відповідність'],
    'New worker': ['Nowy pracownik', 'Новий працівник'],
    'Worker record': ['Kartoteka pracownika', 'Картка працівника'],
    'Document review': ['Weryfikacja dokumentu', 'Перевірка документа'],
    'Page not found': ['Nie znaleziono strony', 'Сторінку не знайдено'],
    'Workspace settings': ['Ustawienia obszaru', 'Налаштування простору'],
    'Organisation': ['Organizacja', 'Організація'],
    'Users & roles': ['Użytkownicy i role', 'Користувачі та ролі'],
    'Required documents': ['Wymagane dokumenty', 'Обовʼязкові документи'],
    'Expiry reminders': ['Przypomnienia o ważności', 'Нагадування про термін дії'],
    'OCR & review': ['OCR i weryfikacja', 'OCR і перевірка'],
    'Data & privacy': ['Dane i prywatność', 'Дані та конфіденційність'],
    'Security': ['Bezpieczeństwo', 'Безпека'],
    'Appearance & language': ['Wygląd i język', 'Вигляд і мова'],
    'About': ['O aplikacji', 'Про програму'],
    'Fictional data only · Nothing is saved until a person confirms': ['Wyłącznie fikcyjne dane · Nic nie zostanie zapisane bez potwierdzenia', 'Лише вигадані дані · Нічого не зберігається без підтвердження']
  };
  function lang() { return ['en', 'pl', 'uk'].indexOf(data.appearance.lang) >= 0 ? data.appearance.lang : 'en'; }
  function t(text) {
    const row = DICT[text];
    const l = lang();
    return row && l !== 'en' ? row[l === 'pl' ? 0 : 1] : text;
  }
  function apply() {
    const root = document.documentElement;
    const theme = data.appearance.theme === 'system'
      ? (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : data.appearance.theme;
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    root.setAttribute('lang', lang());
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#070d1f' : '#0b1530');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (!el.dataset.i18nEn) el.dataset.i18nEn = el.textContent.trim();
      el.textContent = t(el.dataset.i18nEn);
    });
    document.body.dataset.role = role().toLowerCase();
  }
  if (global.matchMedia) {
    const mq = global.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function () { if (data.appearance.theme === 'system') apply(); });
  }
  apply();

  global.DocuFlowSettings = {
    DEFAULTS: DEFAULTS, ITEMS: ITEMS, get: get, set: set, reset: reset, all: function () { return clone(data); },
    log: log, auditLog: auditLog, clearLog: clearLog,
    role: role, can: can, mask: mask, coordinator: coordinator, me: ME,
    isEu: isEu, requiredItems: requiredItems, missingFor: missingFor, expiryDays: expiryDays,
    accept: accept, typesLabel: typesLabel, checkFile: checkFile,
    t: t, lang: lang, apply: apply
  };
})(window);
