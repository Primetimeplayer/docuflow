'use strict';

/* Run from the project root: node --test */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Data } = require('./helpers');

const worker = (over) => Object.assign({
  id: 'w-1',
  firstName: 'Olena',
  surname: 'Kovalenko',
  dob: '1991-06-14',
  passportNo: 'FP2048571',
  forkliftLicenceNo: 'UDT/2024/01184'
}, over);

test('normKey folds accents, Polish letters, case and punctuation', function () {
  assert.equal(Data.normKey('Kovalenko-Ołena'), 'kovalenkoolena');
  assert.equal(Data.normKey('  Andrzej   Wiśniewski '), 'andrzejwisniewski');
  assert.equal(Data.normKey('Łódź'), 'lodz');
  assert.equal(Data.normKey('UDT/2024/01184'), 'udt202401184');
  assert.equal(Data.normKey(''), '');
  assert.equal(Data.normKey(null), '');
  assert.equal(Data.normKey(undefined), '');
});

test('matchWorker prefers the passport number over a name and date of birth match', function () {
  const nameMatch = worker({ id: 'w-name', passportNo: 'ZZ000000' });
  const passportMatch = worker({ id: 'w-pass', firstName: 'Someone', surname: 'Else', passportNo: 'FR7315024' });
  const hit = Data.matchWorker([nameMatch, passportMatch], {
    passportNo: 'fr 7315024',
    firstName: 'Olena',
    surname: 'Kovalenko',
    dob: '1991-06-14'
  });
  assert.equal(hit.worker.id, 'w-pass');
  assert.equal(hit.by, 'passport number');
});

test('matchWorker falls back to the licence number before name and date of birth', function () {
  const nameMatch = worker({ id: 'w-name' });
  const licenceMatch = worker({ id: 'w-lic', firstName: 'Different', surname: 'Person', passportNo: '', forkliftLicenceNo: 'udt/2026/03152', dob: '' });
  const hit = Data.matchWorker([nameMatch, licenceMatch], {
    licenceNo: 'UDT/2026/03152',
    firstName: 'Olena',
    surname: 'Kovalenko',
    dob: '1991-06-14'
  });
  assert.equal(hit.worker.id, 'w-lic');
  assert.equal(hit.by, 'licence number');
});

test('matchWorker matches a name and date of birth through case, spacing and accents', function () {
  const w = worker({ id: 'w-name', firstName: 'Andrzej', surname: 'Wiśniewski', dob: '1985-12-12', passportNo: 'ZS4821901', forkliftLicenceNo: '' });
  const hit = Data.matchWorker([w], { firstName: '  andrzej ', surname: 'WIŚNIEWSKI', dob: '1985-12-12' });
  assert.equal(hit.worker.id, 'w-name');
  assert.equal(hit.by, 'name and date of birth');
});

test('matchWorker folds Polish letters in names', function () {
  const w = worker({ id: 'w-olena', firstName: 'Olena', surname: 'Kovalenko' });
  const hit = Data.matchWorker([w], { firstName: 'Ołena', surname: 'Kowalenko', dob: '1991-06-14' });
  assert.equal(hit, null, 'a different surname must not match');

  const hit2 = Data.matchWorker([w], { firstName: 'Ołena', surname: 'Kovalenko', dob: '1991-06-14' });
  assert.equal(hit2.worker.id, 'w-olena');
});

test('matchWorker can use a single fullName field', function () {
  const hit = Data.matchWorker([worker()], { fullName: 'Olena Kovalenko', dob: '1991-06-14' });
  assert.equal(hit.worker.id, 'w-1');
  assert.equal(hit.by, 'name and date of birth');
});

test('matchWorker needs the date of birth before matching on a name', function () {
  assert.equal(Data.matchWorker([worker()], { firstName: 'Olena', surname: 'Kovalenko' }), null);
  assert.equal(Data.matchWorker([worker()], { firstName: 'Olena', surname: 'Kovalenko', dob: '' }), null);
});

test('matchWorker refuses a name match with a different date of birth', function () {
  assert.equal(Data.matchWorker([worker()], { firstName: 'Olena', surname: 'Kovalenko', dob: '1990-06-14' }), null);
});

test('matchWorker ignores empty identifiers instead of matching empty worker fields', function () {
  const blank = worker({ passportNo: '', forkliftLicenceNo: '', firstName: '', surname: '', dob: '' });
  assert.equal(Data.matchWorker([blank], {}), null);
  assert.equal(Data.matchWorker([blank], { passportNo: '  ', licenceNo: '  ', firstName: '', surname: '', dob: '' }), null);
});

test('matchWorker returns null when nothing matches', function () {
  assert.equal(Data.matchWorker([worker()], { passportNo: 'FT4409182', firstName: 'Tetiana', surname: 'Moroz', dob: '1997-08-02' }), null);
  assert.equal(Data.matchWorker([], { passportNo: 'FP2048571' }), null);
  assert.equal(Data.matchWorker(null, { passportNo: 'FP2048571' }), null);
});
