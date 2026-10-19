/* Dashboard multiedificio v1.1: gastos, proveedores e histórico documental. Alem sin cambios. */
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
    $l('appVersionLine').textContent = isLagos ? 'Versión 1.1 · gastos, proveedores y morosidad · 2025–2026' : 'Versión 1.1 · Alem conserva las funciones de la v0.7';
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
        const historical = await fetch('consorcios/lagos-2797/data/2025.json',{cache:'no-store'});
        if (!historical.ok) throw new Error('Histórico 2025 ausente (HTTP '+historical.status+')');
        const h=await historical.json();
        lagos.months=[...h.months,...lagos.months].sort((a,b)=>a.id.localeCompare(b.id));
        buildSelectors();
      }
      activeBuilding(id);
    } catch(e) {
      $l('buildingSelect').value='alem-1274';
      activeBuilding('alem-1274');
      alert('No pudo cargarse el edificio seleccionado. Revisá los archivos del paquete y el servidor local. '+e.message);
    }
  }
  /* v1.0: serie temporal de morosidad para Lagos. Datos: lista visible de unidades;
     ausencia de registro !== 0 ni cobro confirmado. No altera la vista Alem. */
  const debtState = {unit:null,from:null,to:null,filter:'all'};
  const debtorMap = m => new Map(m.debtors.map(d=>[d.unit,d.amount]));
  const debtUnits = () => [...new Set(lagos.months.flatMap(m=>m.debtors.map(d=>d.unit)))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  const moneySigned = v => `${v<0?'−':v>0?'+':''}${peso(Math.abs(v))}`;
  const selectedDebtComparison = () => [month(debtState.from),month(debtState.to)];
  const debtRatio = m => m.liquidatedTotal>0?m.listedDebtTotal/m.liquidatedTotal:null;
  function concentration(m,n){const rows=m.debtors.map(d=>d.amount).sort((a,b)=>b-a);return rows.slice(0,n).reduce((a,b)=>a+b,0);}
  const shortMoney = n => `${(n/1e6).toLocaleString('es-AR',{maximumFractionDigits:1})} M`;
  const stat = (label,value,sub,kind='')=>`<div class="debt-stat ${kind}"><span class="label">${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(sub)}</small></div>`;
  function seriesSvg(id,months,values,mode,title,color='#0f766e',currentMonth=null) {
    const el=$l(id);if(!el)return;
    const width=720,height=280,pad={l:76,r:28,t:28,b:57};
    const available=values.filter(Number.isFinite);
    if(!available.length){el.textContent='No hay datos disponibles';return;}
    let low=0, high=Math.max(...available)*1.13;
    if(mode==='share'){high=100;low=0;}
    if(mode==='count') high=Math.max(...available,1)*1.15;
    if(mode==='ratio') high=Math.max(...available,1)*1.2;
    if(!Number.isFinite(high)||high<=low)high=1;
    const x=i=>pad.l+(months.length===1?0.5:i/(months.length-1))*(width-pad.l-pad.r);
    const y=v=>height-pad.b-(v-low)/(high-low)*(height-pad.t-pad.b);
    const yformat=v=>mode==='money'?shortMoney(v):mode==='share'?`${Math.round(v)}%`:mode==='ratio'?`${v.toLocaleString('es-AR',{maximumFractionDigits:1})}×`:String(Math.round(v));
    let lines='',labels='',dots='',segments=[],segment=[];
    for(let tick=0;tick<=4;tick++){
      const val=low+(high-low)*tick/4,yy=y(val);
      lines+=`<line x1="${pad.l}" y1="${yy.toFixed(1)}" x2="${width-pad.r}" y2="${yy.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;
      labels+=`<text x="${pad.l-12}" y="${(yy+4).toFixed(1)}" text-anchor="end" fill="#64748b" font-size="13">${safe(yformat(val))}</text>`;
    }
    values.forEach((value,i)=>{
      const xx=x(i),active=months[i].id===currentMonth;
      if(months.length<14||i%2===0||active)labels+=`<text x="${xx.toFixed(1)}" y="${height-20}" text-anchor="middle" fill="${active?'#0f766e':'#64748b'}" font-size="${months.length>13?11:14}" font-weight="${active?'800':'500'}">${safe(months[i].monthShort||months[i].label)}</text>`;
      if(value==null||!Number.isFinite(value)){
        if(segment.length){segments.push(segment);segment=[];}
        return;
      }
      segment.push(`${xx.toFixed(2)},${y(value).toFixed(2)}`);
      const txt=mode==='money'?peso(value):mode==='share'?por(value):mode==='ratio'?`${value.toLocaleString('es-AR',{maximumFractionDigits:2})} veces`:String(value);
      dots+=`<circle cx="${xx.toFixed(1)}" cy="${y(value).toFixed(1)}" r="${active?7:5}" fill="${active?'#b45309':color}" stroke="#fff" stroke-width="2"><title>${safe(months[i].label)}: ${safe(txt)}</title></circle>`;
    });
    if(segment.length)segments.push(segment);
    const paths=segments.map(s=>s.length>1?`<polyline points="${s.join(' ')}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5"/>`:'').join('');
    el.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${safe(title)}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"><title>${safe(title)}</title>${lines}${labels}${paths}${dots}</svg>`;
  }
  // La evolución cronológica no conecta tramos de meses sin comprobante.
  function calendarRows(available=lagos.months) {
    if(!available?.length)return [];
    const byId=new Map(available.map(m=>[m.id,m]));
    let [y,mo]=available[0].id.split('-').map(Number);
    const [yy,mm]=available.at(-1).id.split('-').map(Number);
    const res=[], names=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    while(y<yy||(y===yy&&mo<=mm)) {
      const id=y+'-'+String(mo).padStart(2,'0');
      res.push(byId.has(id)?{...byId.get(id),monthShort:names[mo-1]+'/'+String(y).slice(2)}:{id,label:names[mo-1]+' '+y,monthShort:names[mo-1]+'/'+String(y).slice(2),missing:true});
      mo++;if(mo===13){mo=1;y++;}
    }
    return res;
  }
  const prevCalendarMonth=(a,b)=>{
    const [y,m]=a.id.split('-').map(Number),[yy,mm]=b.id.split('-').map(Number);
    return (yy*12+mm)-(y*12+m)===1;
  };
  function renderDebtSummary() {
    const selected=current(), prevIdx=lagos.months.indexOf(selected)-1,prev=lagos.months[prevIdx]||null;
    const difference=prev?selected.listedDebtTotal-prev.listedDebtTotal:null;
    const top5share=100*concentration(selected,5)/selected.listedDebtTotal;
    $l('lagosDebtHighlights').innerHTML=[
      stat('Deuda visible · '+selected.label,peso(selected.listedDebtTotal),'Suma de unidades publicadas'),
      stat('Variación vs último mes documentado',difference==null?'Sin referencia':moneySigned(difference),prev?`Comparación con ${prev.label}${prevCalendarMonth(prev,selected)?'':' (hay meses sin liquidación)'} (${por(100*difference/prev.listedDebtTotal)})`:'Primer mes disponible',difference==null?'':difference>0?'negative':difference<0?'positive':''),
      stat('Unidades deudoras',String(selected.debtors.length),'Cantidad de registros en el listado'),
      stat('Top 5 / deuda',por(top5share),`Deuda / total liquidado: ${debtRatio(selected)?.toLocaleString('es-AR',{maximumFractionDigits:2})||'—'} veces`)
    ].join('');
  }
  function renderDebtTrends() {
    const all=lagos.months, calendar=calendarRows(),map=new Map(all.map(m=>[m.id,m]));
    seriesSvg('lagosDebtTotalChart',calendar,calendar.map(m=>map.get(m.id)?.listedDebtTotal??null),'money','Deuda visible — meses sin PDF interrumpidos','#0f766e',idFrom());
    seriesSvg('lagosDebtCountChart',calendar,calendar.map(m=>map.get(m.id)?.debtors.length??null),'count','Unidades deudoras — meses sin PDF interrumpidos','#1d4ed8',idFrom());
    seriesSvg('lagosDebtCoverageChart',calendar,calendar.map(m=>map.has(m.id)?debtRatio(map.get(m.id)):null),'ratio','Relación deuda / liquidación — meses sin PDF interrumpidos','#b45309',idFrom());
    seriesSvg('lagosDebtTop5Chart',calendar,calendar.map(m=>map.has(m.id)?100*concentration(map.get(m.id),5)/map.get(m.id).listedDebtTotal:null),'share','Top 5 — meses sin PDF interrumpidos','#7c3aed',idFrom());
    makeTable($l('lagosDebtMonthlyTable'),['Mes','Deuda visible','Diferencia vs último registro','Unidades','Deuda / liquidado','Top 5 %'],all.map((m,i)=>[
      safe(m.label),peso(m.listedDebtTotal),i?`${moneySigned(m.listedDebtTotal-all[i-1].listedDebtTotal)}${prevCalendarMonth(all[i-1],m)?'':' *'}`:'—',String(m.debtors.length),`${debtRatio(m).toLocaleString('es-AR',{maximumFractionDigits:2})}×`,percent(concentration(m,5),m.listedDebtTotal)
    ]));
    const rows=$l('lagosDebtMonthlyTable').querySelectorAll('tbody tr');
    rows.forEach((r,i)=>{if(all[i].id===idFrom())r.classList.add('debt-row-emphasis');r.tabIndex=0;r.title='Seleccionar este mes en el panel';r.style.cursor='pointer';const f=()=>{$l('lagosMonthSelect').value=all[i].id;selection.category=null;selection.debtors=null;renderLagos();};r.addEventListener('click',f);r.addEventListener('keydown',e=>{if(e.key==='Enter')f();});});
    $l('lagosDebtMonthlyNote').textContent='* La diferencia compara los dos listados disponibles, pero existen meses intermedios sin liquidación. No indica cambio estrictamente mensual ni cobro efectivo.';
  }
  function setSelectedDebtUnit(unit,scroll=false) {
    if(!unit||!debtUnits().includes(unit))return;
    debtState.unit=unit;$l('lagosDebtUnit').value=unit;
    renderDebtUnit();
    if(scroll)$l('lagosDebtUnit').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function renderDebtUnit(){
    const unit=debtState.unit,all=lagos.months;
    const vals=all.map(m=>debtorMap(m).get(unit)??null);
    const calendar=calendarRows(),lookup=new Map(all.map((m,i)=>[m.id,vals[i]]));
    seriesSvg('lagosDebtUnitChart',calendar,calendar.map(m=>lookup.has(m.id)?lookup.get(m.id):null),'money',`Historial de saldo visible de la unidad ${unit}`, '#0f766e',idFrom());
    const present=vals.map((v,i)=>v!=null?{value:v,month:all[i]}:null).filter(Boolean);
    const missing=vals.filter(v=>v==null).length;
    const first=present[0],last=present.at(-1);
    $l('lagosDebtUnitSummary').textContent=`Unidad ${unit} · ${present.length} de ${all.length} listados con saldo publicado · ${missing} sin registro. ${first&&last&&first!==last?`Entre ${first.month.label} y ${last.month.label}, la diferencia de saldos publicados es ${moneySigned(last.value-first.value)}.`:'Sin suficientes registros distintos para medir variación.'} No equivale a pagos o intereses cobrados.`;
    makeTable($l('lagosDebtUnitTable'),['Mes','Saldo informado','Variación vs último registro','Situación'],all.map((m,i)=>{
      const v=vals[i],previous=i?vals[i-1]:null;
      const delta=v!=null&&previous!=null?moneySigned(v-previous)+(prevCalendarMonth(all[i-1],m)?'':' *'):'No comparable';
      return [safe(m.label),v==null?'<span class="muted">No figura</span>':peso(v),delta,v==null?'Ausente del listado':'Saldo publicado'];
    }));
  }
  function movementRows(a,b){
    const A=debtorMap(a),B=debtorMap(b),units=[...new Set([...A.keys(),...B.keys()])].sort((u,v)=>u.localeCompare(v,'es',{numeric:true}));
    return units.map(unit=>{
      const before=A.get(unit),after=B.get(unit);
      let status,delta=null;
      if(before==null){status='entry';}
      else if(after==null){status='exit';}
      else {delta=after-before;status=Math.abs(delta)<0.005?'unchanged':delta>0?'increase':'decrease';}
      return {unit,before,after,delta,status};
    });
  }
  const movementNames={entry:'Aparece en listado',exit:'Deja de figurar',increase:'Saldo aumentado',decrease:'Saldo reducido',unchanged:'Sin variación'};
  function renderDebtChanges(){
    const [a,b]=selectedDebtComparison();if(!a||!b)return;
    const rows=movementRows(a,b);
    const visible=debtState.filter==='all'?rows:rows.filter(r=>r.status===debtState.filter);
    const delta=b.listedDebtTotal-a.listedDebtTotal;
    const increases=rows.filter(r=>r.status==='increase'),decreases=rows.filter(r=>r.status==='decrease');
    const entries=rows.filter(r=>r.status==='entry'),exits=rows.filter(r=>r.status==='exit');
    $l('lagosDebtChangeSummary').innerHTML=[
      `<div><span>Variación deuda visible</span><strong>${safe(moneySigned(delta))}</strong></div>`,
      `<div><span>Unidades con aumento</span><strong>${increases.length}</strong></div>`,
      `<div><span>Unidades con reducción</span><strong>${decreases.length}</strong></div>`,
      `<div><span>Aparecen / dejan de figurar</span><strong>${entries.length} / ${exits.length}</strong></div>`
    ].join('');
    const sorted=visible.slice().sort((a,b)=>{
      const x=Math.abs(a.delta??(a.after??a.before)),y=Math.abs(b.delta??(b.after??b.before));return y-x;});
    makeTable($l('lagosDebtMovementTable'),['Unidad',safe(a.label),safe(b.label),'Diferencia comparable','Movimiento'],sorted.map(r=>[
      `<button type="button" class="debt-unit-link" data-debt-unit="${safe(r.unit)}" title="Ver historia de la unidad ${safe(r.unit)}">${safe(r.unit)}</button>`,
      r.before==null?'<span class="muted">No figura</span>':peso(r.before),r.after==null?'<span class="muted">No figura</span>':peso(r.after),r.delta==null?'No comparable':moneySigned(r.delta),`<span class="debt-status ${r.status}">${movementNames[r.status]}</span>`
    ]));
    $l('lagosDebtMovementTable').querySelectorAll('[data-debt-unit]').forEach(btn=>btn.addEventListener('click',()=>setSelectedDebtUnit(btn.dataset.debtUnit,true)));
  }
  function renderDebtConcentration(){
    const m=current();
    const groups=[1,3,5,10];
    const top=groups.map(n=>({n,total:concentration(m,n)}));
    $l('lagosDebtConcentrationKpis').innerHTML=`<strong>${percent(concentration(m,5),m.listedDebtTotal)}</strong><small>Top 5 de ${safe(m.label)} · ${m.debtors.length} unidades</small>`;
    makeTable($l('lagosDebtConcentrationTable'),['Principales unidades','Saldos sumados','% de deuda visible'],top.map(r=>[`Top ${r.n}`,peso(r.total),percent(r.total,m.listedDebtTotal)]));
  }
  function renderDebtDiagnosis(){
    const [a,b]=selectedDebtComparison();if(!a||!b)return;
    const delta=b.listedDebtTotal-a.listedDebtTotal;
    const ratio=debtRatio(b),share=100*concentration(b,5)/b.listedDebtTotal;
    const moves=movementRows(a,b);
    const increased=moves.filter(m=>m.status==='increase').sort((a,b)=>b.delta-a.delta);
    const decreased=moves.filter(m=>m.status==='decrease').sort((a,b)=>a.delta-b.delta);
    const exits=moves.filter(m=>m.status==='exit').sort((a,b)=>b.before-a.before);
    const entries=moves.filter(m=>m.status==='entry').sort((a,b)=>b.after-a.after);
    const bullets=[];
    bullets.push(`Entre ${a.label} y ${b.label}, la deuda visible ${delta>0?'aumentó':delta<0?'disminuyó':'no cambió'} ${peso(Math.abs(delta))} (${a.listedDebtTotal?por(Math.abs(100*delta/a.listedDebtTotal)):'—'} en valor absoluto). Corresponde a una diferencia entre listados, no a un estado de cobranzas.`);
    bullets.push(`En ${b.label} se enumeran ${b.debtors.length} unidades, frente a ${a.debtors.length} en el mes de referencia. La deuda equivale a ${ratio.toLocaleString('es-AR',{maximumFractionDigits:2})} veces el total liquidado de ${b.label}.`);
    bullets.push(`Las cinco unidades con mayor saldo concentran el ${por(share)} de la deuda visible en ${b.label}. El indicador permite focalizar el análisis por unidad sin identificar propietarios.`);
    if(increased.length) bullets.push(`Aumentaron los saldos de ${increased.length} unidades presentes en ambos listados. Mayores aumentos: ${increased.slice(0,3).map(r=>`unidad ${r.unit} (${moneySigned(r.delta)})`).join('; ')}.`);
    if(decreased.length)bullets.push(`Disminuyeron los saldos publicados de ${decreased.length} unidades que figuran en ambos listados. ${decreased.slice(0,2).map(r=>`Unidad ${r.unit}: ${moneySigned(r.delta)}`).join('; ')}. No se puede atribuir esa reducción a pagos sin documentación adicional.`);
    if(exits.length)bullets.push(`${exits.length} unidad(es) dejan de figurar en el listado final${exits.length?', entre ellas '+exits.slice(0,3).map(r=>`${r.unit} (saldo previo ${peso(r.before)})`).join(', '):''}. No significa que la deuda se haya cancelado.`);
    if(entries.length)bullets.push(`${entries.length} unidad(es) aparecen en el listado final sin figurar en el inicial, como ${entries.slice(0,3).map(r=>r.unit).join(', ')}. No implica que la deuda se haya originado enteramente en el período.`);
    if(a.id===b.id)bullets.splice(0,bullets.length,`Seleccionaste el mismo mes (${a.label}) para ambas posiciones. Para analizar cambios, elegí dos meses diferentes.`,bullets[2]);
    $l('lagosDebtDiagnosis').innerHTML=`<ul>${bullets.map(t=>`<li>${safe(t)}</li>`).join('')}</ul><p class="limits-note"><strong>Alcance:</strong> datos nominales de listados de morosos incluidos en liquidaciones individuales; sin mayores de cuenta corriente, acuerdos, estado de caja ni comprobantes de pago. La ausencia de una unidad en el listado no demuestra saldo cero. No se calculan recuperos efectivos.</p>`;
  }
  function renderDebtEvolution(){
    if(!lagos)return;
    renderDebtSummary();renderDebtTrends();renderDebtUnit();renderDebtChanges();renderDebtConcentration();renderDebtDiagnosis();
  }
  function initializeDebtEvolution(){
    const opts=lagos.months.map(m=>`<option value="${safe(m.id)}">${safe(m.label)}</option>`).join('');
    ['lagosDebtFrom','lagosDebtTo'].forEach(id=>$l(id).innerHTML=opts);
    debtState.from=lagos.months.at(-2)?.id||lagos.months[0].id;
    debtState.to=lagos.months.at(-1).id;
    $l('lagosDebtFrom').value=debtState.from;$l('lagosDebtTo').value=debtState.to;
    const units=debtUnits();
    $l('lagosDebtUnit').innerHTML=units.map(u=>`<option value="${safe(u)}">${safe(u)}</option>`).join('');
    debtState.unit=lagos.months.at(-1).debtors.slice().sort((a,b)=>b.amount-a.amount)[0]?.unit||units[0];
    $l('lagosDebtUnit').value=debtState.unit;
    $l('lagosDebtFrom').addEventListener('change',e=>{debtState.from=e.target.value;renderDebtChanges();renderDebtDiagnosis();});
    $l('lagosDebtTo').addEventListener('change',e=>{debtState.to=e.target.value;renderDebtChanges();renderDebtDiagnosis();});
    $l('lagosDebtUnit').addEventListener('change',e=>{debtState.unit=e.target.value;renderDebtUnit();});
    $l('lagosDebtMovementFilter').addEventListener('change',e=>{debtState.filter=e.target.value;renderDebtChanges();});
    $l('lagosDebtMovementReset').addEventListener('click',()=>{debtState.filter='all';$l('lagosDebtMovementFilter').value='all';renderDebtChanges();});
    $l('lagosDebtExport').addEventListener('click',()=>window.print());
  }


  /* v1.1: clasificación por naturaleza de movimiento, sin presumir pago efectivo.
     Los rubros originales de SAPP no distinguen siempre servicio habitual y trabajo adicional. */
  const expenseState={provider:null};
  const normalizeProvider = s => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toUpperCase();
  function isFund(p){return /^fondo (operativo|de reserva)$/i.test(p.provider);}
  function classifyEntry(p){
    const v=Number(p.amount)||0,det=(p.detail||'').toLowerCase();
    if(isFund(p)) return v<0?'Ajustes y devoluciones':'Fondos liquidados';
    if(v<0) return 'Ajustes y devoluciones';
    const name=normalizeProvider(p.provider);
    const routine=['SERGIOSAPP','BANCOROELA','EPE','LAMERCANTILANDINA','PEREZTABOADAFERNANDO','MBSERVICIOLIMPIEZA','PERAMASJOAQUIN','BOMBASSTIB','LAFFITTEEMILIO','FYMCOPY'];
    if(name==='ASCENSORESAMERICA'&&/servicio/i.test(det)&&!/reemplaz|cable|polea|repar|contacto/i.test(det))return 'Servicios habituales identificables';
    if(name==='BOMBASSTIB'&&/servicio|mantenimiento/i.test(det))return 'Servicios habituales identificables';
    if(routine.includes(name))return 'Servicios habituales identificables';
    return 'Otros trabajos y conceptos';
  }
  const expenseKinds=['Servicios habituales identificables','Otros trabajos y conceptos','Fondos liquidados','Ajustes y devoluciones'];
  const pvKey = p=>normalizeProvider(p.provider);
  function expenseEntries(m){return m.providers||[];}
  const sumNumber=arr=>arr.reduce((n,x)=>n+x,0);
  function providerCatalog(){
    const prov=new Map();
    lagos.months.forEach(m=>m.providers.filter(p=>!isFund(p)).forEach(p=>{
      const key=pvKey(p);if(!key)return;
      if(!prov.has(key))prov.set(key,{key,label:p.provider,amount:0});
      const obj=prov.get(key);obj.amount+=p.amount;
      // Prefer readable current naming over historical uppercase.
      if(m.id>='2026-01')obj.label=p.provider;
    }));
    return [...prov.values()].sort((a,b)=>b.amount-a.amount||a.label.localeCompare(b.label,'es'));
  }
  function initExpenseFilters(){
    const opts=lagos.months.map(m=>`<option value="${safe(m.id)}">${safe(m.label)}</option>`).join('');
    $l('lagosExpenseFrom').innerHTML=opts;
    $l('lagosExpenseTo').innerHTML=opts;
    $l('lagosExpenseFrom').value=lagos.months[0].id;
    $l('lagosExpenseTo').value=lagos.months.at(-1).id;
    const catalog=providerCatalog();
    $l('lagosExpenseProvider').innerHTML=catalog.map(p=>`<option value="${safe(p.key)}">${safe(p.label)}</option>`).join('');
    expenseState.provider=catalog.find(p=>p.key==='MBSERVICIOLIMPIEZA')?.key||catalog[0].key;
    $l('lagosExpenseProvider').value=expenseState.provider;
    ['lagosExpenseFrom','lagosExpenseTo'].forEach(id=>$l(id).addEventListener('change',renderExpenseEvolution));
    $l('lagosExpenseProvider').addEventListener('change',()=>{expenseState.provider=$l('lagosExpenseProvider').value;renderExpenseEvolution();});
    $l('lagosExpenseReset').addEventListener('click',()=>{
      $l('lagosExpenseFrom').value=lagos.months[0].id;
      $l('lagosExpenseTo').value=lagos.months.at(-1).id;
      renderExpenseEvolution();
    });
  }
  function renderExpenseEvolution(){
    const selected=rowsBetween($l('lagosExpenseFrom').value,$l('lagosExpenseTo').value);
    if(!selected.length)return;
    const cal=calendarRows(selected), byMonth=new Map(selected.map(m=>[m.id,m]));
    const expenses=selected.flatMap(m=>expenseEntries(m).map(p=>({...p,month:m}))), totals=selected.map(m=>m.liquidatedTotal);
    const fundTotal=sumNumber(expenses.filter(p=>isFund(p)).map(p=>p.amount));
    const first=selected[0],last=selected.at(-1);
    const nGap=cal.filter(m=>m.missing).length;
    $l('lagosExpenseSummary').innerHTML=[
      stat('Importe liquidado · períodos documentados',peso(sumNumber(totals)),`${selected.length} meses con comprobante`),
      stat('Fondos netos liquidados',peso(fundTotal),'Incluye aportes y devoluciones; no equivale a caja del fondo'),
      stat('Promedio por mes documentado',peso(sumNumber(totals)/selected.length),'Sin estimar períodos faltantes'),
      stat('Meses sin liquidación entre extremos',String(nGap),'Se muestran como interrupciones del gráfico')
    ].join('');
    seriesSvg('lagosExpenseTotalChart',cal,cal.map(m=>byMonth.get(m.id)?.liquidatedTotal??null),'money','Total computable liquidado; faltantes sin unir','#0f766e',idFrom());
    seriesSvg('lagosExpenseExFundsChart',cal,cal.map(m=>{
      const orig=byMonth.get(m.id);return orig?orig.liquidatedTotal-sumNumber(orig.providers.filter(isFund).map(p=>p.amount)):null;
    }),'money','Total liquidado descontando partidas identificadas como fondos','#1d4ed8',idFrom());
    makeTable($l('lagosExpenseMonthsTable'),['Mes','Total liquidado','Rubros 01–04','Rubro 08','Fondos identificados','Otros conceptos sin fondos'],selected.map(m=>{
      const f=sumNumber(m.providers.filter(isFund).map(p=>p.amount));
      return [safe(m.label),peso(m.liquidatedTotal),peso(m.habitualExpenses),peso(m.nonHabitualExpenses),peso(f),peso(m.liquidatedTotal-f)];
    }));
    // Gastos recurrentes: se compara un servicio en el tiempo, no rubros heterogéneos.
    const provKey=expenseState.provider||$l('lagosExpenseProvider').value;
    const prov=providerCatalog().find(p=>p.key===provKey);
    const pTotal=cal.map(m=>{
      const mm=byMonth.get(m.id);return mm?sumNumber(mm.providers.filter(p=>pvKey(p)===provKey).map(p=>p.amount)):null;
    });
    $l('lagosExpenseProviderName').textContent=prov?.label||'Proveedor';
    seriesSvg('lagosExpenseProviderChart',cal,pTotal,'money','Liquidación del proveedor; cero es ausencia de movimiento, no pago verificado','#b45309',idFrom());
    let lastCharge=null;
    const providerRows=selected.map(m=>{
      const lines=m.providers.filter(p=>pvKey(p)===provKey),sum=sumNumber(lines.map(p=>p.amount));
      const delta=lastCharge!=null?sum-lastCharge:null;
      const result=[safe(m.label),lines.length?peso(sum):'Sin movimiento',delta===null?'—':moneySigned(delta),String(lines.length),lines.map(p=>safe(p.detail)).join(' · ')||'No figura en los movimientos'];
      if(lines.length)lastCharge=sum;
      return result;
    });
    makeTable($l('lagosExpenseProviderTable'),['Mes','Liquidado al proveedor','Cambio vs cargo registrado previo','Movimientos','Conceptos'],providerRows);
    $l('lagosExpenseProviderNote').textContent=`${prov?.label||'Proveedor'}: ${selected.filter(m=>m.providers.some(p=>pvKey(p)===provKey)).length} meses con movimientos identificados. Los ceros se dibujan únicamente para meses con liquidación, no para meses sin documento. Las variaciones pueden incluir obras, anticipos y servicios distintos.`;
    const nature=expenseKinds.map(kind=>({kind,total:sumNumber(expenses.filter(p=>classifyEntry(p)===kind).map(p=>p.amount))}));
    makeTable($l('lagosExpenseNatureTable'),['Naturaleza de los conceptos identificados','Importe neto','Proporción del total'],nature.map(n=>[safe(n.kind),peso(n.total),percent(n.total,sumNumber(totals))]));
    const catalog=providerCatalog();
    const ranking=catalog.map(p=>{
      const matches=expenses.filter(x=>pvKey(x)===p.key),monthCount=new Set(matches.map(x=>x.month.id)).size;
      return {...p,total:sumNumber(matches.map(x=>x.amount)),monthCount};
    }).filter(p=>p.monthCount).sort((a,b)=>b.total-a.total);
    makeTable($l('lagosExpenseProviderRanking'),['Proveedor','Total período','Meses con cargo','Seleccionar'],ranking.map(p=>[
      safe(p.label),peso(p.total),String(p.monthCount),`<button type="button" class="debt-unit-link lagos-expense-link" data-provider="${safe(p.key)}">Ver evolución</button>`
    ]));
    $l('lagosExpenseProviderRanking').querySelectorAll('[data-provider]').forEach(b=>b.addEventListener('click',()=>{
      expenseState.provider=b.dataset.provider;$l('lagosExpenseProvider').value=expenseState.provider;renderExpenseEvolution();
      $l('lagosExpenseProvider').scrollIntoView({behavior:'smooth',block:'center'});
    }));
    const alerts=[];
    if(nGap)alerts.push(`Hay ${nGap} mes(es) sin comprobante entre ${first.label} y ${last.label}; no se completan ni se interpolan.`);
    if(fundTotal)alerts.push(`Los fondos identificados suman ${peso(fundTotal)} (importe neto liquidado). No acreditan aplicación efectiva a obras.`);
    const suppliers=selected.flatMap(m=>m.providers.filter(p=>!isFund(p)&&classifyEntry(p)==='Servicios habituales identificables').map(p=>({...p,month:m.id})));
    const normalized=new Map();
    suppliers.forEach(p=>{
      const key=pvKey(p),map=normalized.get(key)||new Map();map.set(p.month,(map.get(p.month)||0)+p.amount);normalized.set(key,map);
    });
    [...normalized].forEach(([key,map])=>{
      const records=[...map];if(records.length<2)return;
      const [a,b]=records.slice(-2);const growth=a[1]?100*(b[1]-a[1])/a[1]:0;
      if(growth>20){const name=catalog.find(p=>p.key===key)?.label||key;alerts.push(`${name}: último importe de servicio identificado ${por(growth)} superior al cargo anterior (${a[0]} → ${b[0]}). Verificar equivalencia del servicio y respaldo.`);}
    });
    $l('lagosExpenseAlerts').innerHTML=alerts.map(a=>`<li>${safe(a)}</li>`).join('')||'<li>No se identificaron alertas automáticas con los criterios seleccionados.</li>';
  }

  function buildSelectors() {
    const options=lagos.months.map(m=>`<option value="${safe(m.id)}">${safe(m.label)}</option>`).join('');
    for (const id of ['lagosMonthSelect','lagosFrom','lagosTo','lagosMonthA','lagosMonthB']) $l(id).innerHTML=options;
    $l('lagosMonthSelect').value=lagos.months.at(-1).id;
    $l('lagosFrom').value=lagos.months[0].id;
    $l('lagosTo').value=lagos.months.at(-1).id;
    $l('lagosMonthA').value=lagos.months[0].id;
    $l('lagosMonthB').value=lagos.months.at(-1).id;
    initializeDebtEvolution();
    initExpenseFilters();
  }
  function current() {return month(idFrom());}
  function displayKPIs(m) {
    const dat=[
      ['Total computable liquidado',peso(m.liquidatedTotal),'No es gasto efectivo de caja'],
      ['Rubros 01–04',peso(m.habitualExpenses),'Incluyen servicios, trabajos, y a veces fondos'],
      ['Rubro 08 · No habituales',peso(m.nonHabitualExpenses),'Puede incluir fondos, anticipos y ajustes'],
      ['Listado de deudores',peso(m.listedDebtTotal),`${m.debtors.length} unidades enumeradas; suma del listado`],
      ['Fondo operativo',m.fundOperating ? peso(m.fundOperating) : 'Sin partida','Puede estar en rubro 04 u 08'],
      ['Fondo de reserva (neto)',m.fundReserve ? peso(m.fundReserve) : 'Sin partida','Aportes/devoluciones netos, no saldo contable'],
      ['Participación del mes · unidad '+(m.source.unit||'01-03'),peso(m.unitCharge),'No incluye deuda previa ni necesariamente coincide con el total a pagar'],
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
    const all=rowsBetween($l('lagosFrom').value,$l('lagosTo').value).flatMap(m=>m.providers.filter(p=>!/^Fondo (Operativo|de Reserva)$/i.test(p.provider)).map(p=>({...p,month:m.label})));
    const summary=new Map();
    all.forEach(r=>summary.set(r.provider,(summary.get(r.provider)||0)+r.amount));
    const byProv=[...summary].map(([label,value])=>({label,value,key:label})).filter(p=>p.value>0).sort((a,b)=>b.value-a.value);
    const pie=groupSmallSlices(byProv,8);
    const total=byProv.reduce((s,p)=>s+p.value,0);
    const select=it=>{ const keys=selectKeys(it); selection.providers=(selection.providers&&keys.length===selection.providers.length&&keys.every(k=>selection.providers.includes(k)))?null:keys;displayProviders(); };
    chartWithLegend('lagosProvidersChart','lagosProvidersLegend',pie,selection.providers,select,total);
    const rows=selection.providers?.length?all.filter(r=>selection.providers.includes(r.provider)):all;
    const displayedTotal=rows.reduce((s,r)=>s+r.amount,0);
    $l('lagosProvidersSummary').textContent=`${rows.length} movimientos · ${summary.size} proveedores en período · total visible ${peso(displayedTotal)}. Las partidas de fondos operativos y de reserva se excluyen por no representar proveedores.`;
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
    $l('lagosDebtorsTable').querySelectorAll('tbody tr').forEach((r,i)=>{r.title='Clic para ver evolución histórica de la unidad';r.style.cursor='pointer';r.addEventListener('click',()=>setSelectedDebtUnit(sorted[i].unit,true));});
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
      m.report?`<a target="_blank" rel="noopener noreferrer" href="${safe(m.report)}">Abrir informe PDF</a>`:'<span class="muted">No disponible</span>',
      'Rubros y deudores conciliados · sin estado de caja'
    ]));
  }
  function renderLagos() {
    if(chosen!=='lagos-2797'||!lagos)return;
    const m=current(); if(!m)return;
    displayKPIs(m);displayReading(m);displayComposition(m);displayProviders();displayDebtors(m);displayCompare();displayDocs();renderDebtEvolution();renderExpenseEvolution();
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
