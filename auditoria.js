/* Auditoría documental v1.3: sólo lectura, no certificación contable. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const safe = x => String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const amount = x => x == null ? 'No informado' : new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(x));
 const states = {'ok':'Conciliado','warning':'Advertencia','error':'Diferencia','pending':'Pendiente','info':'Sin información'};
 const files = {
  'alem-1274':['data/expensas-2026.json'],
  'lagos-2797':['consorcios/lagos-2797/data/2025.json','consorcios/lagos-2797/data/2026.json'],
 };
 let registry=null, datasets={}, funds=null, build='alem-1274', month='', currentRecords=[], freshness='none';
 const statusClass = s => 'audit-state audit-'+s;
 function mRow() { return registry?.months.find(m=>m.building===build && m.id===month); }
 function getMonthData(entry) {
  const data=datasets[entry.source];
  return data?.months?.find(m=>m.id===entry.id);
 }
 function choice(id, choices, v) {
  $(id).innerHTML=choices.map(x=>`<option value="${safe(x.value)}">${safe(x.label)}</option>`).join('');
  $(id).value=v;
 }
 function renderOverview() {
  const entry=mRow(); if(!entry)return;
  const cs=entry.checks;
  const counts=Object.fromEntries(['ok','error','warning','pending','info'].map(s=>[s,cs.filter(c=>c.state===s).length]));
  const scope=registry.summaries[build];
  $('auditScope').textContent=`${scope.name} · ${scope.months} meses documentados · ${entry.label}. Último cálculo: ${new Date(registry.generatedAt).toLocaleString('es-AR')}.`;
  $('auditTotals').innerHTML=[
   ['Conciliados',counts.ok,'ok'],['Diferencias',counts.error,'error'],['Advertencias',counts.warning,'warning'],['Requieren verificación',counts.pending,'pending'],
  ].map(([label,value,state])=>`<div class="audit-kpi"><small>${safe(label)}</small><strong>${value}</strong><span class="${statusClass(state)}">${safe(states[state])}</span></div>`).join('');
  $('auditNotes').innerHTML=`<strong>Alcance:</strong> los totales conciliados son comprobaciones internas del JSON, no una auditoría independiente del PDF. En Lagos los originales se conservan fuera del sitio por privacidad. En Alem debe revisarse la anonimización de los PDF publicados. ${freshness==='ok'?'Los archivos de origen coinciden con los utilizados para generar esta auditoría.':freshness==='stale'?'⚠️ Algún JSON fue modificado después de generar este registro. Volvé a ejecutar el auditor antes de publicar.':'La vigencia del registro todavía no está comprobada.'}`;
  const checkFilter=$('auditFilter').value;
  const visible=cs.filter(c=>checkFilter==='all'||(checkFilter==='attention'&&c.state!=='ok')||(checkFilter==='source'&&['documentos','trazabilidad','privacidad'].includes(c.group))||(checkFilter===c.state));
  $('auditCheckCount').textContent=`${visible.length} controles visibles · ${cs.length} controles para el mes.`;
  $('auditChecks').innerHTML=`<thead><tr><th>Control</th><th>Estado</th><th>Resultado y alcance</th><th>Origen</th></tr></thead><tbody>${visible.map(c=>`<tr><td><strong>${safe(c.title)}</strong><br><small>${safe(c.group)}</small></td><td><span class="${statusClass(c.state)}">${safe(states[c.state])}</span></td><td>${safe(c.detail)}</td><td><code>${safe(c.source||entry.sourcePath)}</code></td></tr>`).join('')||'<tr><td colspan="4">No hay resultados con este filtro.</td></tr>'}</tbody>`;
  const path=entry.report;
  const safeReport=typeof path==='string' && /^(informes|consorcios\/lagos-2797\/informes)\/[\w-]+\.pdf$/.test(path);
  $('auditDocuments').innerHTML=`<p><strong>Origen de los datos:</strong> <code>${safe(entry.sourcePath)}</code></p><p><strong>Liquidación:</strong> ${entry.pdf?`<code>${safe(entry.pdf)}</code> · revisar si está anonimizada`:'Original de Lagos no publicado (contiene datos personales)'}</p><p><strong>Informe:</strong> ${safeReport?`<a href="${safe(path)}" target="_blank" rel="noopener noreferrer">Abrir informe del mes</a>`:'No disponible'}</p><p class="muted small">Las páginas individuales de proveedores y unidades no están mapeadas en los JSON históricos. Cuando no hay página de respaldo, se indica “sin página determinada”.</p>`;
 }
 function traceEntries() {
  const entry=mRow(); if(!entry)return [];
  const m=getMonthData(entry);if(!m)return [];
  const rows=[];
  for(const [kind,key,title] of [['rubro','composition','Rubro'],['proveedor','providers','Proveedor'],['unidad','debtors','Unidad']]) {
   (m[key]||[]).forEach((x,i)=>rows.push({kind,label:kind==='unidad'?'Unidad '+x.unit:kind==='proveedor'?x.provider:x.category,detail:kind==='proveedor'?x.detail:kind==='rubro'?x.type:'Saldo visible (no acredita pago)',amount:x.amount,origin:`${entry.source} → months[${entry.sourcePath.match(/months\[(\d+)\]/)?.[1]||0}].${key}[${i}]`,page:null}));
  }
  (funds?.entries||[]).filter(x=>x.building===build&&x.month===month).forEach((x,i)=>rows.push({kind:'fondo',label:x.provider,detail:`${x.kindLabel}: ${x.detail}`,amount:x.amount,origin:`data/seguimiento_fondos_v12.json · ${x.source}`,page:x.page}));
  return rows;
 }
 function renderTrace(){
  const kind=$('auditTraceType').value;
  const search=$('auditSearch').value.toLocaleLowerCase('es').trim();
  const rows=traceEntries().filter(x=>(kind==='all'||x.kind===kind)&&(!search||[x.label,x.detail,x.origin].join(' ').toLocaleLowerCase('es').includes(search)));
  currentRecords=rows;
  $('auditTraceSummary').textContent=`${rows.length} registros visibles · Rubros, proveedores, unidades y fondos. Las filas muestran la ruta exacta dentro de los datos JSON; en fondos, la referencia documental adicional si está cargada.`;
  $('auditTrace').innerHTML=`<thead><tr><th>Tipo</th><th>Dato / concepto</th><th class="audit-number">Importe</th><th>Procedencia y página</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe({rubro:'Rubro',proveedor:'Proveedor',unidad:'Unidad',fondo:'Obra / fondo'}[r.kind])}</td><td><strong>${safe(r.label)}</strong><br><small>${safe(r.detail||'—')}</small></td><td class="audit-number">${safe(amount(r.amount))}</td><td><code>${safe(r.origin)}</code><br><small>${r.page?`Página ${safe(r.page)}`:'Página sin determinar'}</small></td></tr>`).join('')||'<tr><td colspan="4">Sin datos con esos filtros.</td></tr>'}</tbody>`;
 }
 function render(){renderOverview();renderTrace();}
 function chooseBuilding(next){
  if(!registry||!files[next])return;
  build=next;
  const mm=registry.months.filter(m=>m.building===build);
  month=mm.at(-1)?.id || '';
  choice('auditMonth',mm.map(m=>({value:m.id,label:m.label})),month);
  $('auditFilter').value='all';$('auditTraceType').value='all';$('auditSearch').value='';
  render();
 }
 async function checkFreshness(){
  if(!registry?.sourceHashes || !globalThis.crypto?.subtle){freshness='unknown';return;}
  let stale=false;
  for(const [name,expected] of Object.entries(registry.sourceHashes)){
   try{
    const response=await fetch(name,{cache:'no-store'});
    if(!response.ok)throw new Error('No disponible');
    const ab=await response.arrayBuffer();
    const sha=await crypto.subtle.digest('SHA-256',ab);
    const actual=Array.from(new Uint8Array(sha),x=>x.toString(16).padStart(2,'0')).join('');
    if(actual!==expected){stale=true;}
   }catch(e){stale=true;}
  }
  freshness=stale?'stale':'ok';
 }
 async function initialize(){
  const root=$('auditoriaPanel');if(!root)return;
  try{
   const auditResponse=await fetch('data/auditoria_v13.json',{cache:'no-store'});
   if(!auditResponse.ok)throw new Error(`HTTP ${auditResponse.status} leyendo auditoría`);
   registry=await auditResponse.json();
   if(registry.version!=='1.3.0')throw new Error('Versión incompatible del registro');
   const sources=Object.keys(registry.sourceHashes||{});
   await Promise.all(sources.filter(s=>s.endsWith('.json')).map(async path=>{
    const response=await fetch(path,{cache:'no-store'});
    if(!response.ok)throw new Error(`Sin acceso a ${path}`);
    datasets[path]=await response.json();
    if(path==='data/seguimiento_fondos_v12.json')funds=datasets[path];
   }));
   await checkFreshness();
   const chosen=$('buildingSelect')?.value;
   chooseBuilding(files[chosen]?chosen:'alem-1274');
   $('auditMonth').addEventListener('change',e=>{month=e.target.value;render();});
   $('auditFilter').addEventListener('change',renderOverview);
   $('auditTraceType').addEventListener('change',renderTrace);
   $('auditSearch').addEventListener('input',renderTrace);
   $('auditReset').addEventListener('click',()=>{chooseBuilding(build);});
   $('buildingSelect')?.addEventListener('change',e=>chooseBuilding(e.target.value));
   $('auditPrint').addEventListener('click',()=>{ document.body.classList.add('audit-print-only'); window.print(); });
   window.addEventListener('afterprint',()=>document.body.classList.remove('audit-print-only'));
   $('auditStatus').textContent=`Registro de auditoría cargado. ${registry.months.length} meses revisados. ${freshness==='ok'?'Fuentes JSON sin cambios desde la generación.':freshness==='stale'?'ATENCIÓN: registro desactualizado; regenerar antes de publicar.':'Sin cotejo automático de vigencia.'}`;
  }catch(e){
   $('auditStatus').textContent='No se pudo iniciar la auditoría: '+e.message+'. Verificá que el servidor local y los JSON estén disponibles.';
  }
 }
 initialize();
})();
