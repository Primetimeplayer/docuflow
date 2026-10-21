/* DocuFlow — live Reports page (#/reports). Fictional data only. */
(function () {
  'use strict';

  const D = window.DocuFlowData;
  const S = window.DocuFlowStore;

  let windowDays = 30;
  let period = 'month';
  let tables = {};
  let ctx = null;

  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function isoLocal(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function shortLocal(date) {
    return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear();
  }

  function percent(part, total) {
    return total ? Math.round((part / total) * 100) : 0;
  }

  function statusPill(label, cls) {
    return '<span class="status ' + cls + '"><span class="status-dot"></span>' + esc(label) + '</span>';
  }

  function daysText(days) {
    if (days === 0) return 'Today';
    if (days < 0) return Math.abs(days) + (days === -1 ? ' day ago' : ' days ago');
    return days + (days === 1 ? ' day' : ' days');
  }

  function periodStart() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(1);
    if (period === 'quarter') start.setMonth(start.getMonth() - 2);
    return start;
  }

  function inPeriod(iso) {
    if (!iso) return false;
    const time = new Date(iso).getTime();
    return time >= periodStart().getTime() && time <= Date.now();
  }

  function tile(label, value, sub, attention) {
    return '<article class="card stat' + (attention ? ' stat-attention' : '') + '" data-kpi="' + esc(label) + '">' +
      '<div class="stat-top"><span class="stat-label">' + esc(label) + '</span></div>' +
      '<p class="stat-value">' + esc(value) + '</p>' +
      '<p class="stat-sub">' + esc(sub) + '</p>' +
      '</article>';
  }

  function tableCard(id, title, sub, headers, rows, controls, emptyText) {
    const hasRows = rows.length > 0;
    tables[id] = { headers: headers, rows: rows.map(function (row) { return row.csv; }) };
    return '<section class="card rep-card" data-rep-table="' + esc(id) + '">' +
      '<div class="card-head"><div><h2>' + esc(title) + '</h2><p class="card-sub">' + esc(sub) + '</p></div>' +
        '<div class="rep-tools">' + (controls || '') +
          '<button type="button" class="btn btn-quiet btn-small" data-rep="csv" data-table="' + esc(id) + '"' + (hasRows ? '' : ' disabled') + '>Export CSV</button>' +
        '</div>' +
      '</div>' +
      (hasRows
        ? '<div class="table-wrap"><table class="table table-rep">' +
            '<thead><tr>' + headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
            '<tbody>' + rows.map(function (row) {
              return '<tr' + (row.href ? ' data-href="' + esc(row.href) + '" tabindex="0"' : '') + '>' +
                row.cells.map(function (cell, i) {
                  return '<td data-label="' + esc(headers[i]) + '">' + cell + '</td>';
                }).join('') +
                '</tr>';
            }).join('') + '</tbody></table></div>'
        : '<div class="empty empty-small"><p class="empty-title">' + esc(emptyText) + '</p></div>') +
      '</section>';
  }

  function expiringTable(workers) {
    const items = D.expiryItems(workers).filter(function (item) { return item.days <= windowDays; });
    const rows = items.map(function (item) {
      let label = 'Upcoming';
      let cls = 'status-neutral';
      if (item.days < 0) { label = 'Expired'; cls = 'status-expiring'; }
      else if (item.days <= 14) { label = 'Urgent'; cls = 'status-expiring'; }
      else if (item.days <= 30) { label = 'Due soon'; cls = 'status-review'; }
      const name = D.fullName(item.worker);
      return {
        href: '#/workers/' + encodeURIComponent(item.workerId),
        cells: [
          esc(name),
          esc(item.type),
          esc(D.formatDate(item.date)),
          esc(daysText(item.days)),
          statusPill(label, cls)
        ],
        csv: [name, item.type, D.formatDate(item.date), String(item.days), label]
      };
    });
    const chips = [30, 60, 90].map(function (days) {
      return '<button type="button" class="chip-filter' + (windowDays === days ? ' is-active' : '') + '" data-rep="window" data-value="' + days + '" aria-pressed="' + (windowDays === days) + '">' + days + ' days</button>';
    }).join('');
    return tableCard('expiring', 'Expiring documents', 'Soonest first, including anything already expired',
      ['Worker', 'Document', 'Expiry', 'Days left', 'Status'], rows, chips,
      'Nothing expires in the next ' + windowDays + ' days');
  }

  function missingTable(workers) {
    const required = [
      ['First name', 'firstName'],
      ['Surname', 'surname'],
      ['Date of birth', 'dob'],
      ['Nationality', 'nationality'],
      ['Passport number', 'passportNo'],
      ['Passport expiry', 'passportExpiry'],
      ['PESEL', 'pesel'],
      ['Email', 'email']
    ];
    const gaps = [];
    workers.forEach(function (worker) {
      const missing = required.filter(function (field) {
        return !String(worker[field[1]] || '').trim();
      }).map(function (field) { return field[0]; });
      if (worker.nationality !== 'Polish' && !String(worker.residenceCardExpiry || '').trim()) {
        missing.push('Residence card expiry');
      }
      if (missing.length) gaps.push({ worker: worker, missing: missing });
    });
    gaps.sort(function (a, b) {
      return b.missing.length - a.missing.length || D.fullName(a.worker).localeCompare(D.fullName(b.worker));
    });
    const rows = gaps.map(function (gap) {
      const name = D.fullName(gap.worker);
      return {
        href: '#/workers/' + encodeURIComponent(gap.worker.id),
        cells: [
          esc(name),
          esc(gap.missing.join(', ')),
          '<a class="text-link" href="#/workers/' + encodeURIComponent(gap.worker.id) + '">Open record →</a>'
        ],
        csv: [name, gap.missing.join('; '), String(gap.missing.length)]
      };
    });
    return tableCard('missing', 'Missing information',
      gaps.length + ' workers with gaps in their record',
      ['Worker', 'Missing', ''], rows, '', 'Every record is complete');
  }

  function avgVerifyLabel(stored) {
    const verified = stored.filter(function (doc) {
      return doc.uploadedBy === 'employee' && doc.status === 'Verified' && inPeriod(doc.reviewedAt);
    });
    if (!verified.length) return '—';
    const minutes = verified.reduce(function (sum, doc) {
      return sum + Math.max(0, (new Date(doc.reviewedAt) - new Date(doc.uploadedAt)) / 60000);
    }, 0) / verified.length;
    if (minutes < 1) return 'Under 1 min';
    if (minutes < 60) return Math.round(minutes) + ' min';
    if (minutes < 1440) {
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return h + ' h' + (m ? ' ' + m + ' min' : '');
    }
    const days = Math.round(minutes / 1440);
    return days + (days === 1 ? ' day' : ' days');
  }

  function reviewsSection(stored) {
    const verified = stored.filter(function (doc) { return doc.status === 'Verified' && inPeriod(doc.reviewedAt); }).length;
    const rejected = stored.filter(function (doc) { return doc.status === 'Rejected' && inPeriod(doc.reviewedAt); }).length;
    const awaiting = stored.filter(function (doc) { return doc.status === 'Awaiting review'; }).length;
    const chips = [['month', 'This month'], ['quarter', 'Last 3 months']].map(function (option) {
      return '<button type="button" class="chip-filter' + (period === option[0] ? ' is-active' : '') + '" data-rep="period" data-value="' + option[0] + '" aria-pressed="' + (period === option[0]) + '">' + option[1] + '</button>';
    }).join('');
    const boxes = [
      ['verified', verified, 'Verified'],
      ['rejected', rejected, 'Rejected'],
      ['awaiting', awaiting, 'Awaiting now'],
      ['avg', avgVerifyLabel(stored), 'Average time to verify']
    ].map(function (box) {
      return '<div class="rep-mini-box" data-rev="' + box[0] + '"><strong>' + esc(box[1]) + '</strong><span>' + box[2] + '</span></div>';
    }).join('');
    return '<section class="card rep-card" data-rep-reviews>' +
      '<div class="card-head"><div><h2>Document reviews</h2><p class="card-sub">Since ' + shortLocal(periodStart()) + '</p></div>' +
        '<div class="rep-tools">' + chips + '</div>' +
      '</div>' +
      '<div class="rep-mini">' + boxes + '</div>' +
      '</section>';
  }

  function auditTable(workers, stored) {
    const events = [];
    stored.forEach(function (doc) {
      const worker = workers.find(function (w) { return w.id === doc.workerId; });
      const name = worker ? D.fullName(worker) : 'Unknown worker';
      events.push({
        at: doc.uploadedAt,
        action: 'Uploaded',
        doc: doc,
        worker: name,
        by: doc.uploadedBy === 'employee' ? name + ' (employee)' : (doc.reviewedBy || 'Recruiter')
      });
      if (doc.uploadedBy === 'employee' && doc.reviewedAt && (doc.status === 'Verified' || doc.status === 'Rejected')) {
        events.push({
          at: doc.reviewedAt,
          action: doc.status,
          doc: doc,
          worker: name,
          by: doc.reviewedBy || 'Recruiter'
        });
      }
      (doc.restores || []).forEach(function (restored) {
        events.push({
          at: restored.at,
          action: 'Restored',
          doc: doc,
          worker: name,
          by: restored.by
        });
      });
    });
    events.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    const rows = events.slice(0, 10).map(function (event) {
      return {
        href: '#/documents/' + encodeURIComponent(event.doc.id),
        cells: [
          esc(S.stamp(event.at)),
          esc(event.action),
          esc(event.doc.type),
          esc(event.worker),
          esc(event.by)
        ],
        csv: [S.stamp(event.at), event.action, event.doc.type, event.worker, event.by]
      };
    });
    return tableCard('audit', 'Last 10 document actions',
      'Who uploaded, verified, rejected or restored what, and when',
      ['When', 'Action', 'Document', 'Worker', 'By'], rows, '', 'No document activity yet');
  }

  function bars(title, sub, list, toneClass) {
    const max = list.length ? list[0].count : 0;
    return '<section class="card rep-card">' +
      '<div class="card-head"><div><h2>' + esc(title) + '</h2><p class="card-sub">' + esc(sub) + '</p></div></div>' +
      '<ul class="rep-bars">' + list.map(function (row) {
        const width = max ? Math.round((row.count / max) * 100) : 0;
        return '<li>' +
          '<span class="rep-bar-label">' + esc(row.label) + '</span>' +
          '<span class="rep-bar-track"><span class="rep-bar' + (row.tone ? ' ' + row.tone : '') + '" style="width:' + width + '%"></span></span>' +
          '<span class="rep-bar-n">' + row.count + ' <small>' + percent(row.count, list.total) + '%</small></span>' +
          '</li>';
      }).join('') + '</ul>' +
      '</section>';
  }

  function nationalityChart(workers) {
    const counts = {};
    workers.forEach(function (worker) {
      const key = worker.nationality || 'Not recorded';
      counts[key] = (counts[key] || 0) + 1;
    });
    const list = Object.keys(counts).map(function (key) { return { label: key, count: counts[key] }; });
    list.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label); });
    list.total = workers.length;
    if (list.length) list[0].tone = '';
    return bars('Workers by nationality', workers.length + ' workers', list);
  }

  function statusChart(workers) {
    const order = ['Complete', 'Review', 'Expiring'];
    const tones = { Complete: 'is-green', Review: 'is-amber', Expiring: 'is-red' };
    const list = order.map(function (label) {
      return {
        label: label,
        count: workers.filter(function (worker) { return D.computeStatus(worker) === label; }).length,
        tone: tones[label]
      };
    }).filter(function (row) { return row.count > 0; });
    list.total = workers.length;
    return bars('Workers by status', 'Complete, needs review or expiring', list);
  }

  function render(context) {
    ctx = context;
    const workers = context.workers || [];
    const stored = S.all();
    const items = D.expiryItems(workers);
    const expiring = items.filter(function (item) { return item.days >= 0 && item.days <= 30; }).length;
    const expired = items.filter(function (item) { return item.days < 0; }).length;
    const complete = workers.filter(function (worker) { return D.computeStatus(worker) === 'Complete'; }).length;
    const awaiting = stored.filter(function (doc) { return doc.status === 'Awaiting review'; }).length;

    const stats = '<div class="stats rep-stats">' +
      tile('Total workers', String(workers.length), 'In this workspace', false) +
      tile('Complete records', percent(complete, workers.length) + '%', complete + ' of ' + workers.length + ' workers', false) +
      tile('Awaiting review', String(awaiting), awaiting === 1 ? 'Document to check' : 'Documents to check', awaiting > 0) +
      tile('Expiring in 30 days', String(expiring), 'Passports, cards and licences', expiring > 0) +
      tile('Expired', String(expired), expired ? 'Worker cannot be scheduled' : 'Nothing expired', expired > 0) +
      '</div>';

    return context.pageHead('Compliance', 'Reports',
      'Live from your worker records and document library · ' + D.formatDate(isoLocal(new Date())) + ' (today)',
      '<button type="button" class="btn btn-quiet" data-rep="print">Print / Save as PDF</button>') +
      stats +
      expiringTable(workers) +
      missingTable(workers) +
      reviewsSection(stored) +
      auditTable(workers, stored) +
      '<div class="rep-charts">' + nationalityChart(workers) + statusChart(workers) + '</div>';
  }

  function csvCell(value) {
    const text = String(value === null || value === undefined ? '' : value);
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportCsv(id) {
    const table = tables[id];
    if (!table) return;
    const lines = [table.headers].concat(table.rows)
      .map(function (row) { return row.map(csvCell).join(','); })
      .join('\r\n');
    const blob = new Blob(['\ufeff' + lines], { type: 'text/csv;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'docuflow-' + id + '-' + isoLocal(new Date()) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }

  document.addEventListener('click', function (event) {
    const el = event.target.closest('[data-rep]');
    if (!el || !ctx) return;
    const action = el.dataset.rep;
    if (action === 'csv') {
      event.preventDefault();
      exportCsv(el.dataset.table);
    } else if (action === 'print') {
      event.preventDefault();
      window.print();
    } else if (action === 'window') {
      windowDays = Number(el.dataset.value);
      ctx.rerender();
    } else if (action === 'period') {
      period = el.dataset.value;
      ctx.rerender();
    }
  });

  window.DocuFlowReports = { render: render, tables: function () { return tables; } };
})();
