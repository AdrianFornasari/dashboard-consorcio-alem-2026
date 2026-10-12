const APP_VERSION = '0.6.0-codespaces-5-mejoras';
let DATA = null;
let state = { selected: null, from: null, to: null, monthA: null, monthB: null, providerFrom: null, providerTo: null, globalSearch: '', decisions: [], highlight: { composition: null, providers: null, debtors: null } };

const $ = (id) => document.getElementById(id);
const money = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
const money2 = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const compact = (v) => v == null ? "—" : new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
const pct = (v) => v == null || !Number.isFinite(v) ? '—' : `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v)}%`;
const signedMoney = (v) => `${v >= 0 ? '+' : '-'}${money2(Math.abs(v))}`;
const signedPct = (v) => `${v >= 0 ? '+' : ''}${pct(v)}`;

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
  state.monthA = months.length > 1 ? months[months.length - 2].id : months[0].id;
  state.monthB = months[months.length - 1].id;
  state.providerFrom = months[0].id;
  state.providerTo = months[months.length - 1].id;

  state.decisions = loadDecisions();
  populateSelects();
  bindEvents();
  renderAll();
}

function populateSelects() {
  const ids = ['monthSelect', 'fromSelect', 'toSelect', 'monthASelect', 'monthBSelect', 'providerFrom', 'providerTo'];
  for (const id of ids) {
    const sel = $(id);
    sel.innerHTML = DATA.months.map(m => `<option value="${m.id}">${m.label}</option>`).join('');
  }
  $('monthSelect').value = state.selected;
  $('fromSelect').value = state.from;
  $('toSelect').value = state.to;
  $('monthASelect').value = state.monthA;
  $('monthBSelect').value = state.monthB;
  $('providerFrom').value = state.providerFrom;
  $('providerTo').value = state.providerTo;
  $('lastUpdate').textContent = `Datos cargados hasta ${getMonth(state.selected).label}.`;
}

function bindEvents() {
  $('monthSelect').addEventListener('change', e => { state.selected = e.target.value; clearPieHighlights(); renderAll(); });
  $('fromSelect').addEventListener('change', e => { state.from = e.target.value; renderCompare(); });
  $('toSelect').addEventListener('change', e => { state.to = e.target.value; renderCompare(); });
  $('monthASelect').addEventListener('change', e => { state.monthA = e.target.value; renderMonthPair(); });
  $('monthBSelect').addEventListener('change', e => { state.monthB = e.target.value; renderMonthPair(); });
  $('providerFrom').addEventListener('change', e => { state.providerFrom = e.target.value; state.highlight.providers = null; renderProviders(); });
  $('providerTo').addEventListener('change', e => { state.providerTo = e.target.value; state.highlight.providers = null; renderProviders(); });
  $('providerType').addEventListener('change', () => { state.highlight.providers = null; renderProviders(); });
  $('providerSearch').addEventListener('input', () => { state.highlight.providers = null; renderProviders(); });
  $('globalSearch').addEventListener('input', e => { state.globalSearch = e.target.value.trim(); renderGlobalSearch(); });
  $('clearSearchButton').addEventListener('click', () => { state.globalSearch = ''; $('globalSearch').value = ''; renderGlobalSearch(); });
  $('printButton').addEventListener('click', preparePrintAndOpenDialog);
  $('printMonthFileButton').addEventListener('click', () => { showTab('monthlyFile'); preparePrintAndOpenDialog(); });
  $('addDecisionButton').addEventListener('click', addDecisionFromForm);
  $('providerRankingTable').addEventListener('click', e => {
    const row = e.target.closest('[data-provider-row]');
    if (!row) return;
    state.highlight.providers = [row.dataset.providerRow];
    $('providerSearch').value = '';
    $('providerType').value = '';
    showTab('providers');
    renderProviders();
  });
  $('decisionsTable').addEventListener('click', e => {
    const button = e.target.closest('[data-delete-decision]');
    if (!button) return;
    deleteDecision(button.dataset.deleteDecision);
  });
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

  window.addEventListener('beforeprint', preparePrintLayout);
  window.addEventListener('afterprint', restoreScreenLayoutAfterPrint);
}

function showTab(tabId) {
  const button = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const panel = $(tabId);
  if (!button || !panel) return;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  button.classList.add('active');
  panel.classList.add('active');
}

function preparePrintAndOpenDialog() {
  preparePrintLayout();
  setTimeout(() => window.print(), 120);
}

function preparePrintLayout() {
  document.body.classList.add('printing');
  renderAll();
}

function restoreScreenLayoutAfterPrint() {
  document.body.classList.remove('printing');
  renderAll();
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
  renderMonthlyFile();
  renderCompare();
  renderMonthPair();
  renderComposition();
  renderProviders();
  renderProviderRanking();
  renderDebtors();
  renderMeeting();
  renderDecisions();
  renderQuality();
  renderDocs();
  renderDocsStatus();
  renderGlobalSearch();
}

function renderOverview() {
  const m = getMonth(state.selected);
  const prev = previousMonth(m.id);
  const expenseCoverage = m.totalExpenses ? m.cashFinal / m.totalExpenses * 100 : null;
  const netCoverage = m.totalExpenses ? m.netCash / m.totalExpenses * 100 : null;
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const debtRecovered = m.debtRecovered || 0;
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;

  renderAlerts(m, prev);
  renderMonthComparison(m, prev);

  const cards = [
    { label: 'Caja final', value: money2(m.cashFinal), sub: `Bruta al cierre de ${m.label}`, cls: 'ok' },
    { label: 'Caja neta', value: money2(m.netCash), sub: `Caja menos cuentas por pagar: ${money2(m.accountsPayable)}`, cls: m.netCash < m.totalExpenses * 0.5 ? 'danger' : (m.netCash < m.totalExpenses ? 'warn' : 'ok') },
    { label: 'Deuda de capital', value: money2(m.debtCapital), sub: debtDelta == null ? 'Sin mes anterior' : `${debtDelta < 0 ? 'Bajó' : 'Subió'} ${money2(Math.abs(debtDelta))} vs mes anterior`, cls: debtDelta < 0 ? 'ok' : 'danger' },
    { label: 'Gasto total', value: money2(m.totalExpenses), sub: `${pct(extraShare)} extraordinario`, cls: extraShare > 25 ? 'warn' : '' },
    { label: 'Gasto ordinario', value: money2(m.ordinaryExpenses), sub: 'Funcionamiento mensual', cls: '' },
    { label: 'Gasto extraordinario', value: money2(m.extraordinaryExpenses), sub: 'Reparaciones / acopios', cls: extraShare > 25 ? 'warn' : '' },
    { label: 'Recupero deuda', value: money2(debtRecovered), sub: 'Expensas adeudadas cobradas', cls: debtRecovered > 1000000 ? 'ok' : '' },
    { label: 'Intereses cobrados', value: money2(m.interestCollected), sub: 'Cobranza de intereses del mes', cls: '' }
  ];
  $('kpiGrid').innerHTML = cards.map(c => `<div class="kpi ${c.cls || ''}"><div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub}</div></div>`).join('');

  $('monthReading').innerHTML = buildMonthReading(m, prev);
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


function renderMonthlyFile() {
  const m = getMonth(state.selected);
  const prev = previousMonth(m.id);
  if (!$('monthlyFileHeader')) return;
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;
  const cashDelta = prev ? m.netCash - prev.netCash : null;
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const debtRows = [...(m.debtors || [])].sort((a,b) => b.amount - a.amount);
  const topDebtors = debtRows.slice(0,5);
  const topProviders = [...(m.providers || [])].sort((a,b) => b.amount - a.amount).slice(0,5);
  const positives = [];
  const warnings = [];
  if (debtDelta != null && debtDelta < 0) positives.push(`Bajó la deuda de capital ${money2(Math.abs(debtDelta))}.`);
  if (cashDelta != null && cashDelta > 0) positives.push(`Subió la caja neta ${money2(cashDelta)}.`);
  if ((m.debtRecovered || 0) > 0) positives.push(`Se recuperaron ${money2(m.debtRecovered)} de expensas adeudadas.`);
  if (debtDelta != null && debtDelta > 0) warnings.push(`Subió la deuda de capital ${money2(debtDelta)}.`);
  if (extraShare > 25) warnings.push(`Extraordinarios elevados: ${pct(extraShare)} del gasto mensual.`);
  if (m.accountsPayable > 0) warnings.push(`Cuentas por pagar al cierre: ${money2(m.accountsPayable)}.`);
  if (!positives.length) positives.push('Sin mejora automática destacada con las reglas actuales.');
  if (!warnings.length) warnings.push('Sin alertas automáticas relevantes.');
  $('monthlyFileHeader').innerHTML = `
    <div>
      <span class="eyebrow-light">Mes seleccionado</span>
      <h3>${escapeHtml(m.label)}</h3>
      <p>${escapeHtml(m.notes || 'Sin comentario mensual cargado.')}</p>
    </div>
    <div class="monthly-file-actions">
      ${m.pdf ? `<a href="${m.pdf}" target="_blank">Abrir PDF de expensas</a>` : '<span class="muted">PDF no enlazado</span>'}
      ${m.report ? `<a href="${m.report}" target="_blank">Abrir informe mensual</a>` : '<span class="muted">Informe pendiente</span>'}
    </div>
  `;
  const cards = [
    ['Qué pasó', `Gasto total ${money2(m.totalExpenses)}, caja neta ${money2(m.netCash)} y deuda capital ${money2(m.debtCapital)}.`],
    ['Qué mejoró', positives.join(' ')],
    ['Qué empeoró / alerta', warnings.join(' ')],
    ['Gastos principales', topProviders.map(p => `${p.provider}: ${money2(p.amount)}`).join(' · ') || 'Sin proveedores cargados.'],
    ['Situación de deuda', `Top 5 unidades: ${money2(topDebtors.reduce((a,b)=>a+b.amount,0))}. Cantidad de unidades deudoras: ${debtRows.length}.`],
    ['Documentos asociados', `${m.pdf ? 'PDF disponible' : 'PDF pendiente'} · ${m.report ? 'Informe disponible' : 'Informe pendiente'}.`]
  ];
  $('monthlyFileGrid').innerHTML = cards.map(([title, text]) => `<div class="monthly-file-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`).join('');
  $('monthlyFileExpensesTable').innerHTML = `<thead><tr><th>Proveedor / rubro</th><th>Tipo</th><th class="num">Importe</th></tr></thead><tbody>${topProviders.map(p => `<tr><td><strong>${escapeHtml(p.provider)}</strong><br><span class="muted">${escapeHtml(p.category)} · ${escapeHtml(p.detail || '')}</span></td><td>${escapeHtml(p.type)}</td><td class="num">${money2(p.amount)}</td></tr>`).join('')}</tbody>`;
  $('monthlyFileDebtorsTable').innerHTML = `<thead><tr><th>Unidad</th><th class="num">Capital adeudado</th><th class="num">%</th></tr></thead><tbody>${topDebtors.map(d => `<tr><td>Unidad ${escapeHtml(d.unit)}</td><td class="num">${money2(d.amount)}</td><td class="num">${pct(d.amount / m.debtCapital * 100)}</td></tr>`).join('')}</tbody>`;
}

function renderMonthPair() {
  const a = getMonth(state.monthA);
  const b = getMonth(state.monthB);
  if (!a || !b || !$('monthPairGrid')) return;
  const metrics = [
    ['Caja final', 'cashFinal', true],
    ['Caja neta', 'netCash', true],
    ['Deuda capital', 'debtCapital', false],
    ['Gastos totales', 'totalExpenses', false],
    ['Gastos ordinarios', 'ordinaryExpenses', false],
    ['Extraordinarios', 'extraordinaryExpenses', false],
    ['Cuentas por pagar', 'accountsPayable', false],
    ['Recupero deuda', 'debtRecovered', true],
    ['Intereses cobrados', 'interestCollected', true]
  ];
  const cards = metrics.slice(0,5).map(([label, key, higherIsGood]) => {
    const delta = (b[key] || 0) - (a[key] || 0);
    const good = higherIsGood ? delta >= 0 : delta <= 0;
    return { label, value: signedMoney(delta), sub: `${a.label} → ${b.label} · ${signedPct(percentChange(b[key], a[key]) || 0)}`, cls: good ? 'ok' : 'warn' };
  });
  $('monthPairGrid').innerHTML = cards.map(c => `<div class="kpi ${c.cls}"><div class="label">${c.label}</div><div class="value">${c.value}</div><div class="sub">${c.sub}</div></div>`).join('');
  $('monthPairTable').innerHTML = `<thead><tr><th>Indicador</th><th class="num">${a.label}</th><th class="num">${b.label}</th><th class="num">Diferencia</th><th class="num">Variación</th></tr></thead><tbody>${metrics.map(([label,key]) => {
    const delta = (b[key] || 0) - (a[key] || 0);
    return `<tr><td>${label}</td><td class="num">${money2(a[key])}</td><td class="num">${money2(b[key])}</td><td class="num">${signedMoney(delta)}</td><td class="num">${percentChange(b[key], a[key]) == null ? '—' : signedPct(percentChange(b[key], a[key]))}</td></tr>`;
  }).join('')}</tbody>`;
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
  renderExpenseTypeTable(m);
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

  const providerPieRows = groupSmallSlices(byProvider.map(r => ({ ...r, key: r.label })), 8);
  const selectedKeys = state.highlight.providers || [];
  const selectedSet = new Set(selectedKeys);
  const hasProviderFilter = selectedKeys.length > 0;
  const tableRows = hasProviderFilter ? filtered.filter(r => selectedSet.has(r.provider)) : filtered;
  const tableTotal = tableRows.reduce((a, b) => a + b.amount, 0);
  const selectedLabel = providerFilterLabel(selectedKeys, providerPieRows);

  $('providerSummary').innerHTML = `
    <div class="provider-summary-main">
      <span><strong>${filtered.length}</strong> movimientos · Total filtrado: <strong>${money2(total)}</strong> · Proveedores: <strong>${byProvider.length}</strong></span>
      ${hasProviderFilter ? `<span class="active-filter">Proveedor seleccionado: <strong>${escapeHtml(selectedLabel)}</strong> · ${tableRows.length} movimientos · ${money2(tableTotal)}</span>` : '<span class="muted">Seleccioná una porción o leyenda para filtrar la tabla y ver evolución por proveedor.</span>'}
    </div>
    ${hasProviderFilter ? '<button type="button" id="clearProviderFilter" class="small-action">Ver todos los proveedores</button>' : ''}
  `;
  if (hasProviderFilter) {
    $('clearProviderFilter').addEventListener('click', () => {
      state.highlight.providers = null;
      renderProviders();
    });
  }

  drawPieChart($('providerChart'), providerPieRows, {
    activeKeys: selectedKeys,
    onSliceClick: item => handlePieSelection('providers', 'providerTable', 'providerLegend', item)
  });
  renderPieLegend('providerLegend', providerPieRows, total, 'providers', 'providerTable');
  $('providerTable').innerHTML = `<thead><tr><th>Mes</th><th>Proveedor</th><th>Rubro</th><th>Detalle</th><th>Tipo</th><th class="num">Importe</th></tr></thead><tbody>${tableRows.sort((a,b) => a.monthId.localeCompare(b.monthId) || b.amount - a.amount).map(r => `<tr data-pie-key="${escapeHtml(r.provider)}"><td>${r.month}</td><td>${r.provider}</td><td>${r.category}</td><td>${r.detail}</td><td>${r.type}</td><td class="num">${money2(r.amount)}</td></tr>`).join('')}</tbody>`;
  highlightTableRows('providerTable', selectedKeys);
  renderProviderEvolution(selectedKeys, providerPieRows);
  renderProviderProfile(selectedKeys, providerPieRows);
}



function getProviderRankingRows() {
  const map = new Map();
  DATA.months.forEach(m => (m.providers || []).forEach(p => {
    if (!map.has(p.provider)) map.set(p.provider, { provider: p.provider, total: 0, months: new Set(), movements: 0, maxAmount: 0, maxMonth: '', categories: {}, types: {} });
    const row = map.get(p.provider);
    row.total += p.amount;
    row.months.add(m.id);
    row.movements += 1;
    if (p.amount > row.maxAmount) { row.maxAmount = p.amount; row.maxMonth = m.label; }
    row.categories[p.category] = (row.categories[p.category] || 0) + p.amount;
    row.types[p.type] = (row.types[p.type] || 0) + p.amount;
  }));
  return [...map.values()].map(r => {
    const mainCategory = Object.entries(r.categories).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
    const mainType = Object.entries(r.types).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
    return { ...r, monthCount: r.months.size, average: r.months.size ? r.total / r.months.size : 0, mainCategory, mainType };
  }).sort((a,b) => b.total - a.total);
}

function renderProviderRanking() {
  const table = $('providerRankingTable');
  if (!table) return;
  const rows = getProviderRankingRows();
  table.innerHTML = `<thead><tr><th>Proveedor</th><th class="num">Total anual</th><th class="num">Meses</th><th class="num">Promedio mensual</th><th class="num">Mayor gasto</th><th>Rubro principal</th></tr></thead><tbody>${rows.map(r => `<tr class="clickable-row" data-provider-row="${escapeHtml(r.provider)}"><td><strong>${escapeHtml(r.provider)}</strong><br><span class="muted">${escapeHtml(r.mainType)}</span></td><td class="num">${money2(r.total)}</td><td class="num">${r.monthCount}</td><td class="num">${money2(r.average)}</td><td class="num">${money2(r.maxAmount)}<br><span class="muted">${escapeHtml(r.maxMonth)}</span></td><td>${escapeHtml(r.mainCategory)}</td></tr>`).join('')}</tbody>`;
}

function renderProviderProfile(selectedKeys = null, pieRows = null) {
  const el = $('providerProfile');
  if (!el) return;
  const keys = selectedKeys && selectedKeys.length ? selectedKeys : null;
  const ranking = getProviderRankingRows();
  const targetProviders = keys || (ranking[0] ? [ranking[0].provider] : []);
  if (!targetProviders.length) {
    el.innerHTML = '<p class="muted">No hay proveedores cargados.</p>';
    return;
  }
  const selectedSet = new Set(targetProviders);
  const rows = [];
  DATA.months.forEach(m => (m.providers || []).filter(p => selectedSet.has(p.provider)).forEach(p => rows.push({ ...p, month: m.label, monthId: m.id })));
  const total = rows.reduce((a,b)=>a+b.amount,0);
  const monthIds = new Set(rows.map(r=>r.monthId));
  const max = rows.reduce((a,b)=>a.amount>b.amount?a:b, rows[0]);
  const byCategory = Object.entries(rows.reduce((acc,r)=>{acc[r.category]=(acc[r.category]||0)+r.amount; return acc;},{})).sort((a,b)=>b[1]-a[1]);
  const label = keys ? providerFilterLabel(keys, pieRows || []) : targetProviders[0];
  const monthRows = DATA.months.map(m => {
    const amount = rows.filter(r => r.monthId === m.id).reduce((a,b)=>a+b.amount,0);
    return { month: m.label, amount };
  }).filter(r => r.amount > 0);
  el.innerHTML = `
    <div class="provider-profile-head">
      <h3>${escapeHtml(label)}</h3>
      <p class="muted">${keys ? 'Proveedor seleccionado' : 'Proveedor principal por gasto anual'}</p>
    </div>
    <div class="profile-metrics">
      <div><span>Total 2026</span><strong>${money2(total)}</strong></div>
      <div><span>Meses con gasto</span><strong>${monthIds.size}</strong></div>
      <div><span>Movimientos</span><strong>${rows.length}</strong></div>
      <div><span>Mayor gasto</span><strong>${money2(max?.amount || 0)}</strong><small>${escapeHtml(max?.month || '')}</small></div>
    </div>
    <h4>Rubros principales</h4>
    <ul class="compact-list">${byCategory.slice(0,5).map(([cat,amount]) => `<li><span>${escapeHtml(cat)}</span><strong>${money2(amount)}</strong></li>`).join('')}</ul>
    <h4>Evolución mensual</h4>
    <ul class="compact-list">${monthRows.map(r => `<li><span>${escapeHtml(r.month)}</span><strong>${money2(r.amount)}</strong></li>`).join('') || '<li><span>Sin movimientos</span></li>'}</ul>
  `;
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
  $('docsTable').innerHTML = `<thead><tr><th>Mes</th><th>PDF expensas</th><th>Informe mensual</th><th>Comentario</th></tr></thead><tbody>${DATA.months.map(m => `<tr><td>${m.label}</td><td>${m.pdf ? `<a href="${m.pdf}" target="_blank">Abrir PDF</a>` : '<span class="muted">Pendiente de copiar</span>'}</td><td>${m.report ? `<a href="${m.report}" target="_blank">Abrir informe</a>` : '<span class="muted">Pendiente</span>'}</td><td>${escapeHtml(m.notes || '')}</td></tr>`).join('')}</tbody>`;
}

function renderDocsStatus() {
  const table = $('docsStatusTable');
  if (!table) return;
  table.innerHTML = `<thead><tr><th>Mes</th><th>PDF</th><th>Informe</th><th>Datos</th><th>Validación</th><th>Observación</th></tr></thead><tbody>${DATA.months.map(m => {
    const hasData = !!(m.totalExpenses && m.composition?.length && m.providers?.length);
    const ready = hasData && m.pdf && m.report;
    const status = ready ? 'Completo' : (hasData ? 'Datos cargados, documentos incompletos' : 'Revisar carga');
    return `<tr><td>${m.label}</td><td>${m.pdf ? 'Disponible' : 'Pendiente'}</td><td>${m.report ? 'Disponible' : 'Pendiente'}</td><td>${hasData ? 'Cargados' : 'Incompletos'}</td><td><span class="status-pill ${ready ? 'ok' : 'warn'}">${status}</span></td><td>${escapeHtml(m.notes || '')}</td></tr>`;
  }).join('')}</tbody>`;
}


function previousMonth(id) {
  const index = DATA.months.findIndex(m => m.id === id);
  return index > 0 ? DATA.months[index - 1] : null;
}

function percentChange(current, previous) {
  if (previous == null || previous === 0 || current == null) return null;
  return (current - previous) / previous * 100;
}

function renderAlerts(m, prev) {
  const rows = buildAlertRows(m, prev);
  $('alertStrip').innerHTML = rows.map(a => `
    <div class="alert-card ${a.level}">
      <div class="alert-icon">${a.icon}</div>
      <div><strong>${a.title}</strong><span>${a.text}</span></div>
    </div>
  `).join('');
}

function buildAlertRows(m, prev) {
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const netCoverage = m.ordinaryExpenses ? m.netCash / m.ordinaryExpenses : 0;
  const payablesShare = m.cashFinal ? m.accountsPayable / m.cashFinal * 100 : 0;
  const debtRows = [...(m.debtors || [])].sort((a,b) => b.amount - a.amount);
  const top3 = debtRows.slice(0,3).reduce((a,b) => a + b.amount, 0);
  const top3Share = m.debtCapital ? top3 / m.debtCapital * 100 : 0;
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;
  return [
    {
      level: netCoverage < .5 ? 'danger' : (netCoverage < 1 ? 'warn' : 'ok'),
      icon: netCoverage < .5 ? '🔴' : (netCoverage < 1 ? '🟡' : '🟢'),
      title: 'Caja neta',
      text: `${pct(netCoverage * 100)} de un mes de gastos ordinarios.`
    },
    {
      level: extraShare > 30 ? 'danger' : (extraShare > 25 ? 'warn' : 'ok'),
      icon: extraShare > 30 ? '🔴' : (extraShare > 25 ? '🟡' : '🟢'),
      title: 'Extraordinarios',
      text: `${pct(extraShare)} del gasto mensual.`
    },
    {
      level: top3Share > 60 ? 'danger' : (top3Share > 45 ? 'warn' : 'ok'),
      icon: top3Share > 60 ? '🔴' : (top3Share > 45 ? '🟡' : '🟢'),
      title: 'Concentración de mora',
      text: `Top 3 explica ${pct(top3Share)} de la deuda.`
    },
    {
      level: payablesShare > 35 ? 'danger' : (payablesShare > 25 ? 'warn' : 'ok'),
      icon: payablesShare > 35 ? '🔴' : (payablesShare > 25 ? '🟡' : '🟢'),
      title: 'Cuentas por pagar',
      text: `${pct(payablesShare)} de la caja final.`
    },
    {
      level: debtDelta == null ? 'neutral' : (debtDelta < 0 ? 'ok' : 'danger'),
      icon: debtDelta == null ? '⚪' : (debtDelta < 0 ? '🟢' : '🔴'),
      title: 'Deuda mensual',
      text: debtDelta == null ? 'Sin comparación anterior.' : `${debtDelta < 0 ? 'Bajó' : 'Subió'} ${money2(Math.abs(debtDelta))}.`
    }
  ];
}

function renderMonthComparison(m, prev) {
  if (!prev) {
    $('monthComparison').innerHTML = '<div class="summary-line">No hay mes anterior para comparar.</div>';
    return;
  }
  const items = [
    ['Caja neta', m.netCash - prev.netCash, percentChange(m.netCash, prev.netCash), m.netCash >= prev.netCash],
    ['Deuda capital', m.debtCapital - prev.debtCapital, percentChange(m.debtCapital, prev.debtCapital), m.debtCapital <= prev.debtCapital],
    ['Gasto total', m.totalExpenses - prev.totalExpenses, percentChange(m.totalExpenses, prev.totalExpenses), m.totalExpenses <= prev.totalExpenses],
    ['Cuentas por pagar', m.accountsPayable - prev.accountsPayable, percentChange(m.accountsPayable, prev.accountsPayable), m.accountsPayable <= prev.accountsPayable]
  ];
  $('monthComparison').innerHTML = `
    <article class="panel mini-panel">
      <h2>${m.label} vs ${prev.label}</h2>
      <div class="delta-grid">${items.map(([label, delta, pc, good]) => `
        <div class="delta-card ${good ? 'ok' : 'warn'}">
          <span>${label}</span>
          <strong>${signedMoney(delta)}</strong>
          <small>${pc == null ? 'Sin %' : signedPct(pc)}</small>
        </div>`).join('')}
      </div>
    </article>
  `;
}

function buildMonthReading(m, prev) {
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;
  const cashDelta = prev ? m.netCash - prev.netCash : null;
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const positives = [];
  const warnings = [];
  if (debtDelta != null && debtDelta < 0) positives.push(`La deuda de capital bajó ${money2(Math.abs(debtDelta))} frente al mes anterior.`);
  if (cashDelta != null && cashDelta > 0) positives.push(`La caja neta subió ${money2(cashDelta)}.`);
  if ((m.debtRecovered || 0) > 0) positives.push(`Se recuperaron ${money2(m.debtRecovered)} de expensas adeudadas.`);
  if (debtDelta != null && debtDelta > 0) warnings.push(`La deuda de capital aumentó ${money2(debtDelta)}.`);
  if (extraShare > 25) warnings.push(`Los extraordinarios representan ${pct(extraShare)} del gasto mensual.`);
  if (m.accountsPayable > m.cashFinal * .25) warnings.push(`Las cuentas por pagar equivalen a más del 25% de la caja final.`);
  if (!positives.length) positives.push('No hay mejora marcada cargada para este mes. Revisar contra informe mensual.');
  if (!warnings.length) warnings.push('No surgen alertas críticas con las reglas automáticas actuales.');
  const recommendation = debtDelta != null && debtDelta < 0
    ? 'Mantener seguimiento mensual de recupero de deuda y evitar que los extraordinarios vuelvan a deteriorar la caja neta.'
    : 'Priorizar cobranza de deuda, control de extraordinarios y revisión de cuentas por pagar.';
  return `
    <p class="note-text">${escapeHtml(m.notes || 'Sin comentario mensual cargado.')}</p>
    <div class="reading-columns">
      <div><h3>Puntos favorables</h3><ul>${positives.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      <div><h3>Puntos de alerta</h3><ul>${warnings.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="recommendation"><strong>Recomendación del mes:</strong> ${escapeHtml(recommendation)}</div>
  `;
}

function renderExpenseTypeTable(m) {
  const rows = [
    ['Gasto ordinario del mes', m.ordinaryExpenses, 'Funcionamiento y servicios recurrentes.'],
    ['Gasto extraordinario del mes', m.extraordinaryExpenses, 'Reparaciones, acopios o gastos no recurrentes.'],
    ['Gastos particulares', m.particularExpenses || 0, 'Gastos cargados a unidades o sectores específicos si están informados.'],
    ['Cuentas por pagar', m.accountsPayable, 'Compromisos devengados pendientes de pago al cierre.'],
    ['Pagos devengados de meses anteriores', m.priorAccruedPaid, 'No estructurado en el JSON actual para todos los meses.']
  ];
  $('expenseTypeTable').innerHTML = `<thead><tr><th>Concepto</th><th class="num">Importe</th><th>Lectura</th></tr></thead><tbody>${rows.map(([concept, amount, text]) => `<tr><td>${concept}</td><td class="num">${amount == null ? 'No cargado' : money2(amount)}</td><td>${text}</td></tr>`).join('')}</tbody>`;
}

function renderProviderEvolution(selectedKeys, pieRows) {
  const panel = $('providerEvolutionPanel');
  const chart = $('providerEvolutionChart');
  const table = $('providerEvolutionTable');
  if (!panel || !chart || !table) return;
  if (!selectedKeys || !selectedKeys.length) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  const label = providerFilterLabel(selectedKeys, pieRows);
  const selectedSet = new Set(selectedKeys);
  const rows = DATA.months.map(m => {
    const amount = (m.providers || []).filter(p => selectedSet.has(p.provider)).reduce((acc, p) => acc + p.amount, 0);
    const count = (m.providers || []).filter(p => selectedSet.has(p.provider)).length;
    return { label: m.monthShort, month: m.label, amount, count };
  });
  const total = rows.reduce((a,b) => a + b.amount, 0);
  const activeMonths = rows.filter(r => r.amount > 0).length;
  const max = rows.reduce((a,b) => a.amount > b.amount ? a : b);
  $('providerEvolutionText').textContent = `${label}: ${money2(total)} acumulados · ${activeMonths} meses con movimientos · mayor mes: ${max.month} (${money2(max.amount)}).`;
  drawLineChart(chart, rows.map(r => ({ label: r.label, gasto: r.amount })), [{ key: 'gasto', label }]);
  table.innerHTML = `<thead><tr><th>Mes</th><th class="num">Movimientos</th><th class="num">Importe</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.month}</td><td class="num">${r.count}</td><td class="num">${money2(r.amount)}</td></tr>`).join('')}</tbody>`;
}

function renderGlobalSearch() {
  const q = (state.globalSearch || '').trim().toLowerCase();
  const panel = $('globalSearchPanel');
  if (!q) {
    panel.classList.add('hidden');
    $('globalSearchTable').innerHTML = '';
    return;
  }
  panel.classList.remove('hidden');
  const results = [];
  DATA.months.forEach(m => {
    if (`${m.label} ${m.monthShort} ${m.notes || ''}`.toLowerCase().includes(q)) {
      results.push({ type: 'Mes / informe', month: m.label, detail: m.notes || '', amount: null });
    }
    (m.providers || []).forEach(p => {
      if (`${p.provider} ${p.category} ${p.detail} ${p.type} ${m.label}`.toLowerCase().includes(q)) {
        results.push({ type: 'Proveedor', month: m.label, detail: `${p.provider} · ${p.category} · ${p.detail}`, amount: p.amount });
      }
    });
    (m.debtors || []).forEach(d => {
      if (`${d.unit} unidad ${m.label}`.toLowerCase().includes(q)) {
        results.push({ type: 'Morosidad', month: m.label, detail: `Unidad ${d.unit}`, amount: d.amount });
      }
    });
    if ((m.pdf || '').toLowerCase().includes(q) || (m.report || '').toLowerCase().includes(q)) {
      results.push({ type: 'Documento', month: m.label, detail: `${m.pdf || ''} ${m.report || ''}`, amount: null });
    }
  });
  $('globalSearchSummary').innerHTML = `<strong>${results.length}</strong> resultados para “${escapeHtml(state.globalSearch)}”.`;
  $('globalSearchTable').innerHTML = `<thead><tr><th>Tipo</th><th>Mes</th><th>Detalle</th><th class="num">Importe</th></tr></thead><tbody>${results.slice(0, 150).map(r => `<tr><td>${r.type}</td><td>${r.month}</td><td>${escapeHtml(r.detail)}</td><td class="num">${r.amount == null ? '—' : money2(r.amount)}</td></tr>`).join('')}</tbody>`;
}

function renderMeeting() {
  const m = getMonth(state.selected);
  const prev = previousMonth(m.id);
  const debtDelta = prev ? m.debtCapital - prev.debtCapital : null;
  const cashDelta = prev ? m.netCash - prev.netCash : null;
  const extraShare = m.totalExpenses ? m.extraordinaryExpenses / m.totalExpenses * 100 : 0;
  const debtRows = [...(m.debtors || [])].sort((a,b) => b.amount - a.amount);
  const top3 = debtRows.slice(0,3).reduce((a,b) => a + b.amount, 0);
  const cards = [
    ['Estado general', m.notes || 'Sin lectura mensual cargada.'],
    ['Qué mejoró', prev ? [`Caja neta: ${signedMoney(cashDelta)}`, `Deuda: ${signedMoney(debtDelta)}`, `Recupero deuda: ${money2(m.debtRecovered)}`].join(' · ') : 'Sin mes anterior para comparar.'],
    ['Qué empeoró o exige atención', `Extraordinarios: ${pct(extraShare)} del gasto · Cuentas por pagar: ${money2(m.accountsPayable)}.`],
    ['Principales gastos', (m.composition || []).sort((a,b)=>b.amount-a.amount).slice(0,4).map(r => `${r.category}: ${money2(r.amount)}`).join(' · ')],
    ['Situación de deuda', `Deuda capital: ${money2(m.debtCapital)} · Top 3 unidades: ${pct(top3 / m.debtCapital * 100)}.`],
    ['Decisiones sugeridas', debtDelta != null && debtDelta < 0 ? 'Sostener política de cobranza y controlar extraordinarios antes de asumir nuevos compromisos.' : 'Priorizar intimaciones/acuerdos de pago y limitar extraordinarios no urgentes.']
  ];
  $('meetingGrid').innerHTML = cards.map(([title, text], i) => `<div class="meeting-card"><span>${i + 1}</span><h3>${title}</h3><p>${escapeHtml(text)}</p></div>`).join('');
}

function loadDecisions() {
  try { return JSON.parse(localStorage.getItem('alemDashboardDecisions') || '[]'); }
  catch { return []; }
}

function saveDecisions() {
  localStorage.setItem('alemDashboardDecisions', JSON.stringify(state.decisions));
}

function addDecisionFromForm() {
  const topic = $('decisionTopic').value.trim();
  const text = $('decisionText').value.trim();
  const status = $('decisionStatus').value;
  if (!topic || !text) return;
  state.decisions.unshift({ id: String(Date.now()), date: new Date().toLocaleDateString('es-AR'), topic, text, status });
  saveDecisions();
  $('decisionTopic').value = '';
  $('decisionText').value = '';
  renderDecisions();
}

function deleteDecision(id) {
  state.decisions = state.decisions.filter(d => d.id !== id);
  saveDecisions();
  renderDecisions();
}

function renderDecisions() {
  const rows = state.decisions;
  $('decisionsTable').innerHTML = `<thead><tr><th>Fecha</th><th>Tema</th><th>Decisión / acción</th><th>Estado</th><th></th></tr></thead><tbody>${rows.length ? rows.map(d => `<tr><td>${d.date}</td><td>${escapeHtml(d.topic)}</td><td>${escapeHtml(d.text)}</td><td>${escapeHtml(d.status)}</td><td><button class="link-button" data-delete-decision="${d.id}" type="button">Borrar</button></td></tr>`).join('') : '<tr><td colspan="5" class="muted">Todavía no hay decisiones cargadas en este navegador.</td></tr>'}</tbody>`;
}

function renderQuality() {
  const last = getMonth(DATA.meta.lastLoadedMonth);
  const docsWithPdf = DATA.months.filter(m => m.pdf).length;
  const docsWithReport = DATA.months.filter(m => m.report).length;
  const totalProviders = DATA.months.reduce((a,m) => a + (m.providers || []).length, 0);
  const rows = [
    ['Última actualización', last ? last.label : DATA.meta.lastLoadedMonth],
    ['Política de datos', DATA.meta.dataPolicy || 'Validar contra liquidaciones oficiales.'],
    ['Meses cargados', `${DATA.months.length} meses`],
    ['PDFs enlazados', `${docsWithPdf} de ${DATA.months.length}`],
    ['Informes enlazados', `${docsWithReport} de ${DATA.months.length}`],
    ['Movimientos de proveedores', `${totalProviders} registros`],
    ['Advertencia', 'Dashboard informativo: la liquidación oficial sigue siendo el PDF mensual.']
  ];
  $('qualityPanel').innerHTML = rows.map(([a,b]) => `<div class="quality-row"><span>${a}</span><strong>${escapeHtml(b)}</strong></div>`).join('');
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
  const { ctx, w, h } = prepareCanvas(canvas, getPieChartHeight(canvas, 280));
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
  if (scope === 'providers') {
    renderProviders();
    requestAnimationFrame(() => {
      const table = $(tableId);
      if (table) table.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return;
  }
  highlightTableRows(tableId, keys, true);
  highlightLegend(legendId, keys);
}

function providerFilterLabel(keys, pieRows) {
  if (!keys || !keys.length) return '';
  const grouped = pieRows.find(r => arraysHaveSameMembers(getItemKeys(r), keys));
  if (grouped?.label === 'Otros') return `Otros (${keys.length} proveedores)`;
  if (grouped?.label) return grouped.label;
  return keys.length === 1 ? keys[0] : `${keys.length} proveedores`;
}

function arraysHaveSameMembers(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const set = new Set(a);
  return b.every(x => set.has(x));
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

function getPieChartHeight(canvas, preferred) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement?.clientWidth || 320;
  if (document.body.classList.contains('printing')) {
    return Math.round(Math.max(240, Math.min(340, width)));
  }
  return getResponsiveChartHeight(canvas, preferred);
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
