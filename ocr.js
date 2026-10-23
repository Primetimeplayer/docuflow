/* DocuFlow — local document reader.
   Tesseract.js and pdf.js are the only external assets. Everything else,
   including the sample documents, is generated on this device. */
(function (global) {
  'use strict';

  const CDN = {
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    pdfWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
  };

  const SAMPLE = {
    passport: {
      label: 'Passport',
      mrz: [
        'P<UKRKOVALENKO<<IRYNA<<<<<<<<<<<<<<<<<<<<<<<',
        'FP48291633UKR9403121F2908214<<<<<<<<<<<<<<06'
      ]
    },
    licence: {
      label: 'Forklift licence',
      text: [
        'FORKLIFT OPERATOR LICENCE',
        'UDT — Urzad Dozoru Technicznego',
        'NAME: IRYNA KOVALENKO',
        'LICENCE No: UDT/2026/02417',
        'DATE OF ISSUE: 04.02.2026',
        'VALID UNTIL: 14.05.2029'
      ].join('\n')
    },
    residence: {
      label: 'Residence card',
      text: [
        'RESIDENCE CARD',
        'KARTA POBYTU',
        'SURNAME: KOVALENKO',
        'GIVEN NAMES: IRYNA',
        'NATIONALITY: UKRAINIAN',
        'PESEL: 94031212345',
        'DATE OF BIRTH: 12.03.1994',
        'VALID UNTIL: 12.03.2028'
      ].join('\n')
    }
  };

  /* ------------------------------------------------------------- utilities */

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function isoDate(y, m, d) {
    return y + '-' + pad2(m) + '-' + pad2(d);
  }

  function validIso(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return '';
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return isoDate(y, m, d);
  }

  function titleCase(value) {
    return String(value)
      .toLowerCase()
      .replace(/(^|[\s'-])([a-zà-ÿā-ž])/g, (m, sep, ch) => sep + ch.toUpperCase());
  }

  function mrzDate(value, birth) {
    if (!/^\d{6}$/.test(value)) return '';
    const yy = Number(value.slice(0, 2));
    const mm = Number(value.slice(2, 4));
    const dd = Number(value.slice(4, 6));
    let year = 2000 + yy;
    if (birth) {
      const currentYY = new Date().getFullYear() % 100;
      year = yy > currentYY ? 1900 + yy : 2000 + yy;
    }
    return validIso(year, mm, dd);
  }

  /* ICAO 9303 check digit: digits keep value, A=10 … Z=35, '<'=0,
     weights 7,3,1 repeating. */
  const CHECK_WEIGHTS = [7, 3, 1];

  function checkDigit(input) {
    let total = 0;
    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      let value = 0;
      if (ch >= '0' && ch <= '9') value = Number(ch);
      else if (ch >= 'A' && ch <= 'Z') value = ch.charCodeAt(0) - 55;
      total += value * CHECK_WEIGHTS[i % 3];
    }
    return String(total % 10);
  }

  /* OCR often confuses characters in the numeric blocks of an MRZ. */
  function repairNumeric(value) {
    return value.replace(/[OQD]/g, '0').replace(/[IL]/g, '1').replace(/Z/g, '2').replace(/S/g, '5').replace(/B/g, '8').replace(/G/g, '6');
  }

  function normalizeMrzLine(line, numericRanges) {
    let out = String(line).toUpperCase().replace(/[«»]/g, '<').replace(/[^A-Z0-9<]/g, '');
    if (out.length > 44) out = out.slice(0, 44);
    if (out.length < 44) out = out.padEnd(44, '<');
    if (numericRanges) {
      const chars = out.split('');
      numericRanges.forEach((range) => {
        for (let i = range[0]; i <= range[1]; i += 1) {
          if (chars[i] !== '<' && !/[0-9]/.test(chars[i])) {
            chars[i] = repairNumeric(chars[i]);
          }
        }
      });
      out = chars.join('');
    }
    return out;
  }

  const MRZ_NUMERIC = [[9, 9], [13, 19], [21, 27], [42, 43]];

  function extractMrz(text) {
    const lines = String(text || '')
      .toUpperCase()
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, '').replace(/[«»]/g, '<'))
      .filter(Boolean);

    const numericRanges = MRZ_NUMERIC;
    let start = -1;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (/^P[A-Z<][A-Z<]{3}[A-Z<]*<<[A-Z<]/.test(lines[i]) && lines[i].length >= 30) { start = i; break; }
    }

    if (start >= 0) {
      const line1 = normalizeMrzLine(lines[start], null);
      const candidates = [lines[start + 1], lines[start + 2], lines.slice(start + 1).join('')];
      for (const candidate of candidates) {
        if (!candidate) continue;
        if (candidate.length < 30 || !/[A-Z]/.test(candidate) || !/\d/.test(candidate)) continue;
        const line2 = normalizeMrzLine(candidate, numericRanges);
        if (/^[A-Z0-9<]{44}$/.test(line2)) return [line1, line2];
      }
    }

    /* Fallback: the two 44-character lines may have been merged. */
    const compact = lines.join('').replace(/[^A-Z0-9<]/g, '');
    const at = compact.indexOf('P<');
    if (at >= 0 && compact.length >= at + 88) {
      const line1 = normalizeMrzLine(compact.slice(at, at + 44), null);
      const line2 = normalizeMrzLine(compact.slice(at + 44, at + 88), numericRanges);
      if (/^P</.test(line1) && /\d/.test(line2)) return [line1, line2];
    }
    return null;
  }

  const NATIONALITIES = {
    UKR: 'Ukrainian', IND: 'Indian', NPL: 'Nepali', COL: 'Colombian', PHL: 'Filipino',
    POL: 'Polish', PAK: 'Pakistani', BGD: 'Bangladeshi', NGA: 'Nigerian', GEO: 'Georgian',
    MDA: 'Moldovan', BLR: 'Belarusian', ROU: 'Romanian', VNM: 'Vietnamese', IDN: 'Indonesian'
  };

  function parseMrz(lines) {
    if (!lines || lines.length < 2) return null;
    const line1 = normalizeMrzLine(lines[0], null);
    const line2 = normalizeMrzLine(lines[1], MRZ_NUMERIC);
    if (line1.slice(0, 2) !== 'P<' || line2.length !== 44) return null;

    const issuing = line1.slice(2, 5).replace(/</g, '');
    const names = line1.slice(5);
    const split = names.indexOf('<<');
    if (split < 0) return null;
    const surname = names.slice(0, split).replace(/</g, ' ').replace(/\s+/g, ' ').trim();
    const given = names.slice(split + 2).split('<<')[0].replace(/</g, ' ').replace(/\s+/g, ' ').trim();
    if (!surname || !given) return null;

    const number = line2.slice(0, 9).replace(/</g, '');
    const numberCheck = checkDigit(line2.slice(0, 9)) === line2[9];
    const nationalityCode = line2.slice(10, 13).replace(/</g, '');
    const birthRaw = line2.slice(13, 19);
    const birthCheck = checkDigit(birthRaw) === line2[19];
    const sexChar = line2[20];
    const expiryRaw = line2.slice(21, 27);
    const expiryCheck = checkDigit(expiryRaw) === line2[27];
    const personal = line2.slice(28, 42);
    const personalCheck = checkDigit(personal) === line2[42] || (/^<+$/.test(personal) && line2[42] === '<');
    const composite = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 28) + line2.slice(28, 43);
    const compositeCheck = checkDigit(composite) === line2[43];

    const dob = mrzDate(birthRaw, true);
    const expiry = mrzDate(expiryRaw, false);
    const nationality = NATIONALITIES[nationalityCode] || '';
    const source = 'Passport';

    const checks = [
      { name: 'Passport number', passed: numberCheck },
      { name: 'Date of birth', passed: birthCheck },
      { name: 'Expiry date', passed: expiryCheck },
      { name: 'Personal number', passed: personalCheck },
      { name: 'Composite', passed: compositeCheck }
    ];
    const passed = checks.filter((c) => c.passed).length;

    const fields = {};
    fields.surname = { value: titleCase(surname), confidence: numberCheck ? 95 : 60, source };
    fields.firstName = { value: titleCase(given), confidence: numberCheck ? 95 : 60, source };
    fields.passportNo = { value: number, confidence: numberCheck ? 95 : 60, source };
    fields.dob = dob ? { value: dob, confidence: birthCheck ? 95 : 60, source } : { value: '', confidence: 60, source };
    fields.passportExpiry = expiry ? { value: expiry, confidence: expiryCheck ? 95 : 60, source } : { value: '', confidence: 60, source };
    fields.nationality = nationality
      ? { value: nationality, confidence: 95, source }
      : { value: nationalityCode, confidence: 60, source, note: 'Country code only' };
    fields.sex = { value: sexChar === 'F' ? 'F' : sexChar === 'M' ? 'M' : '', confidence: 95, source };
    fields.issuingCountry = { value: issuing, confidence: 95, source };
    /* raw = how the value is printed in the MRZ; check = its own check digit. */
    fields.surname.raw = surname; fields.firstName.raw = given; fields.nationality.raw = nationalityCode;
    fields.passportNo.raw = number; fields.passportNo.check = numberCheck;
    fields.dob.raw = birthRaw; fields.dob.check = birthCheck;
    fields.passportExpiry.raw = expiryRaw; fields.passportExpiry.check = expiryCheck;

    return {
      kind: 'passport',
      typeLabel: 'Passport detected',
      fields,
      checks,
      checksPassed: passed,
      checksTotal: checks.length,
      mrz: [line1, line2]
    };
  }

  /* PESEL: 11 digits, weights 1,3,7,9,1,3,7,9,1,3 for the first ten. */
  const PESEL_SKIP = /\b(tel|telefon|phone|fax|faks|e-?mail|nr\s+dokumentu|identyfikator|wniosk|znak\s+sprawy|transak|konto|account|ref)/i;

  function parsePesel(text, dob) {
    const lines = String(text || '').split(/\r?\n/);
    let labelled = null, labelledBad = null, loose = null;
    lines.forEach(function (line, i) {
      if (PESEL_SKIP.test(line)) return;
      const nearLabel = /pesel/i.test(line) || (i > 0 && /pesel/i.test(lines[i - 1])) || (i > 1 && /pesel/i.test(lines[i - 2]));
      const re = /(?:^|[^0-9])([0-9]{11})(?![0-9])/g;
      const compact = line.replace(/\s+/g, '');
      let m;
      while ((m = re.exec(compact))) {
        const info = global.DocuFlowData.peselInfo(m[1], '');
        const ok = info.checksumValid && info.dateValid;
        if (nearLabel && ok && !labelled) labelled = m[1];
        else if (nearLabel && !ok && !labelledBad) labelledBad = m[1];
        else if (!nearLabel && ok && !loose) loose = m[1];
      }
    });
    const number = labelled || loose || labelledBad;
    if (!number) return null;
    const info = global.DocuFlowData.peselInfo(number, dob || '');
    const valid = number !== labelledBad;
    const note = valid ? (info.dobMatches ? 'Valid checksum' : info.message) : 'Check digit doesn’t match — please check the number';
    const confidence = valid ? (info.dobMatches ? 95 : 60) : 40;
    return {
      value: number, valid, sex: Number(number[9]) % 2 === 0 ? 'F' : 'M', info,
      fields: {
        pesel: { value: number, confidence, source: 'PESEL', note },
        dob: valid && info.parsedDob ? { value: info.parsedDob, confidence: 95, source: 'PESEL' } : null
      }
    };
  }

  const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

  function parseDateToken(token) {
    let m = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/.exec(token);
    if (m) return validIso(Number(m[3]), Number(m[2]), Number(m[1]));
    m = /^(\d{1,2})\s+([A-Z]{3})[A-Z]*\s+(\d{4})$/.exec(token.toUpperCase());
    if (m && MONTHS[m[2]]) return validIso(Number(m[3]), MONTHS[m[2]], Number(m[1]));
    return '';
  }

  const DATE_TOKEN = /(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/;
  const EXPIRY_LABEL = /(valid\s+until|date\s+of\s+expiry|expiry\s+date|expires|wa[zż]n[ae]\s+do|data\s+wa[zż]no[śs]ci)/i;

  function labelledDate(text, labelRe) {
    const lines = String(text || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (!labelRe.test(lines[i])) continue;
      const own = DATE_TOKEN.exec(lines[i]);
      if (own) {
        const iso = parseDateToken(own[1]);
        if (iso) return iso;
      }
      for (let j = 1; j <= 2 && i + j < lines.length; j += 1) {
        const next = DATE_TOKEN.exec(lines[i + j]);
        if (next) {
          const iso = parseDateToken(next[1]);
          if (iso) return iso;
        }
      }
    }
    return '';
  }

  function allDates(text) {
    const out = [];
    const re = new RegExp(DATE_TOKEN.source, 'g');
    let m;
    while ((m = re.exec(String(text || '')))) {
      const iso = parseDateToken(m[1]);
      if (iso) out.push(iso);
    }
    return out;
  }

  const NAME_SKIP = /matki|ojca|rodzic|rodowe|mother|father|parent/i;

  function labeledName(text, labels) {
    const lines = String(text || '').split(/\r?\n/);
    for (const line of lines) {
      if (!labels.test(line) || NAME_SKIP.test(line)) continue;
      const value = line.replace(labels, '').replace(/\(?\s*imiona\s*\)?/i, '').replace(/^[\s:.-]+/, '').replace(/[^A-Za-zÀ-ÿĀ-ž' -]/g, '').trim();
      if (value.length >= 2) return titleCase(value.slice(0, 40));
    }
    return '';
  }

  const LICENCE_WORDS = /forklift|w[oó]zk|udt|operator\s+licen/i;
  const LICENCE_NO_LABEL = /\b(?:licen[cs]e|certificate|za[sś]wiadczeni[ea]|uprawnie[nń]|nr|no)\.?\s*(?:no\.?|nr|number|numer)?\s*[:#]?\s*([A-Z0-9][A-Z0-9/\\.-]{4,24})/i;

  function parseLicence(text) {
    const source = 'Forklift licence';
    const all = String(text || '');
    let number = '';
    let numberConf = 95;
    const m = /UDT\s*[/\\-]\s*(\d{4})\s*[/\\-]\s*(\d{3,5})/i.exec(all);
    if (m) number = 'UDT/' + m[1] + '/' + m[2];
    else if (LICENCE_WORDS.test(all)) {
      /* Other issuers: take a labelled number that contains at least one digit. */
      const lines = all.split(/\r?\n/);
      for (const line of lines) {
        const hit = LICENCE_NO_LABEL.exec(line);
        if (hit && /\d/.test(hit[1]) && !DATE_TOKEN.test(hit[1])) { number = hit[1].toUpperCase(); numberConf = 82; break; }
      }
    }
    if (!number) return null;
    const labelled = labelledDate(text, EXPIRY_LABEL);
    const expiry = labelled || allDates(text).filter((d) => d > isoToday()).pop() || '';
    const fields = {
      forkliftLicenceNo: { value: number, confidence: numberConf, source }
    };
    if (expiry) {
      /* A date without a "valid until" label is a guess. */
      fields.licenceExpiry = { value: expiry, confidence: labelled ? 95 : 62, source, note: labelled ? '' : 'Date found without a label' };
    }
    /* Category: UDT uses I WJO / II WJO / III WJO; other issuers print a letter code. */
    /* OCR often reads the Roman I as l, 1 or |. */
    const cat = /(?:^|[\s:])([Il1|]{1,3})\s*[-.]?\s*WJO\b/.exec(all) || /categor(?:y|ies|ia)\s*[:.]?\s*([A-Z0-9+-]{1,6}(?: [A-Z0-9+-]{1,6})?)/i.exec(all);
    if (cat) {
      const value = /WJO/i.test(cat[0]) ? 'I'.repeat(cat[1].length) + ' WJO' : cat[1].trim().toUpperCase();
      fields['p:licenceCategory'] = { value, confidence: 85, source, note: 'Pattern match, no check digit' };
    }
    const holder = {};
    const name = labeledName(text, /holder\s*name|holder|imi[eę]\s+i\s+nazwisko|\bname\b/i);
    if (name) holder.name = { value: name, confidence: 85, source, raw: name };
    const dob = labelledDate(text, /date\s+of\s+birth|data\s+urodzenia|born/i);
    if (dob) holder.dob = { value: dob, confidence: 90, source };
    return {
      kind: 'licence',
      typeLabel: 'Forklift licence detected',
      fields,
      holder,
      note: expiry ? '' : 'Licence number found, but no expiry date'
    };
  }

  function isoToday() {
    const d = new Date();
    return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function parseResidence(text, dob) {
    const source = 'Residence card';
    const fields = {};
    const pesel = parsePesel(text, dob);
    if (pesel) {
      fields.pesel = pesel.fields.pesel;
      if (pesel.fields.dob && !fields.dob) fields.dob = pesel.fields.dob;
    }
    const expiry = labelledDate(text, EXPIRY_LABEL);
    if (expiry) fields.residenceCardExpiry = { value: expiry, confidence: 95, source };
    if (!fields.dob) {
      const dobIso = labelledDate(text, /date\s+of\s+birth|data\s+urodzenia/i);
      if (dobIso) fields.dob = { value: dobIso, confidence: 90, source };
    }
    const surname = labeledName(text, /surname|nazwisko/i);
    const given = labeledName(text, /given\s+names?|first\s+name|\bimi[eęg](?![a-z])/i);
    if (surname) fields.surname = { value: surname, confidence: 90, source };
    if (given) fields.firstName = { value: given, confidence: 90, source };
    const nat = /nationality[:\s]+([A-Za-zÀ-ÿ ]+)/i.exec(String(text || ''));
    if (nat) {
      const value = titleCase(nat[1].replace(/\s{2,}.*$/, '').trim());
      if (value && value.length <= 30) fields.nationality = { value, confidence: 90, source };
    }
    return {
      kind: 'residence',
      typeLabel: 'Residence card detected',
      fields,
      peselInfo: pesel ? pesel.info : null
    };
  }

  /* Polish "Zaświadczenie o nadaniu numeru PESEL". */
  function parsePeselCert(text) {
    const base = parseResidence(text, '');
    const fields = {};
    ['surname', 'firstName', 'dob', 'pesel'].forEach(function (key) {
      if (base.fields[key]) fields[key] = Object.assign({}, base.fields[key], { source: key === 'pesel' ? 'PESEL' : 'PESEL certificate' });
    });
    const sexLine = /p[lł]e[cć¢]\W+(kobieta|m[eę][zż]czyzna)/i.exec(String(text || ''));
    if (sexLine) fields.sex = { value: /^k/i.test(sexLine[1]) ? 'F' : 'M', confidence: 90, source: 'PESEL certificate' };
    const pesel = parsePesel(text, fields.dob ? fields.dob.value : '');
    if (pesel && fields.sex && fields.pesel && pesel.sex !== fields.sex.value) {
      fields.pesel = Object.assign({}, fields.pesel, { confidence: 60, note: 'PESEL sex digit doesn’t match the document' });
    }
    return { kind: 'pesel', typeLabel: 'PESEL certificate detected', fields };
  }

  function isPeselCert(text) {
    return /pesel/i.test(text) && /nadani|nadano|za[sś$]wiadcz|pesel number assignment/i.test(text);
  }

  function parseText(text) {
    const mrzLines = extractMrz(text);
    const mrz = mrzLines ? parseMrz(mrzLines) : null;
    let result = mrz;

    if (!result && isPeselCert(text)) result = parsePeselCert(text);

    if (!result) {
      result = parseResidence(text, '');
      const licence = parseLicence(text);
      if (licence) {
        result = {
          kind: 'licence',
          typeLabel: licence.typeLabel,
          fields: Object.assign({}, licence.fields),
          holder: licence.holder,
          note: licence.note
        };
      } else if (!Object.keys(result.fields).length) {
        const licenceOnly = parseLicence(text);
        if (licenceOnly) result = licenceOnly;
        else {
          return {
            kind: 'unknown',
            typeLabel: 'No document fields recognised',
            fields: {},
            note: 'The text was unreadable. Try a sharper photo, or use a sample document.'
          };
        }
      }
    }

    /* A separate PESEL can appear on a passport or licence too. */
    if (result.kind !== 'residence' && result.kind !== 'pesel') {
      const pesel = parsePesel(text, result.fields.dob ? result.fields.dob.value : '');
      if (pesel) {
        if (!result.fields.pesel) result.fields.pesel = pesel.fields.pesel;
        if (pesel.fields.dob && !result.fields.dob) result.fields.dob = pesel.fields.dob;
      }
    }
    return result;
  }

  /* --------------------------------------------------------- file reading */

  const scriptCache = {};

  function loadScript(src) {
    if (scriptCache[src]) return scriptCache[src];
    scriptCache[src] = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      const timer = setTimeout(() => {
        reject(new Error('The document reader took too long to load. Check your connection and try again.'));
      }, 25000);
      el.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      el.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Could not load the document reader. Check your connection, or try a sample document.'));
      };
      document.head.appendChild(el);
    });
    return scriptCache[src];
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('That image could not be opened. Try a JPG or PNG file.'));
      img.src = url;
    });
  }

  function makeCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function fileToCanvas(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const limit = 1800;
      /* Small photos upscale for better OCR; large ones are capped. */
      const scale = Math.min(2.2, limit / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = makeCanvas(img.naturalWidth * scale, img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function pdfToCanvas(file) {
    await loadScript(CDN.pdfjs);
    if (!global.pdfjsLib) throw new Error('The PDF reader did not start. Try again, or upload an image.');
    global.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker;
    const data = new Uint8Array(await file.arrayBuffer());
    let pdf;
    try {
      pdf = await global.pdfjsLib.getDocument({ data }).promise;
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2.4, 2200 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = makeCanvas(viewport.width, viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      return canvas;
    } catch (err) {
      throw new Error('That PDF could not be read. Try page 1 as an image instead.');
    } finally {
      if (pdf) pdf.destroy();
    }
  }

  function mapStatus(status) {
    if (/recognizing/i.test(status)) return 'Reading document…';
    if (/language|traineddata/i.test(status)) return 'Loading English text data…';
    if (/core|initializing|api/i.test(status)) return 'Starting local text reader…';
    return 'Reading document…';
  }

  function readerError(message, code) {
    const err = new Error(message);
    err.code = code;
    return err;
  }

  async function recognise(canvas, onStatus) {
    if (global.navigator && global.navigator.onLine === false && !global.Tesseract) {
      throw readerError('You’re offline, so the document reader can’t load.', 'offline');
    }
    try {
      await loadScript(CDN.tesseract);
    } catch (err) {
      throw readerError(err.message, 'offline');
    }
    if (!global.Tesseract) throw readerError('The text reader did not start. Check your connection and try again.', 'offline');

    let worker;
    try {
      worker = await global.Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (!onStatus) return;
          if (m && typeof m.progress === 'number') {
            onStatus({
              progress: Math.min(0.94, 0.16 + m.progress * 0.78),
              label: mapStatus(m.status || '')
            });
          }
        }
      });
      const { data } = await worker.recognize(canvas);
      const words = (data.words || []).map((w) => ({ text: w.text || '', conf: Number(w.confidence) || 0 }));
      return { text: data.text || '', words, confidence: Number(data.confidence) || 0 };
    } catch (err) {
      console.warn('DocuFlow OCR failed', err);
      throw new Error('The text reader could not read this file. Try a clearer image, or use a sample document.');
    } finally {
      if (worker) {
        try { await worker.terminate(); } catch (err) { /* ignore */ }
      }
    }
  }

  /* Read an uploaded JPG/PNG/PDF. onPreview fires as soon as page 1 is ready. */
  async function readDocument(file, callbacks) {
    const cb = callbacks || {};
    const notify = (progress, label) => { if (cb.onStatus) cb.onStatus({ progress, label }); };
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    const isImage = /^image\/(jpeg|png)$/.test(file.type) || /\.(jpe?g|png)$/i.test(file.name || '');
    if (!isPdf && !isImage) {
      throw new Error('Please choose a JPG, PNG or PDF file.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('That file is larger than 20 MB. Please choose a smaller document.');
    }

    notify(0.03, isPdf ? 'Opening page 1…' : 'Opening image…');
    const canvas = isPdf ? await pdfToCanvas(file) : await fileToCanvas(file);
    const preview = canvas.toDataURL('image/png');
    if (cb.onPreview) cb.onPreview(preview);
    notify(0.12, 'Preparing local text reader…');
    const read = await recognise(canvas, cb.onStatus);
    const text = read.text;
    const parsed = scoreFields(parseText(text), read);
    return Object.assign({}, parsed, { preview, text, ocrConfidence: Math.round(read.confidence), fileName: file.name || 'document' });
  }

  /* ------------------------------------------------- confidence per field */

  const compact = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9<]/g, '');

  function needleFor(field) {
    if (field.raw) return compact(field.raw);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(field.value || '');
    if (iso) return iso[3] + iso[2] + iso[1];
    return compact(field.value);
  }

  /* How sure the reader was about the words that hold this value. */
  function wordConfidence(read, needle) {
    if (!needle) return null;
    const words = (read.words || []).map((w) => ({ c: compact(w.text), conf: w.conf })).filter((w) => w.c);
    const whole = words.filter((w) => w.c.indexOf(needle) >= 0);
    if (whole.length) return Math.max.apply(null, whole.map((w) => w.conf));
    const parts = words.filter((w) => w.c.length >= 2 && needle.indexOf(w.c) >= 0);
    if (parts.length) return parts.reduce((a, w) => a + w.conf, 0) / parts.length;
    return null;
  }

  function scoreOne(field, read) {
    if (!field || !field.value) return;
    const words = wordConfidence(read, needleFor(field));
    const base = words === null ? Math.max(0, (read.confidence || 70) - 15) : words;
    let conf;
    if (field.check === true) conf = Math.max(90, Math.min(99, Math.max(base, 92)));
    else if (field.check === false) { conf = Math.min(base, 55); field.note = field.note || 'Check digit doesn’t match'; }
    else conf = Math.min(field.confidence || 95, base);
    if (field.cross === false) conf = Math.min(conf, 85);
    field.ocr = Math.round(base);
    field.confidence = Math.round(conf);
  }

  function scoreFields(parsed, read) {
    if (!parsed || !parsed.fields) return parsed;
    const text = read.text || '';
    if (parsed.kind === 'passport') {
      /* Names have no check digit: they count as sure only if the printed page agrees with the MRZ. */
      const visual = compact(text.split(/\r?\n/).filter((l) => (l.match(/</g) || []).length < 3).join(' '));
      ['surname', 'firstName'].forEach((k) => {
        const f = parsed.fields[k];
        if (f && f.value) {
          f.cross = visual.indexOf(compact(f.value)) >= 0;
          if (!f.cross) f.note = f.note || 'Only found in the machine-readable lines';
        }
      });
    }
    Object.keys(parsed.fields).forEach((k) => scoreOne(parsed.fields[k], read));
    if (parsed.holder) Object.keys(parsed.holder).forEach((k) => scoreOne(parsed.holder[k], read));
    return parsed;
  }

  /* high: sure; medium: above the review threshold; low: a person must check it. */
  function level(confidence, threshold) {
    const t = Number(threshold) || 80;
    const c = Number(confidence) || 0;
    if (c >= Math.max(90, t)) return 'high';
    if (c >= t) return 'medium';
    return 'low';
  }

  /* Specimen documents shipped in /samples. SVGs become PNG files so they take the real upload path. */
  const SPECIMENS = {
    passport: 'specimen-passport-olena.svg',
    newPassport: 'specimen-passport-new-worker.svg',
    licence: 'specimen-forklift-licence-olena.pdf'
  };

  async function specimenFile(name) {
    const fileName = SPECIMENS[name] || name;
    const res = await fetch('samples/' + fileName, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Could not open the specimen document.');
    const blob = await res.blob();
    if (!/\.svg$/i.test(fileName)) return new File([blob], fileName, { type: blob.type || 'application/pdf' });
    const url = URL.createObjectURL(new Blob([await blob.text()], { type: 'image/svg+xml' }));
    try {
      const img = await loadImage(url);
      const canvas = makeCanvas(img.naturalWidth * 2, img.naturalHeight * 2);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      return new File([png], fileName.replace(/\.svg$/i, '.png'), { type: 'image/png' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /* -------------------------------------------------------- sample images */

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawPhoto(ctx, x, y, w, h) {
    ctx.fillStyle = '#e8e9e4';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c8c5b9';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#b9bec4';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.38, w * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.92, w * 0.32, h * 0.3, 0, Math.PI, 0);
    ctx.fill();
  }

  function drawSamplePassport() {
    const canvas = makeCanvas(1000, 660);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f1e7';
    ctx.fillRect(0, 0, 1000, 660);
    ctx.strokeStyle = '#d6d0c0';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 964, 624);
    ctx.strokeStyle = '#e2ddce';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, 948, 608);

    ctx.fillStyle = '#0b1530';
    ctx.fillRect(26, 26, 948, 74);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 28px Georgia, "Times New Roman", serif';
    ctx.fillText('PASSPORT', 52, 72);
    ctx.font = '600 13px Arial, sans-serif';
    ctx.fillStyle = '#aebad4';
    ctx.fillText('UKRAINE  ·  УКРАЇНА', 52, 92);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 12px Arial, sans-serif';
    ctx.fillText('TYPE  P   ·   CODE  UKR', 946, 72);
    ctx.textAlign = 'left';

    const label = (text, x, y) => {
      ctx.fillStyle = '#8a8474';
      ctx.font = '600 10.5px Arial, sans-serif';
      ctx.fillText(text.toUpperCase(), x, y);
    };
    const value = (text, x, y) => {
      ctx.fillStyle = '#22252b';
      ctx.font = '600 20px "Courier New", monospace';
      ctx.fillText(text, x, y);
    };

    label('Surname', 52, 152);
    value('KOVALENKO', 52, 176);
    label('Given names', 52, 212);
    value('IRYNA', 52, 236);
    label('Nationality', 52, 272);
    value('UKRAINIAN', 52, 296);
    label('Date of birth', 52, 332);
    value('12 MAR 1994', 52, 356);
    label('Sex', 330, 332);
    value('F', 330, 356);
    label('Passport No.', 390, 332);
    value('FP4829163', 390, 356);
    label('Date of expiry', 52, 396);
    value('21 AUG 2029', 52, 420);
    label('Authority', 390, 396);
    value('KYIV', 390, 420);

    drawPhoto(ctx, 760, 128, 170, 214);
    ctx.fillStyle = '#8a8474';
    ctx.font = '600 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTO', 845, 360);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#fbf9f1';
    ctx.fillRect(26, 486, 948, 148);
    ctx.strokeStyle = '#ddd7c6';
    ctx.strokeRect(26.5, 486.5, 947, 147);

    ctx.fillStyle = '#1b1d22';
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText(SAMPLE.passport.mrz[0], 44, 545);
    ctx.fillText(SAMPLE.passport.mrz[1], 44, 585);
    ctx.fillStyle = '#a8a293';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('MRZ — ICAO 9303 TD3', 48, 614);

    ctx.fillStyle = '#b8b2a4';
    ctx.font = '600 10.5px Arial, sans-serif';
    ctx.fillText('FICTIONAL SAMPLE — NOT A REAL DOCUMENT', 640, 614);

    return canvas;
  }

  function drawSampleLicence() {
    const canvas = makeCanvas(900, 560);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, 900, 560);
    ctx.strokeStyle = '#dfe3eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 872, 532);

    ctx.fillStyle = '#0b1530';
    ctx.fillRect(14, 14, 872, 96);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText('FORKLIFT OPERATOR LICENCE', 46, 62);
    ctx.fillStyle = '#9fb0d0';
    ctx.font = '500 12px Arial, sans-serif';
    ctx.fillText('UDT · Urząd Dozoru Technicznego', 46, 86);
    ctx.strokeStyle = '#5b7ab8';
    ctx.lineWidth = 2;
    roundRect(ctx, 760, 36, 92, 52, 8);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px Arial, sans-serif';
    ctx.fillText('UDT', 790, 69);

    const row = (label, text, y) => {
      ctx.fillStyle = '#77808f';
      ctx.font = '600 10.5px Arial, sans-serif';
      ctx.fillText(label.toUpperCase(), 48, y);
      ctx.fillStyle = '#151a22';
      ctx.font = '600 20px "Courier New", monospace';
      ctx.fillText(text, 48, y + 26);
    };
    row('Holder name', 'IRYNA KOVALENKO', 160);
    row('Licence No.', 'UDT/2026/02417', 228);
    row('Date of issue', '04.02.2026', 296);
    row('Valid until', '14.05.2029', 364);
    row('Categories', 'WJO · FORKLIFT', 432);

    drawPhoto(ctx, 650, 172, 170, 210);

    ctx.fillStyle = '#aab2bf';
    ctx.font = '600 10.5px Arial, sans-serif';
    ctx.fillText('FICTIONAL SAMPLE — NOT A REAL DOCUMENT', 48, 520);

    return canvas;
  }

  function drawSampleResidence() {
    const canvas = makeCanvas(900, 560);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eef2f8';
    ctx.fillRect(0, 0, 900, 560);
    ctx.strokeStyle = '#d9e0ea';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 872, 532);

    ctx.fillStyle = '#0b1530';
    ctx.fillRect(14, 14, 872, 88);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 23px Arial, sans-serif';
    ctx.fillText('RESIDENCE CARD', 46, 58);
    ctx.fillStyle = '#9fb0d0';
    ctx.font = '500 12px Arial, sans-serif';
    ctx.fillText('KARTA POBYTU · POLAND', 46, 80);

    const row = (label, text, y) => {
      ctx.fillStyle = '#77808f';
      ctx.font = '600 10.5px Arial, sans-serif';
      ctx.fillText(label.toUpperCase(), 48, y);
      ctx.fillStyle = '#151a22';
      ctx.font = '600 20px "Courier New", monospace';
      ctx.fillText(text, 48, y + 25);
    };
    row('Surname', 'KOVALENKO', 152);
    row('Given names', 'IRYNA', 212);
    row('Nationality', 'UKRAINIAN', 272);
    row('PESEL', '94031212345', 332);
    row('Date of birth', '12.03.1994', 392);
    row('Valid until', '12.03.2028', 452);

    drawPhoto(ctx, 650, 152, 170, 210);

    ctx.fillStyle = '#aab2bf';
    ctx.font = '600 10.5px Arial, sans-serif';
    ctx.fillText('FICTIONAL SAMPLE — NOT A REAL DOCUMENT', 48, 520);

    return canvas;
  }

  function sampleCanvas(kind) {
    if (kind === 'licence') return drawSampleLicence();
    if (kind === 'residence') return drawSampleResidence();
    return drawSamplePassport();
  }

  function sampleText(kind) {
    if (kind === 'licence') return SAMPLE.licence.text;
    if (kind === 'residence') return SAMPLE.residence.text;
    return SAMPLE.passport.mrz.join('\n');
  }

  /* Built-in sample: deterministic result, no network, so the demo always works. */
  async function runSample(kind, callbacks) {
    const cb = callbacks || {};
    const type = kind || 'passport';
    const canvas = sampleCanvas(type);
    if (cb.onPreview) cb.onPreview(canvas.toDataURL('image/png'));
    const steps = [
      [0.08, 'Opening document…'],
      [0.26, 'Reading document…'],
      [0.52, 'Reading document…'],
      [0.78, 'Validating MRZ check digits…'],
      [0.94, 'Cross-checking fields…']
    ];
    for (const step of steps) {
      await delay(260);
      if (cb.onStatus) cb.onStatus({ progress: step[0], label: step[1] });
    }
    await delay(240);
    if (cb.onStatus) cb.onStatus({ progress: 1, label: 'Document read' });

    const parsed = parseText(sampleText(type));
    return Object.assign({}, parsed, {
      preview: canvas.toDataURL('image/png'),
      fileName: 'sample-' + type + '.png',
      simulated: true
    });
  }

  global.DocuFlowOCR = {
    readDocument,
    parseText,
    parseMrz,
    checkDigit,
    extractMrz,
    runSample,
    sampleCanvas,
    level,
    scoreFields,
    specimenFile,
    SPECIMENS,
    SAMPLE,
    CDN
  };
})(window);
