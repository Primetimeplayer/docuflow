'use strict';

/* Load the browser scripts in a bare context so the pure helpers can be tested
   with Node's built-in runner from the project root:  node --test  */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);

['data.js', 'ocr.js'].forEach(function (file) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInContext(source, sandbox, { filename: file });
});

const Data = sandbox.window.DocuFlowData;
const OCR = sandbox.window.DocuFlowOCR;
if (!Data || !OCR) throw new Error('DocuFlow scripts did not load');

module.exports = { Data, OCR };
