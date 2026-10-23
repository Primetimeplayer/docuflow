'use strict';

/* Run from the project root: node --test */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { OCR } = require('./helpers');

const word = (text, conf) => ({ text: text, conf: conf });
const printed = (fields, extra) => Object.assign({ kind: 'licence', fields: fields || {} }, extra);
const passport = (fields, extra) => Object.assign({ kind: 'passport', fields: fields || {} }, extra);
const read = (over) => Object.assign({ text: '', words: [], confidence: 90 }, over);
const score = (parsed, r) => OCR.scoreFields(parsed, r).fields;

/* ---------------------------------------------------------------- levels */

test('level: High needs 90, Medium needs the threshold, anything lower is Low', function () {
  assert.equal(OCR.level(99, 80), 'high');
  assert.equal(OCR.level(90, 80), 'high');
  assert.equal(OCR.level(89, 80), 'medium');
  assert.equal(OCR.level(80, 80), 'medium');
  assert.equal(OCR.level(79, 80), 'low');
  assert.equal(OCR.level(0, 80), 'low');
});

test('level: a 95 threshold makes bare High the only passing level', function () {
  assert.equal(OCR.level(95, 95), 'high');
  assert.equal(OCR.level(94, 95), 'low');
  assert.equal(OCR.level(90, 95), 'low');
});

test('level: a 50 threshold widens Medium without moving High', function () {
  assert.equal(OCR.level(90, 50), 'high');
  assert.equal(OCR.level(89, 50), 'medium');
  assert.equal(OCR.level(50, 50), 'medium');
  assert.equal(OCR.level(49, 50), 'low');
});

test('level: missing or unusable input falls back to the 80 threshold', function () {
  assert.equal(OCR.level(90), 'high');
  assert.equal(OCR.level(85), 'medium');
  assert.equal(OCR.level(70, 0), 'low');
  assert.equal(OCR.level(undefined, 80), 'low');
  assert.equal(OCR.level('92', 80), 'high');
});

/* ------------------------------------------------------- passport scoring */

test('scoring: a passing check digit is High even when the word was read badly', function () {
  const p = passport({
    passportNo: { value: 'FR7315024', raw: 'FR7315024', check: true, confidence: 60 }
  });
  const fields = score(p, read({ words: [word('FR73150242UKR9106145F3603192', 55)] }));
  assert.equal(fields.passportNo.ocr, 55);
  assert.equal(fields.passportNo.confidence, 92);
  assert.equal(OCR.level(fields.passportNo.confidence, 80), 'high');
});

test('scoring: a passing check digit is High even when no word matched at all', function () {
  const p = passport({ passportExpiry: { value: '2036-03-19', raw: '360319', check: true, confidence: 95 } });
  const fields = score(p, read({ confidence: 20 }));
  assert.equal(fields.passportExpiry.confidence, 92);
});

test('scoring: a failing check digit is capped at Low and explains why', function () {
  const p = passport({
    passportExpiry: { value: '2034-11-05', raw: '341105', check: false, confidence: 95 }
  });
  const fields = score(p, read({ words: [word('3411059', 96)], confidence: 96 }));
  assert.equal(fields.passportExpiry.confidence, 55);
  assert.equal(OCR.level(fields.passportExpiry.confidence, 80), 'low');
  assert.equal(fields.passportExpiry.note, 'Check digit doesn’t match');
});

test('scoring: a name on the printed page counts as High', function () {
  const p = passport({ surname: { value: 'Kovalenko', raw: 'KOVALENKO', confidence: 95 } });
  const fields = score(p, read({
    text: 'SURNAME\nKOVALENKO\nGIVEN NAMES\nOLENA',
    words: [word('KOVALENKO', 94), word('OLENA', 91)]
  }));
  assert.equal(fields.surname.cross, true);
  assert.equal(fields.surname.confidence, 94);
  assert.equal(fields.surname.note, undefined);
});

test('scoring: a name found only in the machine-readable lines is capped and flagged', function () {
  const p = passport({
    surname: { value: 'Moroz', raw: 'MOROZ', confidence: 95 },
    firstName: { value: 'Tetiana', raw: 'TETIANA', confidence: 95 }
  });
  const fields = score(p, read({
    text: 'P<UKRMOROZ<<TETIANA<<<<<<<<<<<<<<<<<<<<<<<<',
    words: [word('P<UKRMOROZ<<TETIANA<<<<<<<<<<<<<<<<<<<<<<<<', 96)]
  }));
  assert.equal(fields.surname.cross, false);
  assert.equal(fields.surname.confidence, 85);
  assert.equal(fields.surname.note, 'Only found in the machine-readable lines');
  assert.equal(fields.firstName.confidence, 85);
});

test('scoring: the MRZ itself is never treated as the printed page agreeing', function () {
  const p = passport({ firstName: { value: 'Olena', raw: 'OLENA', confidence: 95 } });
  const fields = score(p, read({
    text: 'P<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<',
    words: [word('P<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<', 97)]
  }));
  assert.equal(fields.firstName.cross, false);
  assert.equal(fields.firstName.confidence, 85);
});

/* ---------------------------------------------------------- pattern fields */

test('scoring: a pattern field cannot claim more confidence than the reader had', function () {
  const p = printed({ 'p:licenceCategory': { value: 'I WJO', confidence: 85 } });
  const poor = score(p, read({ words: [word('WJO', 70)] }));
  assert.equal(poor['p:licenceCategory'].confidence, 70);

  const good = score(printed({ 'p:licenceCategory': { value: 'I WJO', confidence: 85 } }), read({ words: [word('WJO', 99)] }));
  assert.equal(good['p:licenceCategory'].confidence, 85);
});

test('scoring: an ISO date matches the printed date in words', function () {
  const p = printed({ licenceExpiry: { value: '2031-09-30', confidence: 95 } });
  const fields = score(p, read({ words: [word('30.09.2031', 95)] }));
  assert.equal(fields.licenceExpiry.confidence, 95);
});

test('scoring: accents in a Polish surname do not stop a word match', function () {
  const p = printed({ surname: { value: 'Wiśniewski', raw: 'WIŚNIEWSKI', confidence: 95 } });
  const fields = score(p, read({ words: [word('WIŚNIEWSKI', 93)] }));
  assert.equal(fields.surname.confidence, 93);
});

test('scoring: with no matching word the overall reader confidence is the fallback', function () {
  const p = passport({ nationality: { value: 'Ukrainian', raw: 'UKR', confidence: 95 } });
  const fields = score(p, read({ words: [], confidence: 88 }));
  assert.equal(fields.nationality.ocr, 73);
  assert.equal(fields.nationality.confidence, 73);
});

test('scoring: the fallback never goes below zero', function () {
  const p = passport({ nationality: { value: 'Ukrainian', raw: 'UKR', confidence: 95 } });
  const fields = score(p, read({ words: [], confidence: 10 }));
  assert.equal(fields.nationality.confidence, 0);
});

/* --------------------------------------------------------------- licence */

test('scoring: licence holder fields are scored against the words that hold them', function () {
  const p = {
    kind: 'licence',
    fields: { forkliftLicenceNo: { value: 'UDT/2026/03152', confidence: 95 } },
    holder: { name: { value: 'Olena Kovalenko', confidence: 85 } }
  };
  const fields = score(p, read({
    words: [word('OLENA', 97), word('KOVALENKO', 93), word('UDT/2026/03152', 96)]
  }));
  assert.equal(fields.forkliftLicenceNo.confidence, 95);
  assert.equal(p.holder.name.confidence, 85);
  assert.equal(p.holder.name.ocr, 95);
});

/* ----------------------------------------------------------- edge cases */

test('scoring: a field with no value is left alone', function () {
  const empty = { value: '' };
  const fields = score(passport({ passportNo: empty }), read({ words: [word('FR7315024', 96)] }));
  assert.equal(fields.passportNo.confidence, undefined);
  assert.equal(fields.passportNo.ocr, undefined);
});

test('scoring: parsed results without fields are returned untouched', function () {
  const r = read({});
  assert.equal(OCR.scoreFields(null, r), null);
  const noFields = { kind: 'passport' };
  assert.equal(OCR.scoreFields(noFields, r), noFields);
  const unknown = { kind: 'unknown', fields: {} };
  assert.equal(OCR.scoreFields(unknown, r), unknown);
});
