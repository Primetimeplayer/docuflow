'use strict';
/* Passport MRZ parsing with fixed OCR text. Only the fictional SPECIMEN
   documents shipped in /samples (and the ICAO 9303 specimen check-digit
   values) are used. No real personal data. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { OCR } = require('./parser-env.cjs');

/* samples/specimen-passport-olena.svg — Olena Kovalenko, all checks valid */
const OLENA = [
  'P<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<',
  'FR73150242UKR9106145F3603192<<<<<<<<<<<<<<00'
];
/* samples/specimen-passport-new-worker.svg — Tetiana Moroz, expiry check digit wrong on purpose */
const TETIANA = [
  'P<UKRMOROZ<<TETIANA<<<<<<<<<<<<<<<<<<<<<<<<<',
  'FT44091826UKR9708022F3411059<<<<<<<<<<<<<<02'
];
/* Built-in sample (ocr.js SAMPLE.passport) — Iryna Kovalenko */
const IRYNA = OCR.SAMPLE.passport.mrz;

const checks = (r) => Object.fromEntries(r.checks.map((c) => [c.name, c.passed]));
const values = (r) => Object.fromEntries(Object.entries(r.fields).map(([k, f]) => [k, f.value]));
/* Replace one character of MRZ line 2. */
const withChar = (line, i, ch) => line.slice(0, i) + ch + line.slice(i + 1);

/* ------------------------------------------------------------ clean TD3 */

test('clean TD3: Olena specimen reads every field with 5 of 5 checks', () => {
  const r = OCR.parseMrz(OLENA);
  assert.equal(r.kind, 'passport');
  assert.deepEqual(values(r), {
    surname: 'Kovalenko', firstName: 'Olena', passportNo: 'FR7315024', dob: '1991-06-14',
    passportExpiry: '2036-03-19', nationality: 'Ukrainian', sex: 'F', issuingCountry: 'UKR'
  });
  assert.equal(r.checksPassed, 5);
  assert.equal(r.checksTotal, 5);
  assert.deepEqual(r.mrz, OLENA);
  for (const k of ['surname', 'firstName', 'passportNo', 'dob', 'passportExpiry', 'nationality']) {
    assert.equal(r.fields[k].confidence, 95, k);
    assert.equal(r.fields[k].source, 'Passport', k);
  }
  assert.equal(r.fields.passportNo.check, true);
  assert.equal(r.fields.dob.check, true);
  assert.equal(r.fields.passportExpiry.check, true);
  assert.equal(r.fields.surname.raw, 'KOVALENKO');
  assert.equal(r.fields.dob.raw, '910614');
});

test('clean TD3: Tetiana specimen flags only the expiry and composite checks', () => {
  const r = OCR.parseMrz(TETIANA);
  assert.equal(r.fields.surname.value, 'Moroz');
  assert.equal(r.fields.firstName.value, 'Tetiana');
  assert.equal(r.fields.passportNo.value, 'FT4409182');
  assert.equal(r.fields.dob.value, '1997-08-02');
  assert.equal(r.fields.passportExpiry.value, '2034-11-05');
  assert.equal(r.fields.passportExpiry.check, false);
  assert.equal(r.fields.passportExpiry.confidence, 60);
  assert.equal(r.fields.dob.confidence, 95);
  assert.deepEqual(checks(r), {
    'Passport number': true, 'Date of birth': true, 'Expiry date': false, 'Personal number': true, Composite: false
  });
  assert.equal(r.checksPassed, 3);
});

test('clean TD3: built-in Iryna sample through parseText', () => {
  const r = OCR.parseText(IRYNA.join('\n'));
  assert.equal(r.kind, 'passport');
  assert.equal(r.typeLabel, 'Passport detected');
  assert.equal(r.fields.surname.value, 'Kovalenko');
  assert.equal(r.fields.firstName.value, 'Iryna');
  assert.equal(r.fields.passportNo.value, 'FP4829163');
  assert.equal(r.fields.dob.value, '1994-03-12');
  assert.equal(r.fields.passportExpiry.value, '2029-08-21');
  assert.equal(r.checksPassed, 5);
});

test('parseText finds the MRZ under the printed page of the Olena specimen', () => {
  const page = [
    'PASSPORT', 'UKRAINE · SPECIMEN', 'TYPE P · CODE UKR',
    'SURNAME', 'KOVALENKO', 'GIVEN NAMES', 'OLENA', 'NATIONALITY', 'UKRAINIAN',
    'DATE OF BIRTH', '14 JUN 1991', 'SEX', 'F', 'PASSPORT NO.', 'FR7315024',
    'DATE OF EXPIRY', '19 MAR 2036', 'SPECIMEN — NOT A REAL DOCUMENT · DOCUFLOW DEMO',
    OLENA[0], OLENA[1]
  ].join('\n');
  const r = OCR.parseText(page);
  assert.equal(r.kind, 'passport');
  assert.equal(r.fields.passportNo.value, 'FR7315024');
  assert.equal(r.checksPassed, 5);
});

/* ------------------------------------------------------------ OCR noise */

const expectOlena = (r, label) => {
  assert.ok(r && r.kind === 'passport', label + ': not read as a passport');
  assert.equal(r.fields.surname.value, 'Kovalenko', label);
  assert.equal(r.fields.firstName.value, 'Olena', label);
  assert.equal(r.fields.passportNo.value, 'FR7315024', label);
  assert.equal(r.fields.dob.value, '1991-06-14', label);
  assert.equal(r.fields.passportExpiry.value, '2036-03-19', label);
  assert.equal(r.checksPassed, 5, label);
};

test('noise: lowercase MRZ', () => {
  expectOlena(OCR.parseText(OLENA.join('\n').toLowerCase()), 'lowercase');
});

test('noise: spaces inside the MRZ lines', () => {
  const text = 'P< UKR KOVALENKO << OLENA <<<<<<<<<<<<<<<<<<<<<<<\nFR731 50242 UKR 9106145 F 3603192 <<<<<<<<<<<<<< 00';
  expectOlena(OCR.parseText(text), 'spaces');
});

test('noise: extra blank lines and text around the MRZ', () => {
  expectOlena(OCR.parseText('\n\nSPECIMEN\n\n' + OLENA[0] + '\n\n\n' + OLENA[1] + '\n\n'), 'blank lines');
});

test('noise: Windows line endings', () => {
  expectOlena(OCR.parseText(OLENA.join('\r\n')), 'CRLF');
});

test('noise: the two lines merged into one', () => {
  expectOlena(OCR.parseText(OLENA.join('')), 'merged');
});

test('noise: « and » read for < (one for one)', () => {
  const text = OLENA[0].replace(/</g, (m, i) => (i % 2 ? '«' : '»')) + '\n' + OLENA[1].replace(/</g, '«');
  expectOlena(OCR.parseText(text), 'guillemets');
});

test('noise: O for 0 and I/L for 1 in the numeric blocks are repaired', () => {
  expectOlena(OCR.parseText(OLENA[0] + '\nFR73150242UKR91O6145F36O3192<<<<<<<<<<<<<<OO'), 'O for 0');
  expectOlena(OCR.parseText(OLENA[0] + '\nFR73150242UKR9IO6I45F36O3I92<<<<<<<<<<<<<<00'), 'I for 1');
  expectOlena(OCR.parseText(OLENA[0] + '\nFR7315024ZUKR9106145F3603192<<<<<<<<<<<<<<00'), 'Z for 2 in a check digit');
  expectOlena(OCR.parseText(OLENA[0] + '\nFR73150242UKR91O6L45F36O3192<<<<<<<<<<<<<<0O'), 'L for 1');
});

test('noise: letters inside the passport number are NOT repaired, so its check digit fails', () => {
  const r = OCR.parseText(OLENA[0] + '\nFR73I5O242UKR9106145F3603192<<<<<<<<<<<<<<00');
  assert.equal(r.fields.passportNo.value, 'FR73I5O24');
  assert.equal(r.fields.passportNo.check, false);
  assert.equal(r.fields.passportNo.confidence, 60);
  assert.equal(r.fields.surname.confidence, 60, 'names drop with the number check');
  assert.equal(checks(r)['Passport number'], false);
  assert.equal(checks(r).Composite, false);
  assert.equal(r.fields.dob.value, '1991-06-14');
});

test('noise: < read as K in the filler keeps the fields', () => {
  expectOlena(OCR.parseText('P<UKRKOVALENKO<<OLENA<<<<<<<<<<KKKKKKKKKKKKK\n' + OLENA[1]), 'K in line 1 filler');
  expectOlena(OCR.parseText(OLENA[0] + '\nFR73150242UKR9106145F3603192KKKKKKKKKKKKKK00'), 'K in line 2 filler');
});

test('noise: << name separator read as KK is not guessed', () => {
  const r = OCR.parseText('P<UKRKOVALENKOKKOLENA<<<<<<<<<<<<<<<<<<<<<<<\n' + OLENA[1]);
  assert.notEqual(r.kind, 'passport');
  assert.deepEqual(r.fields, {});
});

test('noise: too-long lines are cut to 44 and short line 2 is padded', () => {
  expectOlena(OCR.parseMrz([OLENA[0] + '<<<<', OLENA[1]]), 'long line 1');
  const r = OCR.parseMrz([OLENA[0], OLENA[1].slice(0, 42)]);
  assert.equal(r.mrz[1].length, 44);
  assert.equal(r.fields.passportNo.value, 'FR7315024');
  assert.equal(checks(r).Composite, false);
});

/* ---------------------------------------------------------- check digits */

test('checkDigit: ICAO 9303 weights 7-3-1 on the ICAO specimen values', () => {
  assert.equal(OCR.checkDigit('L898902C<'), '3');
  assert.equal(OCR.checkDigit('690806'), '1');
  assert.equal(OCR.checkDigit('940623'), '6');
  assert.equal(OCR.checkDigit('ZE184226B<<<<<'), '1');
  assert.equal(OCR.checkDigit('L898902C<369080619406236ZE184226B<<<<<1'), '4');
  assert.equal(OCR.checkDigit('<<<<<<<<<<<<<<'), '0');
  assert.equal(OCR.checkDigit(''), '0');
});

test('checkDigit: the specimen values', () => {
  assert.equal(OCR.checkDigit('FR7315024'), '2');
  assert.equal(OCR.checkDigit('910614'), '5');
  assert.equal(OCR.checkDigit('360319'), '2');
  assert.equal(OCR.checkDigit('FT4409182'), '6');
  assert.equal(OCR.checkDigit('970802'), '2');
  assert.equal(OCR.checkDigit('341105'), '6', 'Tetiana prints 9 instead');
});

test('check digits: each one fails on its own', () => {
  const cases = [
    [9, '3', 'Passport number', 'passportNo'],
    [19, '6', 'Date of birth', 'dob'],
    [27, '3', 'Expiry date', 'passportExpiry'],
    [43, '1', 'Composite', null]
  ];
  for (const [i, ch, name, field] of cases) {
    const r = OCR.parseMrz([OLENA[0], withChar(OLENA[1], i, ch)]);
    const c = checks(r);
    assert.equal(c[name], false, name);
    if (field) {
      assert.equal(r.fields[field].check, false, field);
      assert.equal(r.fields[field].confidence, 60, field);
      assert.equal(c.Composite, false, name + ' also breaks the composite');
    } else {
      assert.equal(r.checksPassed, 4);
      assert.equal(r.fields.passportNo.confidence, 95);
    }
    /* The value is still returned so a person can check it. */
    assert.equal(r.fields.passportNo.value, 'FR7315024');
  }
});

test('check digits: an unused personal number may use < as its check digit (ICAO 9303)', () => {
  const r = OCR.parseMrz([OLENA[0], withChar(OLENA[1], 42, '<')]);
  assert.equal(checks(r)['Personal number'], true);
  assert.equal(r.checksPassed, 5);
  /* …but a real personal number with a < check digit still fails. */
  const p = 'FR73150242UKR9106145F3603192AB12345<<<<<<<<<0';
  assert.equal(checks(OCR.parseMrz([OLENA[0], p]))['Personal number'], false);
});

/* ---------------------------------------------------------------- names */

test('names: filler < inside names becomes a space, multiple given names kept', () => {
  const r = OCR.parseMrz(['P<POLWISNIEWSKA<KOWALSKA<<ANNA<MARIA<<<<<<<<<<', OLENA[1]]);
  assert.equal(r.fields.surname.value, 'Wisniewska Kowalska');
  assert.equal(r.fields.firstName.value, 'Anna Maria');
  assert.equal(r.fields.surname.raw, 'WISNIEWSKA<KOWALSKA'.replace('<', ' '));
  assert.equal(r.fields.issuingCountry.value, 'POL');
});

test('names: MRZ is transliterated, so WISNIEWSKI stays without accents', () => {
  const r = OCR.parseMrz(['P<POLWISNIEWSKI<<LUKASZ<<<<<<<<<<<<<<<<<<<<<<', OLENA[1]]);
  assert.equal(r.fields.surname.value, 'Wisniewski');
  assert.equal(r.fields.firstName.value, 'Lukasz');
});

test('names: a surname with no given name is rejected', () => {
  assert.equal(OCR.parseMrz(['P<UKRKOVALENKO<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', OLENA[1]]), null);
});

/* ------------------------------------------------------------------ sex */

test('sex: F, M and < (unspecified)', () => {
  assert.equal(OCR.parseMrz(OLENA).fields.sex.value, 'F');
  assert.equal(OCR.parseMrz([OLENA[0], withChar(OLENA[1], 20, 'M')]).fields.sex.value, 'M');
  assert.equal(OCR.parseMrz([OLENA[0], withChar(OLENA[1], 20, '<')]).fields.sex.value, '');
  assert.equal(OCR.parseMrz([OLENA[0], withChar(OLENA[1], 20, 'X')]).fields.sex.value, '');
  /* Sex is not part of any check digit. */
  assert.equal(OCR.parseMrz([OLENA[0], withChar(OLENA[1], 20, 'M')]).checksPassed, 5);
});

/* ------------------------------------------------------ 2-digit centuries */

/* Builds line 2 with valid check digits for a given DOB and expiry. */
function line2(dob, exp) {
  const no = 'FR7315024';
  const pers = '<<<<<<<<<<<<<<';
  const body = no + OCR.checkDigit(no) + 'UKR' + dob + OCR.checkDigit(dob) + 'F' + exp + OCR.checkDigit(exp) + pers + OCR.checkDigit(pers);
  const comp = OCR.checkDigit(no + OCR.checkDigit(no) + dob + OCR.checkDigit(dob) + exp + OCR.checkDigit(exp) + pers + OCR.checkDigit(pers));
  return body + comp;
}

test('centuries: line2 helper reproduces the Olena specimen', () => {
  assert.equal(line2('910614', '360319'), OLENA[1]);
});

test('centuries: DOB years after this year are 19xx, up to this year 20xx', () => {
  const yy = new Date().getFullYear() % 100;
  const pad = (n) => String(n).padStart(2, '0');
  const read = (dob) => OCR.parseMrz([OLENA[0], line2(dob, '360319')]).fields.dob.value;
  assert.equal(read(pad(yy + 1) + '0101'), String(1900 + yy + 1) + '-01-01');
  assert.equal(read(pad(yy) + '0101'), String(2000 + yy) + '-01-01');
  assert.equal(read('050315'), '2005-03-15');
  assert.equal(read('991231'), '1999-12-31');
  assert.equal(read('000229'), '2000-02-29');
});

test('centuries: expiry is always 20xx', () => {
  const read = (exp) => OCR.parseMrz([OLENA[0], line2('910614', exp)]).fields.passportExpiry.value;
  assert.equal(read('991231'), '2099-12-31');
  assert.equal(read('300101'), '2030-01-01');
  assert.equal(read('050101'), '2005-01-01');
});

test('centuries: impossible dates are left empty at 60', () => {
  const r = OCR.parseMrz([OLENA[0], line2('911345', '360231')]);
  assert.equal(r.fields.dob.value, '');
  assert.equal(r.fields.dob.confidence, 60);
  assert.equal(r.fields.passportExpiry.value, '');
  assert.equal(r.fields.passportExpiry.confidence, 60);
});

/* ---------------------------------------------------------- nationality */

test('nationality: known codes map to names, unknown codes stay as code at 60', () => {
  const nat = (code) => OCR.parseMrz([OLENA[0], OLENA[1].slice(0, 10) + code + OLENA[1].slice(13)]).fields.nationality;
  assert.equal(nat('UKR').value, 'Ukrainian');
  assert.equal(nat('POL').value, 'Polish');
  assert.equal(nat('IND').value, 'Indian');
  assert.equal(nat('NPL').value, 'Nepali');
  assert.equal(nat('PHL').value, 'Filipino');
  const deu = nat('DEU');
  assert.equal(deu.value, 'DEU');
  assert.equal(deu.confidence, 60);
  assert.equal(deu.note, 'Country code only');
  /* Nationality is not in any check digit. */
  assert.equal(OCR.parseMrz([OLENA[0], OLENA[1].slice(0, 10) + 'DEU' + OLENA[1].slice(13)]).checksPassed, 5);
});

/* ------------------------------------------------------------- rejection */

test('parseMrz rejects missing, short or non-passport input', () => {
  assert.equal(OCR.parseMrz(null), null);
  assert.equal(OCR.parseMrz([]), null);
  assert.equal(OCR.parseMrz([OLENA[0]]), null);
  assert.equal(OCR.parseMrz(['I<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<', OLENA[1]]), null);
  assert.equal(OCR.parseMrz(['P<UKRKOVALENKO', OLENA[1]]), null);
});

test('extractMrz returns two 44-character lines or null', () => {
  assert.deepEqual(OCR.extractMrz('noise\n' + OLENA.join('\n')), OLENA);
  assert.equal(OCR.extractMrz(''), null);
  assert.equal(OCR.extractMrz(null), null);
  assert.equal(OCR.extractMrz('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'), null);
  assert.equal(OCR.extractMrz(OLENA[0]), null);
});
