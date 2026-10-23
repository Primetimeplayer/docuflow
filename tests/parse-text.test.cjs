'use strict';
/* parseText routing and robustness: garbage, empty and non-document text must
   come back empty (kind 'unknown') without throwing. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { OCR } = require('./parser-env.cjs');

const UNKNOWN = {
  kind: 'unknown',
  typeLabel: 'No document fields recognised',
  fields: {},
  note: 'The text was unreadable. Try a sharper photo, or use a sample document.'
};

test('empty and missing input returns the unknown result', () => {
  for (const input of ['', '   ', '\n\n\n', null, undefined]) {
    assert.deepEqual(OCR.parseText(input), UNKNOWN, JSON.stringify(input));
  }
});

test('non-string input does not throw', () => {
  for (const input of [0, 12345, {}, []]) {
    assert.doesNotThrow(() => OCR.parseText(input));
    assert.equal(OCR.parseText(input).kind, 'unknown');
  }
});

test('garbage and non-document text returns the unknown result', () => {
  const samples = [
    'lorem ipsum dolor sit amet',
    '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    '#@!$%^&*()_+{}|:"<>?~`',
    'Shopping list\nmilk 2\nbread 1\neggs 12',
    'Meeting notes 14.06.1991 and 30.09.2031',
    'P<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    'Iｍage text ✓ ünïcödé ąęśćżźół Ж Ї',
    'x'.repeat(20000)
  ];
  for (const text of samples) {
    assert.deepEqual(OCR.parseText(text), UNKNOWN, text.slice(0, 40));
  }
});

test('half an MRZ (line 1 only) is not a passport', () => {
  assert.deepEqual(OCR.parseText('P<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<'), UNKNOWN);
});

test('MRZ wins over licence wording on the same page', () => {
  const text = 'FORKLIFT\nP<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<\nFR73150242UKR9106145F3603192<<<<<<<<<<<<<<00';
  assert.equal(OCR.parseText(text).kind, 'passport');
});

test('residence card sample is routed to residence, not licence or passport', () => {
  const r = OCR.parseText(OCR.SAMPLE.residence.text);
  assert.equal(r.kind, 'residence');
  assert.equal(r.fields.surname.value, 'Kovalenko');
  assert.equal(r.fields.firstName.value, 'Iryna');
  assert.equal(r.fields.residenceCardExpiry.value, '2028-03-12');
  assert.equal(r.fields.nationality.value, 'Ukrainian');
});

test('a passport result keeps a PESEL found elsewhere on the page', () => {
  const text = 'PESEL: 91061412341\nP<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<\nFR73150242UKR9106145F3603192<<<<<<<<<<<<<<00';
  const r = OCR.parseText(text);
  assert.equal(r.kind, 'passport');
  assert.equal(r.fields.pesel.value, '91061412341');
  assert.equal(r.fields.pesel.note, 'Valid checksum', 'PESEL date agrees with the MRZ date of birth');
});

test('parseText returns a fresh object each call (no shared state)', () => {
  const a = OCR.parseText(OCR.SAMPLE.passport.mrz.join('\n'));
  a.fields.surname.value = 'Changed';
  const b = OCR.parseText(OCR.SAMPLE.passport.mrz.join('\n'));
  assert.equal(b.fields.surname.value, 'Kovalenko');
});
