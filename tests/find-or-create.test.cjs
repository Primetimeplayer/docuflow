'use strict';
/* The decision behind the recruiter upload: does a read document belong to an
   existing worker, or is a new "New – needs review" worker created?
   The upload handler itself lives in app.js (IndexedDB, toasts, DOM), so these
   tests cover its pure building blocks: parseText -> DocuFlowData.matchWorker
   -> DocuFlowData.createWorker / computeStatus, and the list change that Undo
   makes. Fictional SPECIMEN and demo data only. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { OCR, D } = require('./parser-env.cjs');

const OLENA_PASSPORT = 'P<UKRKOVALENKO<<OLENA<<<<<<<<<<<<<<<<<<<<<<<\nFR73150242UKR9106145F3603192<<<<<<<<<<<<<<00';
const TETIANA_PASSPORT = 'P<UKRMOROZ<<TETIANA<<<<<<<<<<<<<<<<<<<<<<<<<\nFT44091826UKR9708022F3411059<<<<<<<<<<<<<<02';
const OLENA_LICENCE = 'FORKLIFT OPERATOR LICENCE\nHolder name: OLENA KOVALENKO\nDate of birth: 14.06.1991\nLicence No: UDT/2026/03152\nCategory: I WJO\nValid until: 30.09.2031';

const v = (fields, k) => (fields[k] && fields[k].value) || '';

/* The identity app.js passes to matchWorker for a passport. */
function passportId(parsed) {
  const f = parsed.fields;
  return { passportNo: v(f, 'passportNo'), licenceNo: '', firstName: v(f, 'firstName'), surname: v(f, 'surname'), dob: v(f, 'dob') };
}

/* The identity app.js passes for a licence: last word of the holder name is the surname. */
function licenceId(parsed) {
  const parts = ((parsed.holder.name && parsed.holder.name.value) || '').trim().split(/\s+/).filter(Boolean);
  const surname = parts.length > 1 ? parts.pop() : '';
  return { passportNo: '', licenceNo: v(parsed.fields, 'forkliftLicenceNo'), firstName: parts.join(' '), surname, dob: (parsed.holder.dob && parsed.holder.dob.value) || '' };
}

test('Olena specimen passport matches demo worker w-001 by name and date of birth', () => {
  const workers = D.seedWorkers();
  const m = D.matchWorker(workers, passportId(OCR.parseText(OLENA_PASSPORT)));
  assert.ok(m);
  assert.equal(m.worker.id, 'w-001');
  assert.equal(m.by, 'name and date of birth', 'the specimen has a new passport number');
});

test('Olena specimen licence matches w-001 by name and date of birth, or by licence number', () => {
  const workers = D.seedWorkers();
  const parsed = OCR.parseText(OLENA_LICENCE);
  const m = D.matchWorker(workers, licenceId(parsed));
  assert.equal(m.worker.id, 'w-001');
  assert.equal(m.by, 'name and date of birth');
  const w001 = workers.find((w) => w.id === 'w-001');
  w001.forkliftLicenceNo = 'UDT/2026/03152';
  assert.equal(D.matchWorker(workers, licenceId(parsed)).by, 'licence number');
});

test('Tetiana specimen matches nobody, so a new worker is built from the read fields', () => {
  const workers = D.seedWorkers();
  const parsed = OCR.parseText(TETIANA_PASSPORT);
  assert.equal(D.matchWorker(workers, passportId(parsed)), null);

  const f = parsed.fields;
  const worker = D.createWorker({
    firstName: v(f, 'firstName'), surname: v(f, 'surname'), dob: v(f, 'dob'),
    nationality: v(f, 'nationality'), passportNo: v(f, 'passportNo'), passportExpiry: v(f, 'passportExpiry')
  });
  worker.needsReview = true;
  worker.status = D.computeStatus(worker);
  assert.match(worker.id, /^w-/);
  assert.equal(worker.firstName, 'Tetiana');
  assert.equal(worker.surname, 'Moroz');
  assert.equal(worker.dob, '1997-08-02');
  assert.equal(worker.nationality, 'Ukrainian');
  assert.equal(worker.passportNo, 'FT4409182');
  assert.equal(worker.passportExpiry, '2034-11-05');
  assert.equal(worker.status, 'Review', 'shown as "New – needs review" until a person verifies it');
  assert.ok(!workers.some((w) => w.id === worker.id));
});

test('re-uploading the same passport finds the new worker instead of creating a duplicate', () => {
  const workers = D.seedWorkers();
  const before = workers.length;
  const parsed = OCR.parseText(TETIANA_PASSPORT);
  const f = parsed.fields;
  const worker = D.createWorker({ firstName: v(f, 'firstName'), surname: v(f, 'surname'), dob: v(f, 'dob'), passportNo: v(f, 'passportNo') });
  worker.needsReview = true;
  workers.unshift(worker);

  const again = D.matchWorker(workers, passportId(OCR.parseText(TETIANA_PASSPORT)));
  assert.equal(again.worker.id, worker.id);
  assert.equal(again.by, 'passport number');
  /* Same person, noisy re-scan (lowercase, spaces, O for 0). */
  const noisy = TETIANA_PASSPORT.toLowerCase().replace('9708022', '97O8O22').replace('<<02', ' << 02');
  assert.equal(D.matchWorker(workers, passportId(OCR.parseText(noisy))).worker.id, worker.id);
  assert.equal(workers.length, before + 1);
});

test('Undo removes the new worker, so the next upload creates one again', () => {
  const workers = D.seedWorkers();
  const parsed = OCR.parseText(TETIANA_PASSPORT);
  const f = parsed.fields;
  const worker = D.createWorker({ firstName: v(f, 'firstName'), surname: v(f, 'surname'), dob: v(f, 'dob'), passportNo: v(f, 'passportNo') });
  workers.unshift(worker);
  const afterUndo = workers.filter((w) => w.id !== worker.id); /* what undoIntake does to state.workers */
  assert.equal(afterUndo.length, D.seedWorkers().length);
  assert.equal(D.matchWorker(afterUndo, passportId(parsed)), null);
});

test('a licence without a readable name and no number match creates nobody', () => {
  const parsed = OCR.parseText('FORKLIFT OPERATOR LICENCE\nLicence No: UDT/2026/09999\nValid until: 30.09.2031');
  const id = licenceId(parsed);
  assert.equal(id.firstName, '');
  assert.equal(id.surname, '');
  assert.equal(D.matchWorker(D.seedWorkers(), id), null);
  /* app.js then stops with "We couldn’t read a name on this forklift licence" because first/last are empty. */
});

test('a Polish licence name with accents matches a worker stored without them', () => {
  const workers = [D.createWorker({ firstName: 'Lukasz', surname: 'Wisniewski', dob: '1988-11-03' })];
  const parsed = OCR.parseText('UDT\nImię i nazwisko: ŁUKASZ WIŚNIEWSKI\nData urodzenia: 03.11.1988\nNr: UDT/2025/00731');
  const m = D.matchWorker(workers, licenceId(parsed));
  assert.ok(m, 'Łukasz Wiśniewski = Lukasz Wisniewski');
  assert.equal(m.by, 'name and date of birth');
});
