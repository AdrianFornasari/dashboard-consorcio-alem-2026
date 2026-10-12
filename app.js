let DATA = null;
let state = { selected: null, from: null, to: null, providerFrom: null, providerTo: null };

const $ = (id) => document.getElementById(id);
const money = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
const money2 = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const compact = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const pct = (v) => `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v)}%`;

async function init() {
  try {
    const res = await fetch('data/expensas-2026.json', { cache: 'no-store' });
    DATA = await res.json();
  } catch (err) {
    document.body.innerHTML = `<main class="panel"><h1>No se pudo cargar data/expensas-2026.json</h1><p>Si lo estás abriendo como archivo local, probalo con un servidor local o en GitHub Pages.</p><pre>${err}</pre></main>`;
    return;
  }

  const months = DATA.months;
  state.selected = months[months.length - 1].id;
  state.from = months[0].id;
  state.to = months[months.length - 1].id;
  state.providerFrom = months[0].id;
  state.providerTo = months[months.length - 1].id;

  populateSelects();
  bindEvents();
  renderAll();
}

function populateSelects() {
  const ids = ['monthSelect', 'fromSelect', 'toSelect', 'providerFrom', 'providerTo'];
  for (const id of ids) {
    const sel = $(id);
    sel.innerHTML = DATA.months.map(m => `<option value="${m.id}">${m.label}</option>`).join('');
  }
  $('monthSelect').value = state.selected;
  $('fromSelect').value = state.from;
  $('toSelect').value = state.to;
  $('providerFrom').value = state.providerFrom;
  $('providerTo').value = state.providerTo;
  $('lastUpdate').textContent = `Datos cargados hasta ${getMonth(state.selected).label}.`;
}

function bindEvents() {
  $('monthSelect').addEventListener('change', e => { state.selected = e.target.value; renderAll(); });
  $('fromSelect').addEventListener('change', e => { state.from = e.target.value; renderCompare(); });
  $('toSelect').addEventListener('change', e => { state.to = e.target.value; renderCompare(); });
  $('providerFrom').addEventListener('change', e => { state.providerFrom = e.target.value; renderProviders(); });
  $('providerTo').addEventListener('change', e => { state.providerTo = e.target.value; renderProviders(); });
  $('providerType').addEventListener('change', renderProviders);
  $('providerSearch').addEventListener('input', renderProviders);
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(btn.dataset.tab).classList.add('active');
      // redraw canvases after layout becomes visible
      requestAnimationFrame(renderAll);
    });
  });
}

function getMonth(id) { return DATA.months.find(m => m.id === id); }
function monthRange(from, to) {
  const a = DATA.months.findIndex(m => m.id === from);
  const b = DATA.months.findIndex(m => m.id === to);
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  return DATA.months.slice(start, end + 1);
}

function renderAll() {
  $('lastUpdate').textContent = `Datos cargados hasta ${getMonth(DATA.meta.lastLoadedMonth).label}.`;
  renderOverview();
  renderCompare();
  renderComposition();
  renderProviders();
  renderDebtors();
  renderDocs();
}

function renderOverview() {
  const m = getMonth(state.selected);
  const expenseCoverage = m.totalExpenses ? m.cashFinal / m.totalExpenses * 100 : null;
  const netCoverage = m.totalExpenses ? m.netCash / m.totalExpenses * 100 : null;
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const debtRecovered = m.debtRecovered || 0;
  const prev = DATA.months[DATA.months.findIndex(x => x.id === m.id) - 1];
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;

  const cards = [
    { label: 'Caja final', value: money2(m.cashFinal), sub: `Bruta al cierre de ${m.label}`, cls: 'ok' },
    { label: 'Caja neta', value: money2(m.netCash), sub: `Caja menos cuentas por pagar: ${money2(m.accountsPayable)}`, cls: m.netCash < m.totalExpenses * 0.5 ? 'warn' : 'ok' },
    { label: 'Deuda de capital', value: money2(m.debtCapital), sub: debtDelta == null ? 'Sin mes anterior' : `${debtDelta < 0 ? 'Bajó' : 'Subió'} ${money2(Math.abs(debtDelta))} vs mes anterior`, cls: debtDelta < 0 ? 'ok' : 'danger' },
    { label: 'Gasto total', value: money2(m.totalExpenses), sub: `${pct(extraShare)} extraordinario`, cls: extraShare > 25 ? 'warn' : '' },
    { label: 'Gasto ordinario', value: money2(m.ordinaryExpenses), sub: 'Funcionamiento mensual', cls: '' },
    { label: 'Gasto extraordinario', value: money2(m.extraordinaryExpenses), sub: 'Reparaciones / acopios', cls: extraShare > 25 ? 'warn' : '' },
    { label: 'Recupero deuda', value: money2(debtRecovered), sub: 'Expensas adeudadas cobradas', cls: debtRecovered > 1000000 ? 'ok' : '' },
    { label: 'Intereses cobrados', value: money2(m.interestCollected), sub: 'Cobranza de intereses del mes', cls: '' }
  ];
  $('kpiGrid').innerHTML = cards.map(c => `<div class="kpi ${c.cls || ''}"><div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub}</div></div>`).join('');
  $('monthNote').textContent = m.notes;
  $('monthRatios').innerHTML = [
    ['Cobertura caja bruta / gastos', expenseCoverage == null ? '—' : pct(expenseCoverage)],
    ['Cobertura caja neta / gastos', netCoverage == null ? '—' : pct(netCoverage)],
    ['Cuentas por pagar', money2(m.accountsPayable)],
    ['Intereses a cobrar', money2(m.interestReceivable)],
    ['Expensas corrientes a cobrar', money2(m.currentReceivables)]
  ].map(([a,b]) => `<div class="ratio"><span>${a}</span><strong>${b}</strong></div>`).join('');

  const trend = DATA.months.map(x => ({ label: x.monthShort, caja: x.netCash, deuda: x.debtCapital, gastos: x.totalExpenses }));
  drawLineChart($('trendChart'), trend, [
    { key: 'caja', label: 'Caja neta' },
    { key: 'deuda', label: 'Deuda' },
    { key: 'gastos', label: 'Gastos' }
  ]);
}

function renderCompare() {
  const rows = monthRange(state.from, state.to);
  if (!rows.length) return;
  const first = rows[0], last = rows[rows.length - 1];
  const sum = key => rows.reduce((acc, m) => acc + (m[key] || 0), 0);
  const avg = key => sum(key) / rows.length;
  const debtDelta = last.debtCapital - first.debtCapital;
  const cashDelta = last.netCash - first.netCash;
  const maxExpense = rows.reduce((a,b) => a.totalExpenses > b.totalExpenses ? a : b);
  const maxDebt = rows.reduce((a,b) => a.debtCapital > b.debtCapital ? a : b);
  const bestCash = rows.reduce((a,b) => a.netCash > b.netCash ? a : b);
  const cards = [
    { label: 'Variación deuda', value: money2(debtDelta), sub: `${first.label} → ${last.label}`, cls: debtDelta < 0 ? 'ok' : 'danger' },
    { label: 'Variación caja neta', value: money2(cashDelta), sub: `${first.label} → ${last.label}`, cls: cashDelta > 0 ? 'ok' : 'warn' },
    { label: 'Gasto acumulado', value: money2(sum('totalExpenses')), sub: `${rows.length} meses`, cls: '' },
    { label: 'Recupero deuda', value: money2(sum('debtRecovered')), sub: 'Total período', cls: 'ok' },
    { label: 'Extraordinarios', value: money2(sum('extraordinaryExpenses')), sub: `${pct(sum('extraordinaryExpenses') / sum('totalExpenses') * 100)} del gasto`, cls: sum('extraordinaryExpenses') / sum('totalExpenses') > .25 ? 'warn' : '' }
  ];
  $('compareGrid').innerHTML = cards.map(c => `<div class="kpi ${c.cls || ''}"><div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub}</div></div>`).join('');

  const tableRows = [
    ['Promedio mensual de gastos', money2(avg('totalExpenses'))],
    ['Total gastos ordinarios', money2(sum('ordinaryExpenses'))],
    ['Total gastos extraordinarios', money2(sum('extraordinaryExpenses'))],
    ['Total intereses cobrados', money2(sum('interestCollected'))],
    ['Mes con mayor gasto', `${maxExpense.label} (${money2(maxExpense.totalExpenses)})`],
    ['Mes con mayor deuda', `${maxDebt.label} (${money2(maxDebt.debtCapital)})`],
    ['Mejor caja neta', `${bestCash.label} (${money2(bestCash.netCash)})`]
  ];
  $('compareTable').innerHTML = `<thead><tr><th>Indicador</th><th class="num">Resultado</th></tr></thead><tbody>${tableRows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</tbody>`;
}

function renderComposition() {
  const m = getMonth(state.selected);
  const rows = [...m.composition].sort((a,b) => b.amount - a.amount);
  const pieRows = groupSmallSlices(rows.map(r => ({ label: r.category, value: r.amount })), 8);
  drawPieChart($('compositionChart'), pieRows);
  renderPieLegend('compositionLegend', pieRows, m.totalExpenses);
  $('compositionTable').innerHTML = `<thead><tr><th>Rubro</th><th>Tipo</th><th class="num">Importe</th><th class="num">%</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.category}</td><td>${r.type}</td><td class="num">${money2(r.amount)}</td><td class="num">${pct(r.amount / m.totalExpenses * 100)}</td></tr>`).join('')}</tbody>`;
}

function renderProviders() {
  const rows = monthRange(state.providerFrom, state.providerTo).flatMap(m => m.providers.map(p => ({ ...p, month: m.label, monthId: m.id })));
  const type = $('providerType').value;
  const search = $('providerSearch').value.trim().toLowerCase();
  const filtered = rows.filter(r => (!type || r.type === type) && (!search || `${r.provider} ${r.category} ${r.detail}`.toLowerCase().includes(search)));
  const total = filtered.reduce((a,b) => a + b.amount, 0);
  const byProvider = Object.values(filtered.reduce((acc, r) => {
    if (!acc[r.provider]) acc[r.provider] = { label: r.provider, value: 0 };
    acc[r.provider].value += r.amount;
    return acc;
  }, {})).sort((a,b) => b.value - a.value);
  $('providerSummary').innerHTML = `<strong>${filtered.length}</strong> movimientos · Total filtrado: <strong>${money2(total)}</strong> · Proveedores: <strong>${byProvider.length}</strong>`;
  const providerPieRows = groupSmallSlices(byProvider, 8);
  drawPieChart($('providerChart'), providerPieRows);
  renderPieLegend('providerLegend', providerPieRows, total);
  $('providerTable').innerHTML = `<thead><tr><th>Mes</th><th>Proveedor</th><th>Rubro</th><th>Detalle</th><th>Tipo</th><th class="num">Importe</th></tr></thead><tbody>${filtered.sort((a,b) => a.monthId.localeCompare(b.monthId) || b.amount - a.amount).map(r => `<tr><td>${r.month}</td><td>${r.provider}</td><td>${r.category}</td><td>${r.detail}</td><td>${r.type}</td><td class="num">${money2(r.amount)}</td></tr>`).join('')}</tbody>`;
}

function renderDebtors() {
  const m = getMonth(state.selected);
  const rows = [...m.debtors].sort((a,b) => b.amount - a.amount);
  const top3 = rows.slice(0,3).reduce((a,b) => a + b.amount, 0);
  const top5 = rows.slice(0,5).reduce((a,b) => a + b.amount, 0);
  $('debtConcentration').innerHTML = `Top 3: <strong>${money2(top3)}</strong> (${pct(top3 / m.debtCapital * 100)} de la deuda) · Top 5: <strong>${money2(top5)}</strong> (${pct(top5 / m.debtCapital * 100)})`;
  const debtorPieRows = groupSmallSlices(rows.map(r => ({ label: `Unidad ${r.unit}`, value: r.amount })), 7);
  drawPieChart($('debtorsChart'), debtorPieRows);
  renderPieLegend('debtorsLegend', debtorPieRows, m.debtCapital);
  $('debtorsTable').innerHTML = `<thead><tr><th>Unidad funcional</th><th class="num">Capital adeudado</th><th class="num">% del total</th></tr></thead><tbody>${rows.map(r => `<tr><td>Unidad ${r.unit}</td><td class="num">${money2(r.amount)}</td><td class="num">${pct(r.amount / m.debtCapital * 100)}</td></tr>`).join('')}</tbody>`;
}

function renderDocs() {
  $('docsTable').innerHTML = `<thead><tr><th>Mes</th><th>PDF expensas</th><th>Informe mensual</th><th>Comentario</th></tr></thead><tbody>${DATA.months.map(m => `<tr><td>${m.label}</td><td>${m.pdf ? `<a href="${m.pdf}" target="_blank">Abrir PDF</a>` : '<span class="muted">Pendiente de copiar</span>'}</td><td>${m.report ? `<a href="${m.report}" target="_blank">Abrir informe</a>` : '<span class="muted">Pendiente</span>'}</td><td>${m.notes}</td></tr>`).join('')}</tbody>`;
}

function drawLineChart(canvas, data, series) {
  if (!canvas || !canvas.offsetParent) return;
  const { ctx, w, h } = prepareCanvas(canvas, getResponsiveChartHeight(canvas, 260));
  const pad = { l: 56, r: 18, t: 24, b: 42 };
  ctx.clearRect(0, 0, w, h);
  const values = data.flatMap(d => series.map(s => d[s.key] || 0));
  const max = Math.max(...values) * 1.1;
  const min = 0;
  drawAxes(ctx, w, h, pad, max);
  const colors = ['#0f766e', '#b91c1c', '#1d4ed8'];
  series.forEach((s, idx) => {
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.l + (i / Math.max(1, data.length - 1)) * (w - pad.l - pad.r);
      const y = h - pad.b - ((d[s.key] - min) / (max - min)) * (h - pad.t - pad.b);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = colors[idx % colors.length];
    ctx.lineWidth = 3;
    ctx.stroke();
    data.forEach((d, i) => {
      const x = pad.l + (i / Math.max(1, data.length - 1)) * (w - pad.l - pad.r);
      const y = h - pad.b - ((d[s.key] - min) / (max - min)) * (h - pad.t - pad.b);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = colors[idx % colors.length]; ctx.fill();
    });
  });
  ctx.fillStyle = '#475569'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = pad.l + (i / Math.max(1, data.length - 1)) * (w - pad.l - pad.r);
    ctx.fillText(d.label, x, h - 14);
  });
  drawLegend(ctx, series.map((s, i) => ({ label: s.label, color: colors[i % colors.length] })), pad.l, 12);
}


function drawPieChart(canvas, items) {
  if (!canvas || !canvas.offsetParent) return;
  const rows = items.filter(r => r.value > 0);
  const { ctx, w, h } = prepareCanvas(canvas, getResponsiveChartHeight(canvas, 280));
  ctx.clearRect(0, 0, w, h);
  if (!rows.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos para graficar', w / 2, h / 2);
    return;
  }

  const total = rows.reduce((acc, r) => acc + r.value, 0);
  const palette = getPalette();
  const radius = Math.min(w, h) * (w < 520 ? 0.34 : 0.38);
  const cx = w / 2;
  const cy = h / 2;
  let start = -Math.PI / 2;

  rows.forEach((r, i) => {
    const angle = (r.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    start += angle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Total', cx, cy - 4);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui';
  ctx.fillText(compact(total), cx, cy + 16);
}

function renderPieLegend(containerId, items, total) {
  const el = $(containerId);
  if (!el) return;
  const palette = getPalette();
  const rows = items.filter(r => r.value > 0);
  if (!rows.length) {
    el.innerHTML = '<span class="muted">Sin datos para mostrar.</span>';
    return;
  }
  const denominator = total || rows.reduce((acc, r) => acc + r.value, 0);
  el.innerHTML = rows.map((r, i) => `
    <div class="legend-item" title="${escapeHtml(r.label)}: ${money2(r.value)}">
      <span class="legend-swatch" style="background:${palette[i % palette.length]}"></span>
      <span class="legend-label">${escapeHtml(r.label)}</span>
      <span class="legend-value">${pct(r.value / denominator * 100)}</span>
    </div>
  `).join('');
}

function groupSmallSlices(items, limit = 8) {
  const rows = items.filter(r => r.value > 0).sort((a, b) => b.value - a.value);
  if (rows.length <= limit) return rows;
  const visible = rows.slice(0, limit - 1);
  const other = rows.slice(limit - 1).reduce((acc, r) => acc + r.value, 0);
  return [...visible, { label: 'Otros', value: other }];
}

function prepareCanvas(canvas, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = `${cssHeight}px`;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = cssHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function getResponsiveChartHeight(canvas, preferred) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement?.clientWidth || 320;
  if (window.innerWidth <= 620) {
    return Math.round(Math.max(210, Math.min(260, width * 0.68)));
  }
  return Math.round(Math.max(240, Math.min(preferred, width * 0.48)));
}

function getPalette() {
  return ['#0f766e', '#1d4ed8', '#b45309', '#7c3aed', '#be123c', '#0891b2', '#65a30d', '#c2410c', '#475569'];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function drawAxes(ctx, w, h, pad, max) {
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b'; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = h - pad.b - (i / 4) * (h - pad.t - pad.b);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.fillText(compact(max * i / 4), pad.l - 8, y + 4);
  }
}

function drawLegend(ctx, items, x, y) {
  ctx.textAlign = 'left'; ctx.font = '12px system-ui';
  let offset = 0;
  items.forEach(item => {
    ctx.fillStyle = item.color; ctx.fillRect(x + offset, y, 10, 10);
    ctx.fillStyle = '#334155'; ctx.fillText(item.label, x + offset + 14, y + 10);
    offset += ctx.measureText(item.label).width + 42;
  });
}

function truncate(text, n) { return text.length > n ? text.slice(0, n - 1) + '…' : text; }

window.addEventListener('resize', () => requestAnimationFrame(renderAll));
init();
