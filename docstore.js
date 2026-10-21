/* DocuFlow — stored document copies, kept in this browser's IndexedDB. */
(function (global) {
  'use strict';
  const DB_NAME = 'docuflow_files';
  const STORE = 'docs';
  const TYPES = { passport: 'Passport', residence: 'Residence card', licence: 'Forklift licence', pesel: 'PESEL certificate' };
  let db = null;
  let items = [];
  let ready = false;
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
    ready = true;
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
  const SLOT_OF_KIND = { passport: 'passport', residence: 'residence', licence: 'licence', pesel: 'peselDoc' };
  function slotOf(rec) { return rec.slot || SLOT_OF_KIND[rec.kind] || rec.kind || 'other'; }
  function when(rec) { return rec.reviewedAt || rec.uploadedAt; }
  function lastRestore(rec) {
    const list = rec && rec.restores;
    return list && list.length ? list[list.length - 1] : null;
  }
  function activeAt(rec) {
    const restored = lastRestore(rec);
    return restored ? restored.at : when(rec);
  }
  function stamp(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return '—';
    const p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function history(workerId, slot) {
    const list = forWorker(workerId).filter(function (d) { return slotOf(d) === slot && d.status !== 'Awaiting review'; })
      .sort(function (a, b) { return new Date(activeAt(b)) - new Date(activeAt(a)); });
    let newerVerified = null;
    list.forEach(function (rec) {
      if (rec.status === 'Verified') {
        rec.isCurrent = newerVerified === null;
        rec.replacedAt = newerVerified === null ? '' : newerVerified;
        newerVerified = activeAt(rec);
      } else {
        rec.isCurrent = false;
        rec.replacedAt = '';
      }
    });
    return list;
  }
  function current(workerId, slot) {
    return history(workerId, slot).filter(function (d) { return d.isCurrent; })[0] || null;
  }
  function auditLine(rec) {
    return (rec.status === 'Rejected' ? 'Rejected' : 'Verified') +
      (rec.reviewedBy ? ' by ' + rec.reviewedBy : '') + ' · ' + stamp(when(rec));
  }
  function restoreLine(rec) {
    const restored = lastRestore(rec);
    return restored ? 'Restored by ' + restored.by + ' · ' + stamp(restored.at) : '';
  }
  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function historyHtml(workerId, slot, opts) {
    const list = history(workerId, slot);
    if (!list.length) return '';
    const review = !!(opts && opts.review);
    return '<ul class="hist-list">' + list.map(function (rec) {
      const currentVersion = rec.isCurrent;
      const rejected = rec.status === 'Rejected';
      const pill = rejected ? 'Rejected' : currentVersion ? 'Current' : 'Replaced ' + stamp(rec.replacedAt).slice(0, 10);
      const view = review
        ? '<a class="text-link" href="#/documents/' + encodeURIComponent(rec.id) + '">View</a>'
        : '<a class="text-link" href="' + esc(url(rec, rec.original ? 'original' : 'preview')) + '" target="_blank" rel="noopener">View</a>';
      return '<li class="hist-item' + (currentVersion ? ' is-current' : '') + (rejected ? ' is-rejected' : '') + '">' +
        '<span class="hist-text">' +
          '<span class="hist-name">' + esc(rec.fileName) + '</span>' +
          '<span class="hist-meta">Uploaded by ' + (rec.uploadedBy === 'employee' ? 'Employee' : 'Recruiter') + ' · ' + stamp(rec.uploadedAt).slice(0, 10) + '</span>' +
          '<span class="hist-audit">' + esc(auditLine(rec)) + (rejected && rec.reason ? ' · Reason: ' + esc(rec.reason) : '') + '</span>' +
          (restoreLine(rec) ? '<span class="hist-audit hist-restored">' + esc(restoreLine(rec)) + '</span>' : '') +
        '</span>' +
        '<span class="hist-pill">' + esc(pill) + '</span>' +
        '<span class="hist-actions">' + view +
          (review && opts.restore !== false && !rejected && rec.status === 'Verified' && !currentVersion
            ? '<button type="button" class="btn btn-quiet btn-small" data-action="restore-doc" data-id="' + esc(rec.id) + '">Restore this version</button>'
            : '') +
          '<button type="button" class="btn btn-quiet btn-small" data-hist-download="' + esc(rec.id) + '">Download</button>' +
        '</span>' +
        '</li>';
    }).join('') + '</ul>';
  }
  function download(rec) {
    if (!rec) return;
    const useOriginal = !!rec.original;
    const href = url(rec, useOriginal ? 'original' : 'preview');
    if (!href) return;
    let name = rec.fileName || 'document';
    if (!useOriginal) name = name.replace(/\.[^./]+$/, '') + '.jpg';
    const link = document.createElement('a');
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-hist-download]');
    if (!el) return;
    download(get(el.dataset.histDownload));
  });
  async function clear() { items = []; Object.keys(urls).forEach(function (k) { URL.revokeObjectURL(urls[k]); delete urls[k]; }); if (db) await req(store('readwrite').clear()); }
  global.DocuFlowStore = { init, add, update, get, all, forWorker, url, clear, TYPES, slotOf, history, current, historyHtml, auditLine, restoreLine, stamp, download, isReady: function () { return ready; } };
})(window);
