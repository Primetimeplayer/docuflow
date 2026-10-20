/* DocuFlow — fictional demo data and storage helpers.
   Every person, number and document in this file is invented. */
(function (global) {
  'use strict';

  const STORE_KEY = 'docuflow_workers';

  const DAY = 86400000;

  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseISO(iso) {
    if (!iso) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function isoInDays(days) {
    const d = startOfToday();
    d.setDate(d.getDate() + days);
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function daysUntil(iso) {
    const d = parseISO(iso);
    if (!d) return null;
    return Math.round((d - startOfToday()) / DAY);
  }

  function formatDate(iso, opts) {
    const d = parseISO(iso);
    if (!d) return '—';
    if (opts) return new Intl.DateTimeFormat('en-GB', opts).format(d);
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function fullName(w) {
    return [w.firstName, w.surname].filter(Boolean).join(' ');
  }

  function initials(first, surname) {
    return ((first || ' ').trim()[0] || '') + ((surname || ' ').trim()[0] || '');
  }

  function formatMinutes(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return m + 'm';
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }

  function humanDays(days) {
    if (days === null || days === undefined) return '—';
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return days + ' days left';
  }

  function toneForDays(days) {
    if (days === null || days === undefined) return 'neutral';
    if (days < 0) return 'red';
    if (days < 14) return 'red';
    if (days <= 30) return 'amber';
    return 'green';
  }

  /* ---------------------------------------------------------------- seed */

  function seedWorkers() {
    return [
      {
        id: 'w-001',
        firstName: 'Olena',
        surname: 'Kovalenko',
        dob: '1991-06-14',
        nationality: 'Ukrainian',
        passportNo: 'FP2048571',
        passportExpiry: isoInDays(9),
        pesel: '91061412341',
        email: 'olena.kovalenko@example.com',
        fatherName: 'Petro Kovalenko',
        motherName: 'Iryna Kovalenko',
        forkliftLicenceNo: 'UDT/2024/01184',
        licenceExpiry: isoInDays(410),
        residenceCardExpiry: isoInDays(532),
        status: 'Expiring',
        documents: ['passport_FP2048571.pdf', 'residence-card_2026.jpg', 'forklift-licence_UDT-01184.pdf']
      },
      {
        id: 'w-002',
        firstName: 'Rajesh',
        surname: 'Kumar',
        dob: '1988-11-02',
        nationality: 'Indian',
        passportNo: 'K8421763',
        passportExpiry: isoInDays(1200),
        pesel: '88110212353',
        email: 'rajesh.kumar@example.com',
        fatherName: 'Suresh Kumar',
        motherName: 'Anita Kumar',
        forkliftLicenceNo: 'UDT/2026/01733',
        licenceExpiry: isoInDays(21),
        residenceCardExpiry: isoInDays(365),
        status: 'Expiring',
        documents: ['passport_K8421763.pdf', 'residence-card.jpg', 'forklift-licence_UDT-01733.pdf']
      },
      {
        id: 'w-003',
        firstName: 'Bishal',
        surname: 'Tamang',
        dob: '1995-02-19',
        nationality: 'Nepali',
        passportNo: 'PA7719042',
        passportExpiry: isoInDays(27),
        pesel: '95021912357',
        email: 'bishal.tamang@example.com',
        fatherName: 'Dhan Bahadur Tamang',
        motherName: 'Maya Tamang',
        forkliftLicenceNo: 'UDT/2025/00921',
        licenceExpiry: isoInDays(210),
        residenceCardExpiry: isoInDays(210),
        status: 'Expiring',
        documents: ['passport_PA7719042.jpg', 'residence-card.jpg', 'forklift-licence_UDT-00921.pdf']
      },
      {
        id: 'w-004',
        firstName: 'Camila',
        surname: 'Restrepo',
        dob: '1997-08-30',
        nationality: 'Colombian',
        passportNo: 'AX9920145',
        passportExpiry: isoInDays(780),
        pesel: '97083012345',
        email: 'camila.restrepo@example.com',
        fatherName: 'Jorge Restrepo',
        motherName: 'Luz Restrepo',
        forkliftLicenceNo: 'UDT/2026/01408',
        licenceExpiry: isoInDays(450),
        residenceCardExpiry: isoInDays(12),
        status: 'Expiring',
        documents: ['passport_AX9920145.pdf', 'residence-card-2026.jpg', 'forklift-licence_UDT-01408.pdf']
      },
      {
        id: 'w-005',
        firstName: 'Maria',
        surname: 'Santos',
        dob: '1993-04-07',
        nationality: 'Filipino',
        passportNo: 'P8827341',
        passportExpiry: isoInDays(900),
        pesel: '93040712345',
        email: 'maria.santos@example.com',
        fatherName: 'Rodrigo Santos',
        motherName: 'Elena Santos',
        forkliftLicenceNo: 'UDT/2023/00667',
        licenceExpiry: isoInDays(300),
        residenceCardExpiry: isoInDays(600),
        status: 'Complete',
        documents: ['passport_P8827341.pdf', 'residence-card.jpg', 'forklift-licence_UDT-00667.pdf']
      },
      {
        id: 'w-006',
        firstName: 'Andrzej',
        surname: 'Wiśniewski',
        dob: '1985-12-12',
        nationality: 'Polish',
        passportNo: 'ZS4821901',
        passportExpiry: isoInDays(1800),
        pesel: '85121212352',
        email: 'andrzej.wisniewski@example.com',
        fatherName: 'Krzysztof Wiśniewski',
        motherName: 'Barbara Wiśniewska',
        forkliftLicenceNo: 'UDT/2022/01872',
        licenceExpiry: isoInDays(95),
        residenceCardExpiry: '',
        status: 'Complete',
        documents: ['passport_ZS4821901.pdf', 'forklift-licence_UDT-01872.pdf']
      },
      {
        id: 'w-007',
        firstName: 'Priya',
        surname: 'Sharma',
        dob: '1996-09-23',
        nationality: 'Indian',
        passportNo: 'M2047815',
        passportExpiry: isoInDays(1500),
        pesel: '',
        email: 'priya.sharma@example.com',
        fatherName: 'Vijay Sharma',
        motherName: 'Meena Sharma',
        forkliftLicenceNo: '',
        licenceExpiry: '',
        residenceCardExpiry: isoInDays(400),
        status: 'Review',
        documents: ['passport_M2047815.jpg', 'residence-card.pdf']
      },
      {
        id: 'w-008',
        firstName: 'Sita',
        surname: 'Gurung',
        dob: '1999-01-15',
        nationality: 'Nepali',
        passportNo: 'PA6612904',
        passportExpiry: isoInDays(1100),
        pesel: '99011512349',
        email: 'sita.gurung@example.com',
        fatherName: 'Krishna Gurung',
        motherName: 'Gita Gurung',
        forkliftLicenceNo: 'UDT/2025/01255',
        licenceExpiry: isoInDays(160),
        residenceCardExpiry: isoInDays(250),
        status: 'Complete',
        documents: ['passport_PA6612904.pdf', 'residence-card.jpg', 'forklift-licence_UDT-01255.pdf']
      },
      {
        id: 'w-009',
        firstName: 'Diego',
        surname: 'Herrera',
        dob: '1990-05-08',
        nationality: 'Colombian',
        passportNo: 'AT1187422',
        passportExpiry: isoInDays(900),
        pesel: '90050812359',
        email: 'diego.herrera@example.com',
        fatherName: 'Carlos Herrera',
        motherName: 'Paula Herrera',
        forkliftLicenceNo: 'UDT/2024/00814',
        licenceExpiry: isoInDays(90),
        residenceCardExpiry: isoInDays(420),
        status: 'Complete',
        documents: ['passport_AT1187422.pdf', 'residence-card.jpg', 'forklift-licence_UDT-00814.pdf']
      },
      {
        id: 'w-010',
        firstName: 'Josefa',
        surname: 'Reyes',
        dob: '1987-03-27',
        nationality: 'Filipino',
        passportNo: 'P7721830',
        passportExpiry: isoInDays(2000),
        pesel: '87032712341',
        email: 'josefa.reyes@example.com',
        fatherName: 'Mario Reyes',
        motherName: 'Lourdes Reyes',
        forkliftLicenceNo: 'UDT/2023/02011',
        licenceExpiry: isoInDays(320),
        residenceCardExpiry: isoInDays(700),
        status: 'Complete',
        documents: ['passport_P7721830.jpg', 'residence-card.pdf', 'forklift-licence_UDT-02011.pdf']
      },
      {
        id: 'w-011',
        firstName: 'Mykola',
        surname: 'Shevchenko',
        dob: '1983-07-04',
        nationality: 'Ukrainian',
        passportNo: 'FP3318702',
        passportExpiry: isoInDays(600),
        pesel: '83070412355',
        email: 'mykola.shevchenko@example.com',
        fatherName: 'Ivan Shevchenko',
        motherName: 'Oksana Shevchenko',
        forkliftLicenceNo: 'UDT/2022/00476',
        licenceExpiry: isoInDays(65),
        residenceCardExpiry: isoInDays(190),
        status: 'Complete',
        documents: ['passport_FP3318702.pdf', 'residence-card.jpg', 'forklift-licence_UDT-00476.pdf']
      },
      {
        id: 'w-012',
        firstName: 'Anita',
        surname: 'Yadav',
        dob: '2000-10-11',
        nationality: 'Indian',
        passportNo: 'M9912384',
        passportExpiry: isoInDays(1400),
        pesel: '00301112345',
        email: 'anita.yadav@example.com',
        fatherName: 'Ramesh Yadav',
        motherName: 'Sunita Yadav',
        forkliftLicenceNo: '',
        licenceExpiry: '',
        residenceCardExpiry: '',
        status: 'Review',
        documents: ['passport_M9912384.pdf']
      }
    ];
  }

  /* ------------------------------------------------------------- storage */

  function loadWorkers() {
    try {
      const raw = global.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(function (w) { w.status = computeStatus(w); return w; });
      }
    } catch (err) {
      console.warn('DocuFlow: could not read local records.', err);
    }
    const seeded = seedWorkers().map(function (w) { w.status = computeStatus(w); return w; });
    try {
      global.localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
    } catch (err) {
      console.warn('DocuFlow: localStorage is unavailable, using memory only.', err);
    }
    return seeded;
  }

  function saveWorkers(workers) {
    try {
      global.localStorage.setItem(STORE_KEY, JSON.stringify(workers));
      return true;
    } catch (err) {
      console.warn('DocuFlow: could not persist records.', err);
      return false;
    }
  }

  function nextId() {
    return 'w-' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }

  function cloneWorker(w) {
    return JSON.parse(JSON.stringify(w));
  }

  function createWorker(fields) {
    const w = {
      id: nextId(),
      firstName: fields.firstName || '',
      surname: fields.surname || '',
      dob: fields.dob || '',
      nationality: fields.nationality || '',
      passportNo: fields.passportNo || '',
      passportExpiry: fields.passportExpiry || '',
      pesel: fields.pesel || '',
      email: fields.email || '',
      fatherName: fields.fatherName || '',
      motherName: fields.motherName || '',
      forkliftLicenceNo: fields.forkliftLicenceNo || '',
      licenceExpiry: fields.licenceExpiry || '',
      residenceCardExpiry: fields.residenceCardExpiry || '',
      status: 'Complete',
      documents: (fields.documents || []).slice()
    };
    w.status = computeStatus(w);
    return w;
  }

  function computeStatus(w) {
    const dates = [w.passportExpiry, w.licenceExpiry, w.residenceCardExpiry];
    const soon = dates.some((d) => {
      const n = daysUntil(d);
      return n !== null && n <= 30;
    });
    if (soon) return 'Expiring';
    const missingCore = !w.firstName || !w.surname || !w.passportNo || !w.passportExpiry || !w.pesel || (w.nationality !== 'Polish' && !w.residenceCardExpiry);
    if (missingCore) return 'Review';
    return 'Complete';
  }

  /* --------------------------------------------------------------- expiries */

  const EXPIRY_TYPES = [
    { field: 'passportExpiry', type: 'Passport', short: 'passport', plural: 'passports', numberField: 'passportNo' },
    { field: 'residenceCardExpiry', type: 'Visa or residence card', short: 'visa', plural: 'visas', numberField: null },
    { field: 'licenceExpiry', type: 'Forklift licence', short: 'forklift', plural: 'forklifts', numberField: 'forkliftLicenceNo' }
  ];

  function expiryItems(workers) {
    const items = [];
    workers.forEach((w) => {
      EXPIRY_TYPES.forEach((t) => {
        const iso = w[t.field];
        const days = daysUntil(iso);
        if (!iso || days === null) return;
        items.push({
          workerId: w.id,
          worker: w,
          field: t.field,
          type: t.type,
          short: t.short,
          number: t.numberField ? w[t.numberField] : '',
          date: iso,
          days: days
        });
      });
    });
    return items.sort((a, b) => a.days - b.days);
  }

  function expiryBreakdown(items, withinDays) {
    const counts = { passport: 0, visa: 0, forklift: 0 };
    items.forEach((i) => {
      if (i.days <= withinDays) counts[i.short] = (counts[i.short] || 0) + 1;
    });
    const parts = [];
    if (counts.passport) parts.push(counts.passport + ' ' + (counts.passport === 1 ? 'passport' : 'passports'));
    if (counts.visa) parts.push(counts.visa + ' ' + (counts.visa === 1 ? 'visa' : 'visas'));
    if (counts.forklift) parts.push(counts.forklift + ' ' + (counts.forklift === 1 ? 'forklift' : 'forklifts'));
    return parts.join(' · ');
  }

  function peselInfo(pesel, dob) {
    const digits = String(pesel || '').replace(/\D/g, '');
    if (digits.length !== 11) {
      return { state: 'empty', message: 'PESEL is 11 digits', valid: false };
    }
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * weights[i];
    const check = (10 - (sum % 10)) % 10;
    const valid = check === Number(digits[10]);
    let month = Number(digits.slice(2, 4));
    let year = Number(digits.slice(0, 2));
    if (month > 80) { month -= 80; year += 1800; }
    else if (month > 60) { month -= 60; year += 2200; }
    else if (month > 40) { month -= 40; year += 2100; }
    else if (month > 20) { month -= 20; year += 2000; }
    else { year += 1900; }
    const day = Number(digits.slice(4, 6));
    const p = (n) => String(n).padStart(2, '0');
    const parsedDob = year + '-' + p(month) + '-' + p(day);
    const dateValid = month >= 1 && month <= 12 && day >= 1 && day <= 31;
    const dobMatches = !dob || parsedDob === dob;
    return {
      state: valid && dateValid && dobMatches ? 'valid' : 'invalid',
      valid: valid && dateValid && dobMatches,
      checksumValid: valid,
      dateValid,
      dobMatches,
      parsedDob: dateValid ? parsedDob : '',
      message: !valid
        ? 'Check digit doesn’t match — please check the number'
        : !dateValid
          ? 'Date encoded in PESEL is not valid'
          : !dobMatches
            ? 'PESEL date doesn’t match the date of birth'
            : 'Valid checksum'
    };
  }

  global.DocuFlowData = {
    STORE_KEY,
    loadWorkers,
    saveWorkers,
    seedWorkers,
    createWorker,
    cloneWorker,
    computeStatus,
    nextId,
    expiryItems,
    expiryBreakdown,
    EXPIRY_TYPES,
    daysUntil,
    formatDate,
    isoInDays,
    parseISO,
    fullName,
    initials,
    formatMinutes,
    humanDays,
    toneForDays,
    peselInfo
  };
})(window);
