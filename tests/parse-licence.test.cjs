'use strict';
/* Forklift licence parsing (reached through parseText, which is how the app
   calls it). Fictional SPECIMEN data only. Dates far from today are used so
   the "future date" fallback never depends on the day the tests run. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { OCR } = require('./parser-env.cjs');

/* Text of samples/specimen-forklift-licence-olena.pdf */
const OLENA_LICENCE = [
  'SPECIMEN - NOT A REAL DOCUMENT - DOCUFLOW DEMO',
  'FORKLIFT OPERATOR LICENCE',
  'Specimen technical inspection office',
  'Holder name: OLENA KOVALENKO',
  'Date of birth: 14.06.1991',
  'Licence No: UDT/2026/03152',
  'Category: I WJO',
  'Issued: 01.10.2026',
  'Valid until: 30.09.2031'
].join('\n');

/* Polish UDT-style wording, fictional holder with Polish letters. */
const POLISH_LICENCE = [
  'ZAŚWIADCZENIE KWALIFIKACYJNE',
  'Urząd Dozoru Technicznego — SPECIMEN',
  'Imię i nazwisko: ŁUKASZ WIŚNIEWSKI',
  'Data urodzenia: 03.11.1988',
  'Nr: UDT/2025/00731',
  'Kategoria: II WJO',
  'Data wydania: 12.03.2025',
  'Ważne do: 12.03.2035'
].join('\n');

const lic = (text) => OCR.parseText(text);

test('specimen licence (PDF text): every field', () => {
  const r = lic(OLENA_LICENCE);
  assert.equal(r.kind, 'licence');
  assert.equal(r.typeLabel, 'Forklift licence detected');
  assert.deepEqual(r.fields.forkliftLicenceNo, { value: 'UDT/2026/03152', confidence: 95, source: 'Forklift licence' });
  assert.deepEqual(r.fields.licenceExpiry, { value: '2031-09-30', confidence: 95, source: 'Forklift licence', note: '' });
  assert.deepEqual(r.fields['p:licenceCategory'], { value: 'I WJO', confidence: 85, source: 'Forklift licence', note: 'Pattern match, no check digit' });
  assert.equal(r.holder.name.value, 'Olena Kovalenko');
  assert.equal(r.holder.name.confidence, 85);
  assert.equal(r.holder.dob.value, '1991-06-14');
  assert.equal(r.holder.dob.confidence, 90);
  assert.equal(r.note, '');
  /* The issue date is not taken as the expiry, and no passport fields appear. */
  assert.equal(r.fields.passportNo, undefined);
  assert.deepEqual(Object.keys(r.fields).sort(), ['forkliftLicenceNo', 'licenceExpiry', 'p:licenceCategory']);
});

test('built-in licence sample (ocr.js SAMPLE.licence)', () => {
  const r = lic(OCR.SAMPLE.licence.text);
  assert.equal(r.fields.forkliftLicenceNo.value, 'UDT/2026/02417');
  assert.equal(r.fields.licenceExpiry.value, '2029-05-14');
  assert.equal(r.holder.name.value, 'Iryna Kovalenko');
});

test('Polish UDT wording: number, category, "Ważne do" expiry, holder with Polish letters', () => {
  const r = lic(POLISH_LICENCE);
  assert.equal(r.kind, 'licence');
  assert.equal(r.fields.forkliftLicenceNo.value, 'UDT/2025/00731');
  assert.equal(r.fields['p:licenceCategory'].value, 'II WJO');
  assert.equal(r.fields.licenceExpiry.value, '2035-03-12');
  assert.equal(r.fields.licenceExpiry.confidence, 95, '"Ważne do" is an expiry label');
  assert.equal(r.holder.name.value, 'Łukasz Wiśniewski');
  assert.equal(r.holder.dob.value, '1988-11-03');
});

test('licence number: UDT pattern with spaces, backslashes, dashes and lowercase', () => {
  const no = (s) => lic('Licence No: ' + s + '\nValid until: 30.09.2031').fields.forkliftLicenceNo;
  assert.equal(no('UDT / 2026 / 03152').value, 'UDT/2026/03152');
  assert.equal(no('UDT\\2026\\03152').value, 'UDT/2026/03152');
  assert.equal(no('UDT-2026-03152').value, 'UDT/2026/03152');
  assert.equal(no('udt/2026/315').value, 'UDT/2026/315');
  assert.equal(no('UDT/2026/03152').confidence, 95);
});

test('licence number: other issuers need forklift wording and a labelled number with a digit (82)', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nCertificate No: FL-88213\nValid until: 01.02.2040');
  assert.equal(r.fields.forkliftLicenceNo.value, 'FL-88213');
  assert.equal(r.fields.forkliftLicenceNo.confidence, 82);
  assert.equal(r.fields.licenceExpiry.value, '2040-02-01');
  /* No forklift wording: not a licence. */
  assert.notEqual(lic('Certificate No: FL-88213\nValid until: 01.02.2040').kind, 'licence');
  /* A date is not a licence number. */
  assert.equal(lic('FORKLIFT LICENCE\nNo: 01.02.2040').kind, 'unknown');
});

test('categories: I / II / III WJO, OCR l, 1 and | for I, and letter categories', () => {
  const cat = (line) => {
    const f = lic('Licence No: UDT/2026/03152\n' + line).fields['p:licenceCategory'];
    return f ? f.value : '';
  };
  assert.equal(cat('Category: I WJO'), 'I WJO');
  assert.equal(cat('Category: II WJO'), 'II WJO');
  assert.equal(cat('Category: III WJO'), 'III WJO');
  assert.equal(cat('Category: l WJO'), 'I WJO');
  assert.equal(cat('Category: 1I WJO'), 'II WJO');
  assert.equal(cat('Category: ||| WJO'), 'III WJO');
  assert.equal(cat('Category: II-WJO'), 'II WJO');
  assert.equal(cat('Kategoria: IIWJO'), 'II WJO');
  assert.equal(cat('Category: B'), 'B');
  assert.equal(cat('Categories: B C+E'), 'B C+E');
  assert.equal(cat('Valid until: 30.09.2031'), '');
});

test('dates: dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy and "30 SEP 2031" after the label', () => {
  const exp = (s) => lic('Licence No: UDT/2026/03152\nValid until: ' + s).fields.licenceExpiry;
  assert.equal(exp('30.09.2031').value, '2031-09-30');
  assert.equal(exp('30/09/2031').value, '2031-09-30');
  assert.equal(exp('30-09-2031').value, '2031-09-30');
  assert.equal(exp('1.9.2031').value, '2031-09-01');
  assert.equal(exp('30 SEP 2031').value, '2031-09-30');
  assert.equal(exp('30 September 2031').value, '2031-09-30');
});

test('dates: other expiry labels', () => {
  for (const label of ['Date of expiry', 'Expiry date', 'Expires', 'Ważna do', 'Wazne do', 'Data ważności']) {
    const r = lic('Licence No: UDT/2026/03152\n' + label + ': 30.09.2031');
    assert.equal(r.fields.licenceExpiry.value, '2031-09-30', label);
    assert.equal(r.fields.licenceExpiry.confidence, 95, label);
  }
});

test('dates: impossible labelled dates are skipped', () => {
  const r = lic('Licence No: UDT/2026/03152\nValid until: 31.02.2040');
  assert.equal(r.fields.licenceExpiry, undefined);
  assert.equal(r.note, 'Licence number found, but no expiry date');
});

test('dates: ISO yyyy-mm-dd is not read on a licence (known gap, nothing invented)', () => {
  const r = lic('Licence No: UDT/2026/03152\nValid until: 2031-09-30');
  assert.equal(r.fields.licenceExpiry, undefined);
  assert.equal(r.note, 'Licence number found, but no expiry date');
});

test('without labels: the last future date is the expiry at 62 with a note', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nUDT/2026/03152\nOLENA KOVALENKO\n01.10.2010\n30.09.2040');
  assert.equal(r.fields.forkliftLicenceNo.value, 'UDT/2026/03152');
  assert.equal(r.fields.licenceExpiry.value, '2040-09-30');
  assert.equal(r.fields.licenceExpiry.confidence, 62);
  assert.equal(r.fields.licenceExpiry.note, 'Date found without a label');
  /* No label, no holder name. */
  assert.deepEqual(r.holder, {});
  /* Only past dates: no expiry. */
  assert.equal(lic('UDT/2026/03152\n01.10.2010').fields.licenceExpiry, undefined);
});

test('multiline: a date on the line after its label is read', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nLicence No:\nUDT/2026/03152\nValid until:\n\n30.09.2031\nDate of birth:\n14.06.1991');
  assert.equal(r.fields.forkliftLicenceNo.value, 'UDT/2026/03152');
  assert.equal(r.fields.licenceExpiry.value, '2031-09-30');
  assert.equal(r.fields.licenceExpiry.confidence, 95);
  assert.equal(r.holder.dob.value, '1991-06-14');
});

test('multiline: a name on the line after its label is not read (known gap)', () => {
  const r = lic('Holder name:\nOLENA KOVALENKO\nLicence No: UDT/2026/03152');
  assert.equal(r.holder.name, undefined);
});

test('holder name: "Surname:" is not taken as a name label', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nSurname: KOWALSKA\nGiven names: ANNA\nLicence No: UDT/2025/00731');
  assert.equal(r.holder.name, undefined, 'must not read "Sur Kowalska"');
  /* Plain "Name:" and "Holder:" still work. */
  assert.equal(lic('NAME: ANNA KOWALSKA\nUDT/2025/00731').holder.name.value, 'Anna Kowalska');
  assert.equal(lic('Holder: ANNA KOWALSKA\nUDT/2025/00731').holder.name.value, 'Anna Kowalska');
});

test('holder name: parent names are skipped, digits and symbols dropped, max 40 characters', () => {
  const r = lic("Imię i nazwisko matki: IRYNA KOVALENKO\nImię i nazwisko: OLENA O'NEIL-KOVALENKO 123 #\nUDT/2026/03152");
  assert.equal(r.holder.name.value, "Olena O'Neil-Kovalenko");
  const long = lic('Name: ' + 'A'.repeat(60) + '\nUDT/2026/03152');
  assert.equal(long.holder.name.value.length, 40);
});

test('missing fields: licence number only', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nLicence No: UDT/2026/03152');
  assert.equal(r.kind, 'licence');
  assert.deepEqual(Object.keys(r.fields), ['forkliftLicenceNo']);
  assert.deepEqual(r.holder, {});
  assert.equal(r.note, 'Licence number found, but no expiry date');
});

test('missing fields: no licence number means it is not a licence', () => {
  const r = lic('FORKLIFT OPERATOR LICENCE\nHolder name: OLENA KOVALENKO\nValid until: 30.09.2031');
  assert.notEqual(r.kind, 'licence');
  assert.equal(r.fields.forkliftLicenceNo, undefined);
});

test('a PESEL printed on a licence is added', () => {
  /* 91061412341 is the fictional PESEL of demo worker w-001 (valid checksum). */
  const r = lic(OLENA_LICENCE + '\nPESEL: 91061412341');
  assert.equal(r.kind, 'licence');
  assert.equal(r.fields.pesel.value, '91061412341');
  assert.equal(r.fields.pesel.confidence, 95);
  assert.equal(r.fields.pesel.note, 'Valid checksum');
});
