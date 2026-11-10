// Client-side exports for report rows and invoices. A backend can later return real files instead.
const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  // Stop spreadsheet formula injection from text that starts with = + - @
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map((c) => esc(c.label)).join(',')];
  rows.forEach((r) => lines.push(columns.map((c) => esc(r[c.key])).join(',')));
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const html = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Opens a print-ready page. "Save as PDF" in the print dialog gives the PDF. Returns false if pop-ups are blocked. */
export function printDocument(title, bodyHtml) {
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${html(title)}</title><style>
    body{font:13px/1.5 system-ui,Segoe UI,Roboto,sans-serif;color:#15201B;margin:32px}
    h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;margin:24px 0 8px}p{margin:2px 0;color:#5A6B62}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:6px 8px;border-bottom:1px solid #DDE2DD;text-align:left;vertical-align:top}
    th{font-size:11px;text-transform:uppercase;color:#5A6B62}.r{text-align:right}.brand{color:#0F6B4F;font-weight:700}
    .sum{display:flex;gap:24px;flex-wrap:wrap;margin:12px 0}.sum div{min-width:120px}.sum b{display:block;font-size:16px}
    @media print{body{margin:12mm}}</style></head><body>${bodyHtml}<script>window.onload=function(){window.focus();window.print();}</script></body></html>`);
  w.document.close();
  return true;
}

export function reportToHtml({ title, subtitle, columns, rows, summary = [] }) {
  const sum = summary.length ? `<div class="sum">${summary.map((s) => `<div><span>${html(s.label)}</span><b>${html(s.value)}</b></div>`).join('')}</div>` : '';
  const head = columns.map((c) => `<th>${html(c.label)}</th>`).join('');
  const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${html(r[c.key])}</td>`).join('')}</tr>`).join('');
  return `<p class="brand">BizPulse</p><h1>${html(title)}</h1><p>${html(subtitle)}</p>${sum}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function invoiceToHtml(inv, money) {
  return `<p class="brand">BizPulse</p><h1>Invoice ${html(inv.number)}</h1>
  <p>Status: ${html(inv.status)}</p><p>Issued: ${html(inv.issuedAt?.slice(0, 10))} · Due: ${html(inv.dueDate?.slice(0, 10))}${inv.paidAt ? ` · Paid: ${html(inv.paidAt.slice(0, 10))}` : ''}</p>
  <h2>Billed to</h2><p><b>${html(inv.clientName)}</b></p>
  <table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody><tr><td>${html(inv.description)}</td><td class="r">${html(money(inv.amount))}</td></tr></tbody></table>
  <h2 class="r">Total ${html(money(inv.amount))}</h2>`;
}
