'use strict';
/* Loads data.js and ocr.js into this Node process the way the browser does
   (both files end with "})(window);"). No DOM is needed for the parsers. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
const root = path.join(__dirname, '..');
for (const file of ['data.js', 'ocr.js']) {
  const name = file === 'data.js' ? 'DocuFlowData' : 'DocuFlowOCR';
  if (!globalThis[name]) vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

module.exports = { OCR: globalThis.DocuFlowOCR, D: globalThis.DocuFlowData };
