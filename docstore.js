/* DocuFlow — stored document copies, kept in this browser's IndexedDB. */
(function (global) {
  'use strict';
  const DB_NAME = 'docuflow_files';
  const STORE = 'docs';
  const TYPES = { passport: 'Passport', residence: 'Residence card', licence: 'Forklift licence', pesel: 'PESEL certificate' };
  let db = null;
  let items = [];
  const urls = {};
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function store(mode) { return db.transaction(STORE, mode).objectStore(STORE); }
  async function init() {
    try {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = function () { open.result.createObjectStore(STORE, { keyPath: 'id' }); };
      db = await req(open);
      items = await req(store('readonly').getAll());
    } catch (err) { console.warn('DocuFlow file store unavailable', err); db = null; items = []; }
    items.sort(function (a, b) { return b.uploadedAt.localeCompare(a.uploadedAt); });
  }
  /* Preview copy: longest side max 1600 px, JPEG 0.8. */
  function makePreview(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.onload = function () {
        const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * s));
        c.height = Math.max(1, Math.round(img.naturalHeight * s));
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(resolve, 'image/jpeg', 0.8);
      };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  /* meta: { workerId, slot, kind, type, fileName, uploadedBy, fields, status, warning, reviewedAt } */
  async function add(meta, file, previewSrc) {
    let tmp = '';
    if (!previewSrc && file && /^image\//.test(file.type)) previewSrc = tmp = URL.createObjectURL(file);
    const rec = Object.assign({ id: 'd-' + Date.now().toString(36) + Math.floor(Math.random() * 1000), uploadedAt: new Date().toISOString(), status: 'Awaiting review', reason: '', warning: '', fields: {} }, meta);
    rec.type = rec.type || TYPES[rec.kind] || 'Document';
    rec.preview = await makePreview(previewSrc);
    if (tmp) URL.revokeObjectURL(tmp);
    rec.original = file || null;
    items.unshift(rec);
    if (db) await req(store('readwrite').put(rec));
    return rec;
  }
  async function update(id, patch) { const rec = get(id); if (!rec) return null; Object.assign(rec, patch); if (db) await req(store('readwrite').put(rec)); return rec; }
  function get(id) { return items.find(function (d) { return d.id === id; }) || null; }
  function all() { return items.slice(); }
  function forWorker(workerId) { return items.filter(function (d) { return d.workerId === workerId; }); }
  function url(rec, which) {
    const blob = which === 'original' ? rec.original : rec.preview;
    if (!blob) return '';
    const key = rec.id + ':' + (which || 'preview');
    if (!urls[key]) urls[key] = URL.createObjectURL(blob);
    return urls[key];
  }
  async function clear() { items = []; Object.keys(urls).forEach(function (k) { URL.revokeObjectURL(urls[k]); delete urls[k]; }); if (db) await req(store('readwrite').clear()); }
  global.DocuFlowStore = { init, add, update, get, all, forWorker, url, clear, TYPES };
})(window);
