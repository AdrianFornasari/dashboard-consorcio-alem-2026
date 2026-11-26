/* v1.2 — Seguimiento documental de fondos, anticipos y obras.
   Independiente del dashboard financiero: NO estima pagos ni saldos de obra. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = value => value == null ? 'No informado' : new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
  const esc = val => String(val ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let registry = null;
  let building = 'alem-1274';
  const filters = {from:null,to:null,project:'all',kind:'all',query:''};
  const kinds = {'fondo':'Fondo','acopio':'Acopio','anticipo':'Anticipo/cuota','trabajo':'Trabajo o compra','mixto':'Partida mixta','ajuste':'Devolución/ajuste'};
    const sum = (list,select=()=>true) => list.filter(select).reduce((n,x)=>n+x.amount,0);
  const active = () => registry?.buildings?.[building] || null;
  const projects = () => registry.projects.filter(p=>p.building===building);
  const sourceMonth = s => `${s.slice(5)}/${s.slice(0,4)}`;
  const useMonth = (str) => str >= filters.from && str <= filters.to;
  const allEntries = () => registry.entries.filter(e=>e.building===building && useMonth(e.month));
  const projectEntries = () => allEntries().filter(e=>filters.project==='all'||e.project===filters.project);
  const filteredEntries = () => projectEntries().filter(e=>
     (filters.kind==='all' || e.kind===filters.kind) &&
     (!filters.query || [e.provider,e.detail,e.note,e.project,e.month].join(' ').toLocaleLowerCase('es').includes(filters.query))
  );
  const projectName = id => registry.projects.find(p=>p.id===id)?.name || id;
  const sourceMonthName = m => new Date(m+'-15T12:00:00').toLocaleDateString('es-AR',{month:'short',year:'numeric'});
  const calendar = months => {
    if (!months.length)return [];
    const set=new Set(months),a=months[0].split('-').map(Number),b=months.at(-1).split('-').map(Number),out=[];
    let [y,m]=a;
    for(;y<b[0]||(y===b[0]&&m<=b[1]);){const id=`${y}-${String(m).padStart(2,'0')}`;out.push({id,documented:set.has(id)});m++;if(m===13){y++;m=1;}}
    return out.filter(x=>useMonth(x.id));
  };
  function selector(id,options,value){
    const el=$(id);el.innerHTML=options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');el.value=value;
  }
  function changeBuilding(next){
    if(!registry||!activeBuildingExists(next))return;
    building=next;
    const list=active().months;
    filters.from=list[0]; filters.to=list.at(-1);filters.project='all'; filters.kind='all';filters.query='';
    $('fundsQuery').value='';
    selector('fundsFrom',list.map(v=>({value:v,label:sourceMonthName(v)})),filters.from);
    selector('fundsTo',list.map(v=>({value:v,label:sourceMonthName(v)})),filters.to);
    renderProjects();
    $('fundsKind').value='all';
    render();
  }
  function activeBuildingExists(id){return id in (registry?.buildings||{});}
  function renderProjects(){
    const ps=[{id:'all',name:'Todos los proyectos'},...projects()];
    selector('fundsProject',ps.map(p=>({value:p.id,label:p.name})),filters.project);
  }
  function mkKpi(label,value,foot){return `<div class="funds-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(foot)}</small></div>`;}
  function renderKpis(entries){
    const fundTotal=sum(entries,e=>e.kind==='fondo');
    const part=sum(entries,e=>e.kind==='acopio'||e.kind==='anticipo');
    const work=sum(entries,e=>e.kind==='trabajo');
    const mixed=sum(entries,e=>e.kind==='mixto');
    $('fundsKpis').innerHTML=[
       mkKpi('Fondos liquidados, neto',money(fundTotal),'Incluye devoluciones de fondos; no saldo de caja'),
       mkKpi('Acopios y anticipos liquidados',money(part),'No demuestra pago al proveedor'),
       mkKpi('Trabajos / compras informados',money(work),'No acredita erogación efectiva'),
       mkKpi('Partidas mixtas',money(mixed),mixed?'Exigen desagregación documental':'Sin movimientos mixtos seleccionados')
    ].join('');
  }
  function renderCards(entries){
    const cards=projects().map(p=>{
      const rows=entries.filter(e=>e.project===p.id);
      const fund=sum(rows,e=>e.kind==='fondo'), advances=sum(rows,e=>['acopio','anticipo'].includes(e.kind)), works=sum(rows,e=>e.kind==='trabajo');
      const cls=filters.project===p.id?'funds-active':'';
      const meta=rows.length ? `${rows.length} movimientos · fondos ${money(fund)} · acopios/anticipos ${money(advances)} · trabajos ${money(works)}` : 'Sin movimientos identificados en el período';
      return `<button type="button" class="funds-project ${cls}" data-funds-project="${esc(p.id)}" aria-pressed="${cls?'true':'false'}"><strong>${esc(p.name)}</strong><span>${esc(meta)}</span><small>${esc(p.description)}</small></button>`;
    });
    $('fundsProjects').innerHTML=cards.join('');
    $('fundsProjects').querySelectorAll('[data-funds-project]').forEach(el=>el.addEventListener('click',()=>{
      filters.project=filters.project===el.dataset.fundsProject?'all':el.dataset.fundsProject;
      $('fundsProject').value=filters.project; render();
      $('fundsMovementsTitle').scrollIntoView({behavior:'smooth',block:'center'});
    }));
  }
  function renderMonthGraph(entries){
    const months=calendar(active().months), sums=months.map(({id,documented})=>{
      const rows=entries.filter(e=>e.month===id);
      return {id,documented,
        fondo:sum(rows,e=>e.kind==='fondo'),
        anticipos:sum(rows,e=>e.kind==='acopio'||e.kind==='anticipo'),
        obras:sum(rows,e=>e.kind==='trabajo'),
        mixtos:sum(rows,e=>e.kind==='mixto'),
        ajustes:sum(rows,e=>e.kind==='ajuste')};
    });
    const positive=m=>Math.max(0,m.fondo)+Math.max(0,m.anticipos)+Math.max(0,m.obras)+Math.max(0,m.mixtos);
    const max=Math.max(1,...sums.map(positive));
    $('fundsMonthGraph').innerHTML=sums.map(m=>{
      if(!m.documented)return `<div class="funds-month-row is-missing"><span class="funds-month-name">${esc(sourceMonthName(m.id))}</span><span class="funds-no-doc">Sin PDF disponible</span></div>`;
      const bars=[['fondo',Math.max(m.fondo,0)],['acopio',Math.max(m.anticipos,0)],['trabajo',Math.max(m.obras,0)],['mixto',Math.max(m.mixtos,0)]].filter(a=>a[1]>0);
      const fills=bars.map(([k,v])=>`<span class="funds-segment funds-${k}" style="width:${(v/max*100).toFixed(3)}%" title="${esc(k)}: ${esc(money(v))}"></span>`).join('');
      const summary=bars.length?`Fondos ${money(m.fondo)} · acopios/anticipos ${money(m.anticipos)} · trabajos ${money(m.obras)}${m.mixtos?', mixtas '+money(m.mixtos):''}`:'Sin partidas seleccionadas';
      return `<div class="funds-month-row"><span class="funds-month-name">${esc(sourceMonthName(m.id))}</span><div class="funds-bars"><div class="funds-track">${fills}</div><span class="funds-month-total" title="${esc(summary)}">${esc(summary)}</span>${m.fondo<0?`<small>Fondo neto negativo: ${esc(money(m.fondo))}</small>`:''}${m.ajustes<0?`<small>Ajustes: ${esc(money(m.ajustes))}</small>`:''}</div></div>`;
    }).join('');
    $('fundsGraphHelp').textContent='Barras por tipo de cargo positivo, no un total de gasto. Fondos y trabajos pueden representar distintas etapas del mismo proyecto y NO deben sumarse como inversión. Los ajustes y fondos negativos se muestran en texto.';
  }
  function renderMovements(){
    const rows=filteredEntries().sort((a,b)=>b.month.localeCompare(a.month)||a.project.localeCompare(b.project));
    $('fundsMovementCount').textContent=`${rows.length} partidas visibles · ${new Set(rows.map(r=>r.month)).size} meses con movimientos`;
    $('fundsMovements').innerHTML=`<thead><tr><th>Mes</th><th>Proyecto</th><th>Tipo</th><th>Proveedor / concepto</th><th>Fuente</th><th class="num">Importe</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(sourceMonth(r.month))}</td><td>${esc(projectName(r.project))}</td><td><span class="funds-kind ${esc(r.kind)}">${esc(r.kindLabel)}</span></td><td><strong>${esc(r.provider)}</strong><br>${esc(r.detail)}<br><small class="muted">${esc(r.note)} · ${esc(r.paymentEvidence)}</small></td><td><span title="La fuente original puede no estar publicada por privacidad">${esc(r.source)}${r.page?', p. '+esc(r.page):''}</span></td><td class="num">${esc(money(r.amount))}</td></tr>`).join('')||'<tr><td colspan="6">Sin movimientos que cumplan los filtros seleccionados.</td></tr>'}</tbody>`;
  }
  function renderPending(){
    const snapshots=registry.pendingSnapshots.filter(e=>e.building===building);
    const container=$('fundsPending');
    if(!snapshots.length){
      container.innerHTML='<p class="muted">No hay detalle de cuentas por pagar por proyecto en los PDFs disponibles para este edificio. No se presenta un saldo estimado ni se presume que todo lo liquidado fue cobrado o pagado.</p>';
      return;
    }
    const visible=snapshots.filter(x=>filters.project==='all'||x.project===filters.project);
    const when=snapshots[0].month;
    container.innerHTML=`<p class="muted">Foto de saldos impagos al <strong>${esc(sourceMonthName(when))}</strong>. No son cargos nuevos ni se acumulan con los meses anteriores. ${filters.project==='all'?'Total global de cuentas por pagar según liquidación: '+esc(money(sum(snapshots)))+'.':'Vista filtrada por proyecto.'}</p><div class="table-wrap"><table class="funds-table"><thead><tr><th>Obra o fondo</th><th>Concepto</th><th>Documento</th><th class="num">Saldo impago</th></tr></thead><tbody>${visible.map(r=>`<tr><td>${esc(projectName(r.project))}</td><td>${esc(r.detail)}</td><td>${esc(r.source)}</td><td class="num">${esc(money(r.amount))}</td></tr>`).join('')||'<tr><td colspan="4">No se informa un saldo pendiente específico de este proyecto en la foto disponible.</td></tr>'}</tbody></table></div>`;
  }
  function render(){
    if(!registry||!active())return;
    $('fundsScope').textContent=`${active().name} · ${active().months.length} meses documentados hasta ${sourceMonthName(active().asOf)} (incluye sólo movimientos seleccionados de fondos y obras)`;
    const pe=projectEntries();
    renderKpis(pe); renderCards(allEntries());renderMonthGraph(pe);renderMovements();renderPending();
    $('fundsStatus').textContent='Fuente: liquidaciones mensuales y listado de partidas curadas. No se disponen de mayores de obra ni comprobantes bancarios para conciliación definitiva.';
  }
  function bind(){
    $('fundsFrom').addEventListener('change',e=>{
      filters.from=e.target.value;if(filters.from>filters.to){filters.to=filters.from;$('fundsTo').value=filters.to;}render();
    });
    $('fundsTo').addEventListener('change',e=>{
      filters.to=e.target.value;if(filters.to<filters.from){filters.from=filters.to;$('fundsFrom').value=filters.from;}render();
    });
    $('fundsProject').addEventListener('change',e=>{filters.project=e.target.value;render();});
    $('fundsKind').addEventListener('change',e=>{filters.kind=e.target.value;renderMovements();});
    $('fundsQuery').addEventListener('input',e=>{filters.query=e.target.value.trim().toLocaleLowerCase('es');renderMovements();});
    $('fundsClearFilters').addEventListener('click',()=>changeBuilding(building));
    $('fundsPrint').addEventListener('click',()=>{ $('fondosObras').open=true;document.body.classList.add('funds-print-only');window.print(); });
    window.addEventListener('afterprint',()=>document.body.classList.remove('funds-print-only'));
    const select=$('buildingSelect');
    select.addEventListener('change',()=>{if(activeBuildingExists(select.value))changeBuilding(select.value);});
    const observer=new MutationObserver(()=>{
      const next=document.body.dataset.activeBuilding;
      if(next&&next!==building&&activeBuildingExists(next))changeBuilding(next);
    });
    observer.observe(document.body,{attributes:true,attributeFilter:['data-active-building']});
  }
  async function start(){
    if(!$('fondosObras'))return;
    try{
      const response=await fetch('data/seguimiento_fondos_v12.json',{cache:'no-store'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      registry=await response.json();
      if(!Array.isArray(registry.entries)||!Array.isArray(registry.projects))throw new Error('Estructura de datos inválida');
      bind();
      changeBuilding($('buildingSelect').value||'alem-1274');
    }catch(err){$('fundsBody').innerHTML=`<p role="alert">No se pudo cargar el seguimiento v1.2 (${esc(err.message)}). Revisá que <code>data/seguimiento_fondos_v12.json</code> esté publicado.</p>`;}
  }
  start();
})();
