/* Selector multi-consorcio v0.8. Capa adicional: conserva intacta la lógica v0.7 de Alem. */
(() => {
  'use strict';
  let manifest = null;
  let lagos = null;
  let chosen = 'alem-1274';
  const selection = { category: null, providers: null, debtors: null };
  const $l = id => document.getElementById(id);
  const peso = v => v == null ? 'No informado' : new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', minimumFractionDigits:2, maximumFractionDigits:2}).format(v);
  const por = v => !Number.isFinite(v) ? '—' : `${v.toLocaleString('es-AR',{maximumFractionDigits:1})}%`;
  const safe = str => escapeHtml(str);
  const month = id => lagos?.months?.find(m => m.id === id);
  const idFrom = () => $l('lagosMonthSelect').value;
  const rowsBetween = (from,to) => {
    const i=lagos.months.findIndex(m=>m.id===from), j=lagos.months.findIndex(m=>m.id===to);
    return lagos.months.slice(Math.min(i,j),Math.max(i,j)+1);
  };
  const percent = (x,total) => total ? por(100*x/total) : '—';
  function makeTable(el, headers, rows) {
    el.innerHTML = `<thead><tr>${headers.map(h=>`<th>${safe(h)}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map(cols=>`<tr>${cols.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }
  function selectKeys(item) { return getItemKeys(item); }
  function chartWithLegend(canvasId, legendId, items, currentKeys, callback, total) {
    drawPieChart($l(canvasId),items,{activeKeys:currentKeys||[],onSliceClick:callback});
    const pal=getPalette();
    $l(legendId).innerHTML = items.map((it,i) => {
      const keys=selectKeys(it), active=keys.some(k=>(currentKeys||[]).includes(k));
      return `<button type="button" class="legend-item ${active?'active':''}" data-idx="${i}"><span class="legend-swatch" style="background:${pal[i%pal.length]}"></span><span class="legend-label">${safe(it.label)}</span><strong>${percent(it.value,total)}</strong></button>`;
    }).join('');
    $l(legendId).querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>callback(items[Number(b.dataset.idx)])));
  }
  function markRows(tableId,keys) {
    const set = new Set(keys||[]);
    $l(tableId).querySelectorAll('tbody tr').forEach(row=>row.classList.toggle('row-highlight',set.has(row.dataset.lagosKey)));
  }
  function activeBuilding(id) {
    document.body.dataset.activeBuilding=id;
    chosen=id;
    const isLagos=id==='lagos-2797';
    $l('alemHeroControls').hidden=isLagos;
    $l('lagosHeroControls').hidden=!isLagos;
    $l('lagosDashboard').hidden=!isLagos;
    $l('activeBuildingLabel').textContent = isLagos ? 'Torre VI · Ovidio Lagos 2797' : 'Consorcio Alem 1268/74/80/82';
    $l('appVersionLine').textContent = isLagos ? 'Versión 0.8 · liquidaciones parciales · mayo–julio 2026' : 'Versión 0.8 · Alem conserva las funciones de la v0.7';
    $l('privacyNotice').innerHTML = isLagos
      ? '<strong>Privacidad:</strong> las liquidaciones individuales incluyen nombres propios. Los originales no se distribuyen en GitHub Pages; los informes públicos sólo muestran unidades.'
      : '<strong>Privacidad:</strong> la vista de morosidad muestra sólo unidades. Atención: los PDF originales de Alem incluidos previamente pueden contener datos personales.';
    if (!isLagos) {
      document.title='Expensas 2026 · Consorcio Alem';
      if (typeof renderAll === 'function') requestAnimationFrame(renderAll);
    } else {
      document.title='Expensas 2026 · Torre VI Lagos 2797';
      requestAnimationFrame(renderLagos);
    }
  }
  async function chooseBuilding(id) {
    if(id==='alem-1274') {activeBuilding(id);return;}
    try {
      if (!lagos) {
        const found=manifest.buildings.find(b=>b.id===id);
        if (!found) throw new Error('Edificio sin registro');
        const response=await fetch(found.data,{cache:'no-store'});
        if(!response.ok) throw new Error('HTTP '+response.status);
        lagos=await response.json();
        buildSelectors();
      }
      activeBuilding(id);
    } catch(e) {
      $l('buildingSelect').value='alem-1274';
      activeBuilding('alem-1274');
      alert('No pudo cargarse el edificio seleccionado. Revisá los archivos del paquete y el servidor local. '+e.message);
    }
  }
  function buildSelectors() {
    const options=lagos.months.map(m=>`<option value="${safe(m.id)}">${safe(m.label)}</option>`).join('');
    for (const id of ['lagosMonthSelect','lagosFrom','lagosTo','lagosMonthA','lagosMonthB']) $l(id).innerHTML=options;
    $l('lagosMonthSelect').value=lagos.months.at(-1).id;
    $l('lagosFrom').value=lagos.months[0].id;
    $l('lagosTo').value=lagos.months.at(-1).id;
    $l('lagosMonthA').value=lagos.months[0].id;
    $l('lagosMonthB').value=lagos.months.at(-1).id;
  }
  function current() {return month(idFrom());}
  function displayKPIs(m) {
    const dat=[
      ['Total computable liquidado',peso(m.liquidatedTotal),'No es gasto efectivo de caja'],
      ['Rubros habituales 01–04',peso(m.habitualExpenses),'Partidas habituales liquidadas'],
      ['Rubro 08 · No habituales',peso(m.nonHabitualExpenses),'Incluye fondos operativos'],
      ['Listado de deudores',peso(m.listedDebtTotal),`${m.debtors.length} unidades enumeradas; suma del listado`],
      ['Fondo operativo',peso(m.fundOperating),'Dentro del rubro no habitual'],
      ['Importe unidad 01-03',peso(m.unitCharge),'Al primer vencimiento; dato del comprobante'],
      ['Caja final','No informada','No figura en el PDF recibido'],
      ['Cuentas por pagar','No informadas','No figuran en el PDF recibido']
    ];
    $l('lagosKPIs').innerHTML=dat.map(([label,value,sub])=>`<div class="kpi"><div class="label">${safe(label)}</div><div class="value">${safe(value)}</div><div class="sub">${safe(sub)}</div></div>`).join('');
  }
  function displayReading(m) {
    $l('lagosReading').innerHTML=`<p class="note-text">${safe(m.notes)}</p><h3>Cuestiones a verificar</h3><ul>${m.observations.map(x=>`<li>${safe(x)}</li>`).join('')}</ul><p class="summary-line"><strong>Fuente:</strong> ${safe(m.source.name)}, página ${m.source.page}. El listado de deuda sólo comprende los registros publicados en la copia individual.</p>`;
  }
  function displayComposition(m) {
    const sorted=m.composition.slice().sort((a,b)=>b.amount-a.amount);
    const pieRows=sorted.map(r=>({label:r.category,value:r.amount,key:r.category}));
    const select=it=>{selection.category=selectKeys(it);displayComposition(m);};
    chartWithLegend('lagosCompositionChart','lagosCompositionLegend',pieRows,selection.category,select,m.liquidatedTotal);
    $l('lagosCompositionTable').innerHTML=`<thead><tr><th>Rubro</th><th>Clasificación</th><th class="num">Importe</th><th class="num">%</th></tr></thead><tbody>${sorted.map(r=>`<tr data-lagos-key="${safe(r.category)}"><td>${safe(r.category)}</td><td>${safe(r.type)}</td><td class="num">${peso(r.amount)}</td><td class="num">${percent(r.amount,m.liquidatedTotal)}</td></tr>`).join('')}</tbody>`;
    markRows('lagosCompositionTable',selection.category);
  }
  function displayProviders() {
    const all=rowsBetween($l('lagosFrom').value,$l('lagosTo').value).flatMap(m=>m.providers.filter(p=>p.provider!=='Fondo Operativo').map(p=>({...p,month:m.label})));
    const summary=new Map();
    all.forEach(r=>summary.set(r.provider,(summary.get(r.provider)||0)+r.amount));
    const byProv=[...summary].map(([label,value])=>({label,value,key:label})).filter(p=>p.value>0).sort((a,b)=>b.value-a.value);
    const pie=groupSmallSlices(byProv,8);
    const total=byProv.reduce((s,p)=>s+p.value,0);
    const select=it=>{ const keys=selectKeys(it); selection.providers=(selection.providers&&keys.length===selection.providers.length&&keys.every(k=>selection.providers.includes(k)))?null:keys;displayProviders(); };
    chartWithLegend('lagosProvidersChart','lagosProvidersLegend',pie,selection.providers,select,total);
    const rows=selection.providers?.length?all.filter(r=>selection.providers.includes(r.provider)):all;
    const displayedTotal=rows.reduce((s,r)=>s+r.amount,0);
    $l('lagosProvidersSummary').textContent=`${rows.length} movimientos · ${summary.size} proveedores en período · total visible ${peso(displayedTotal)}. El fondo operativo se excluye por no ser un proveedor.`;
    $l('lagosClearProvider').hidden=!selection.providers;
    $l('lagosProvidersTable').innerHTML=`<thead><tr><th>Mes</th><th>Proveedor</th><th>Rubro</th><th>Detalle</th><th class="num">Importe</th></tr></thead><tbody>${rows.map(r=>`<tr data-lagos-key="${safe(r.provider)}"><td>${safe(r.month)}</td><td>${safe(r.provider)}</td><td>${safe(r.category)}</td><td>${safe(r.detail)}</td><td class="num">${peso(r.amount)}</td></tr>`).join('')}</tbody>`;
    markRows('lagosProvidersTable',selection.providers);
  }
  function displayDebtors(m) {
    const sorted=m.debtors.slice().sort((a,b)=>b.amount-a.amount);
    const pie=groupSmallSlices(sorted.map(r=>({label:'Unidad '+r.unit,value:r.amount,key:r.unit})),7);
    const select=it=>{ selection.debtors=selectKeys(it);displayDebtors(m);};
    chartWithLegend('lagosDebtorsChart','lagosDebtorsLegend',pie,selection.debtors,select,m.listedDebtTotal);
    $l('lagosDebtorsTable').innerHTML=`<thead><tr><th>Unidad</th><th class="num">Importe</th><th class="num">% del listado</th></tr></thead><tbody>${sorted.map(r=>`<tr data-lagos-key="${safe(r.unit)}"><td>${safe(r.unit)}</td><td class="num">${peso(r.amount)}</td><td class="num">${percent(r.amount,m.listedDebtTotal)}</td></tr>`).join('')}</tbody>`;
    markRows('lagosDebtorsTable',selection.debtors);
  }
  function displayCompare() {
    const a=month($l('lagosMonthA').value), b=month($l('lagosMonthB').value);
    const fields=[['Total computable liquidado','liquidatedTotal'],['Rubros habituales','habitualExpenses'],['No habituales','nonHabitualExpenses'],['Fondo operativo','fundOperating'],['Suma del listado de deudores','listedDebtTotal']];
    const h=['Concepto',a.label,b.label,'Variación nominal','Variación %'];
    const rows=fields.map(([label,key])=>{const x=a[key],y=b[key],delta=y-x;return [safe(label),peso(x),peso(y),`${delta>=0?'+':'−'}${peso(Math.abs(delta))}`,x!==0?por(delta/x*100):'—'];});
    makeTable($l('lagosCompareTable'),h,rows);
  }
  function displayDocs() {
    makeTable($l('lagosDocsTable'),['Mes','Liquidación original','Informe interpretativo','Estado'],lagos.months.map(m=>[
      safe(m.label),'<span class="muted">No publicada · contiene datos personales</span>',
      `<a target="_blank" rel="noopener noreferrer" href="${safe(m.report)}">Abrir informe PDF</a>`,
      'Rubros y deudores conciliados · sin estado de caja'
    ]));
  }
  function renderLagos() {
    if(chosen!=='lagos-2797'||!lagos)return;
    const m=current(); if(!m)return;
    displayKPIs(m);displayReading(m);displayComposition(m);displayProviders();displayDebtors(m);displayCompare();displayDocs();
  }
  async function start() {
    try {
      const response=await fetch('data/edificios.json',{cache:'no-store'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      manifest=await response.json();
      const options=manifest.buildings.map(b=>`<option value="${safe(b.id)}">${safe(b.name)}</option>`).join('');
      $l('buildingSelect').innerHTML=options;
      $l('buildingSelect').value='alem-1274';
      document.body.dataset.activeBuilding='alem-1274';
      $l('buildingSelect').addEventListener('change',e=>chooseBuilding(e.target.value));
      $l('lagosMonthSelect').addEventListener('change',()=>{selection.category=null;selection.debtors=null;renderLagos();});
      for(const id of ['lagosFrom','lagosTo']) $l(id).addEventListener('change',()=>{selection.providers=null;renderLagos();});
      for(const id of ['lagosMonthA','lagosMonthB']) $l(id).addEventListener('change',displayCompare);
      $l('lagosClearProvider').addEventListener('click',()=>{selection.providers=null;displayProviders();});
      window.addEventListener('resize',()=>{if(chosen==='lagos-2797')requestAnimationFrame(renderLagos);});
      window.addEventListener('beforeprint',()=>{if(chosen==='lagos-2797')requestAnimationFrame(renderLagos);});
      window.addEventListener('afterprint',()=>{if(chosen==='lagos-2797')requestAnimationFrame(renderLagos);});
    } catch(e) {
      $l('buildingSelect').innerHTML='<option value="alem-1274">Consorcio Alem (único disponible)</option>';
      console.warn('No se pudo cargar el catálogo de edificios:',e);
    }
  }
  start();
})();
