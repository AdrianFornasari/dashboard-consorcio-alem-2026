const APP_VERSION = '0.3-tortas-leyenda-derecha-click';
let DATA = null;
let state = { selected: null, from: null, to: null, providerFrom: null, providerTo: null, highlight: { composition: null, providers: null, debtors: null } };

const $ = (id) => document.getElementById(id);
const money = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
const money2 = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const compact = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const pct = (v) => `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v)}%`;

async function init() {
  console.info(`Dashboard Consorcio Alem ${APP_VERSION}`);
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
  $('monthSelect').addEventListener('change', e => { state.selected = e.target.value; clearPieHighlights(); renderAll(); });
  $('fromSelect').addEventListener('change', e => { state.from = e.target.value; renderCompare(); });
  $('toSelect').addEventListener('change', e => { state.to = e.target.value; renderCompare(); });
  $('providerFrom').addEventListener('change', e => { state.providerFrom = e.target.value; state.highlight.providers = null; renderProviders(); });
  $('providerTo').addEventListener('change', e => { state.providerTo = e.target.value; state.highlight.providers = null; renderProviders(); });
  $('providerType').addEventListener('change', () => { state.highlight.providers = null; renderProviders(); });
  $('providerSearch').addEventListener('input', () => { state.highlight.providers = null; renderProviders(); });
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

function clearPieHighlights() {
  state.highlight = { composition: null, providers: null, debtors: null };
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
  const pieRows = groupSmallSlices(rows.map(r => ({ label: r.category, value: r.amount, key: r.category })), 8);
  drawPieChart($('compositionChart'), pieRows, {
    activeKeys: state.highlight.composition,
    onSliceClick: item => handlePieSelection('composition', 'compositionTable', 'compositionLegend', item)
  });
  renderPieLegend('compositionLegend', pieRows, m.totalExpenses, 'composition', 'compositionTable');
  $('compositionTable').innerHTML = `<thead><tr><th>Rubro</th><th>Tipo</th><th class="num">Importe</th><th class="num">%</th></tr></thead><tbody>${rows.map(r => `<tr data-pie-key="${escapeHtml(r.category)}"><td>${r.category}</td><td>${r.type}</td><td class="num">${money2(r.amount)}</td><td class="num">${pct(r.amount / m.totalExpenses * 100)}</td></tr>`).join('')}</tbody>`;
  highlightTableRows('compositionTable', state.highlight.composition);
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
  const providerPieRows = groupSmallSlices(byProvider.map(r => ({ ...r, key: r.label })), 8);
  drawPieChart($('providerChart'), providerPieRows, {
    activeKeys: state.highlight.providers,
    onSliceClick: item => handlePieSelection('providers', 'providerTable', 'providerLegend', item)
  });
  renderPieLegend('providerLegend', providerPieRows, total, 'providers', 'providerTable');
  $('providerTable').innerHTML = `<thead><tr><th>Mes</th><th>Proveedor</th><th>Rubro</th><th>Detalle</th><th>Tipo</th><th class="num">Importe</th></tr></thead><tbody>${filtered.sort((a,b) => a.monthId.localeCompare(b.monthId) || b.amount - a.amount).map(r => `<tr data-pie-key="${escapeHtml(r.provider)}"><td>${r.month}</td><td>${r.provider}</td><td>${r.category}</td><td>${r.detail}</td><td>${r.type}</td><td class="num">${money2(r.amount)}</td></tr>`).join('')}</tbody>`;
  highlightTableRows('providerTable', state.highlight.providers);
}

function renderDebtors() {
  const m = getMonth(state.selected);
  const rows = [...m.debtors].sort((a,b) => b.amount - a.amount);
  const top3 = rows.slice(0,3).reduce((a,b) => a + b.amount, 0);
  const top5 = rows.slice(0,5).reduce((a,b) => a + b.amount, 0);
  $('debtConcentration').innerHTML = `Top 3: <strong>${money2(top3)}</strong> (${pct(top3 / m.debtCapital * 100)} de la deuda) · Top 5: <strong>${money2(top5)}</strong> (${pct(top5 / m.debtCapital * 100)})`;
  const debtorPieRows = groupSmallSlices(rows.map(r => ({ label: `Unidad ${r.unit}`, value: r.amount, key: `Unidad ${r.unit}` })), 7);
  drawPieChart($('debtorsChart'), debtorPieRows, {
    activeKeys: state.highlight.debtors,
    onSliceClick: item => handlePieSelection('debtors', 'debtorsTable', 'debtorsLegend', item)
  });
  renderPieLegend('debtorsLegend', debtorPieRows, m.debtCapital, 'debtors', 'debtorsTable');
  $('debtorsTable').innerHTML = `<thead><tr><th>Unidad funcional</th><th class="num">Capital adeudado</th><th class="num">% del total</th></tr></thead><tbody>${rows.map(r => `<tr data-pie-key="${escapeHtml(`Unidad ${r.unit}`)}"><td>Unidad ${r.unit}</td><td class="num">${money2(r.amount)}</td><td class="num">${pct(r.amount / m.debtCapital * 100)}</td></tr>`).join('')}</tbody>`;
  highlightTableRows('debtorsTable', state.highlight.debtors);
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


function drawPieChart(canvas, items, options = {}) {
  if (!canvas || !canvas.offsetParent) return;
  const rows = items.filter(r => r.value > 0);
  const { ctx, w, h } = prepareCanvas(canvas, getResponsiveChartHeight(canvas, 280));
  ctx.clearRect(0, 0, w, h);
  canvas.style.cursor = rows.length ? 'pointer' : 'default';
  if (!rows.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Sin datos para graficar', w / 2, h / 2);
    canvas._pieSlices = [];
    return;
  }

  const total = rows.reduce((acc, r) => acc + r.value, 0);
  const palette = getPalette();
  const radius = Math.min(w, h) * (w < 520 ? 0.36 : 0.39);
  const innerRadius = radius * 0.52;
  const cx = w / 2;
  const cy = h / 2;
  let start = -Math.PI / 2;
  const active = options.activeKeys || [];
  const activeSet = new Set(active);
  const slices = [];

  rows.forEach((r, i) => {
    const angle = (r.value / total) * Math.PI * 2;
    const end = start + angle;
    const keys = getItemKeys(r);
    const isActive = keys.some(k => activeSet.has(k));

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.strokeStyle = isActive ? '#0f172a' : '#ffffff';
    ctx.lineWidth = isActive ? 4 : 2;
    ctx.stroke();
    slices.push({ item: r, start, end, cx, cy, radius, innerRadius });
    start = end;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Total', cx, cy - 4);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px system-ui';
  ctx.fillText(compact(total), cx, cy + 16);

  canvas._pieSlices = slices;
  canvas._pieClickOptions = options;
  if (canvas._pieClickHandler) canvas.removeEventListener('click', canvas._pieClickHandler);
  canvas._pieClickHandler = event => {
    const hit = getPieSliceFromEvent(canvas, event);
    if (!hit || !canvas._pieClickOptions?.onSliceClick) return;
    canvas._pieClickOptions.onSliceClick(hit.item);
  };
  canvas.addEventListener('click', canvas._pieClickHandler);
}

function getPieSliceFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const slices = canvas._pieSlices || [];
  if (!slices.length) return null;
  const { cx, cy, radius, innerRadius } = slices[0];
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < innerRadius || dist > radius) return null;
  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) angle += Math.PI * 2;
  return slices.find(s => angle >= s.start && angle <= s.end) || null;
}

function renderPieLegend(containerId, items, total, scope = null, tableId = null) {
  const el = $(containerId);
  if (!el) return;
  const palette = getPalette();
  const rows = items.filter(r => r.value > 0);
  if (!rows.length) {
    el.innerHTML = '<span class="muted">Sin datos para mostrar.</span>';
    return;
  }
  const denominator = total || rows.reduce((acc, r) => acc + r.value, 0);
  const activeSet = new Set(scope ? (state.highlight[scope] || []) : []);
  el.innerHTML = rows.map((r, i) => {
    const keys = getItemKeys(r);
    const isActive = keys.some(k => activeSet.has(k));
    return `
      <button type="button" class="legend-item ${isActive ? 'active' : ''}" data-pie-keys="${escapeHtml(keys.join('||'))}" title="${escapeHtml(r.label)}: ${money2(r.value)}">
        <span class="legend-swatch" style="background:${palette[i % palette.length]}"></span>
        <span class="legend-label">${escapeHtml(r.label)}</span>
        <span class="legend-value">${pct(r.value / denominator * 100)}</span>
      </button>
    `;
  }).join('');

  if (scope && tableId) {
    el.querySelectorAll('.legend-item').forEach((button, index) => {
      button.addEventListener('click', () => handlePieSelection(scope, tableId, containerId, rows[index]));
    });
  }
}

function groupSmallSlices(items, limit = 8) {
  const rows = items
    .filter(r => r.value > 0)
    .map(r => ({ ...r, key: r.key || r.label, keys: r.keys || [r.key || r.label] }))
    .sort((a, b) => b.value - a.value);
  if (rows.length <= limit) return rows;
  const visible = rows.slice(0, limit - 1);
  const hidden = rows.slice(limit - 1);
  const other = hidden.reduce((acc, r) => acc + r.value, 0);
  const otherKeys = hidden.flatMap(r => getItemKeys(r));
  return [...visible, { label: 'Otros', value: other, key: 'Otros', keys: otherKeys }];
}

function getItemKeys(item) {
  if (!item) return [];
  if (Array.isArray(item.keys)) return item.keys;
  return [item.key || item.label];
}

function handlePieSelection(scope, tableId, legendId, item) {
  const keys = getItemKeys(item);
  state.highlight[scope] = keys;
  highlightTableRows(tableId, keys, true);
  highlightLegend(legendId, keys);
}

function highlightTableRows(tableId, keys, scrollToFirst = false) {
  const table = $(tableId);
  if (!table) return;
  const keySet = new Set(keys || []);
  let first = null;
  table.querySelectorAll('tbody tr').forEach(row => {
    const match = keySet.has(row.dataset.pieKey);
    row.classList.toggle('row-highlight', match);
    if (match && !first) first = row;
  });
  if (scrollToFirst && first) {
    first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function highlightLegend(containerId, keys) {
  const el = $(containerId);
  if (!el) return;
  const keySet = new Set(keys || []);
  el.querySelectorAll('.legend-item').forEach(item => {
    const itemKeys = (item.dataset.pieKeys || '').split('||').filter(Boolean);
    item.classList.toggle('active', itemKeys.some(k => keySet.has(k)));
  });
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
    return Math.round(Math.max(190, Math.min(235, width * 0.62)));
  }
  return Math.round(Math.max(220, Math.min(preferred, width * 0.46)));
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
