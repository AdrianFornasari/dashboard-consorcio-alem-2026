#!/usr/bin/env python3
"""Regenera SOLO el registro analítico v1.2 a partir de JSON ya validados.

Ejecutar desde la raíz del repositorio: python scripts/build_funds_registry_v12.py
No infiere pagos de caja ni inventa documentación. Cada partida incluida está curada
por (mes, índice de la entrada en providers). Los meses nuevos requieren revisión.
"""
from __future__ import annotations
from collections import defaultdict
from pathlib import Path
from datetime import date
import json,sys

ROOT=Path(__file__).resolve().parents[1]
ALEM='alem-1274'; LAGOS='lagos-2797'
# Cada referencia es (id_de_proyecto, clase, nota opcional). Índices cero-basados
# en providers de la liquidación estructurada; evitar agregar filas automáticas
# sin revisar el texto del documento fuente y su clasificación.
A={
 '2026-02':{12:('alem-acopios','acopio','Acopio genérico; no se identifica una obra concreta.')},
 '2026-03':{15:('alem-acopios','acopio','Acopio genérico; no se identifica una obra concreta.')},
 '2026-04':{14:('alem-bajada','acopio','Acopio identificado para caño de bajada.'),15:('alem-otras','trabajo','Boca de inspección; verificar ubicación y alcance.')},
 '2026-05':{12:('alem-reparaciones','trabajo','Reparación no habitual informada en ordinarios.'),13:('alem-medianera','trabajo','Reparación de medianera.'),14:('alem-bajada','acopio','Acopio para caño de bajada.')},
 '2026-06':{13:('alem-desagues','trabajo','Destape cloacal no habitual.'),14:('alem-medianera','trabajo','Saldo facturado por reparación de medianera; no acredita pago por sí solo.'),15:('alem-reparaciones','mixto','Agrupa filtración/desagüe y acopios; no desagregable con el JSON.'),16:('alem-bombas','trabajo','Partida agrupada de reparaciones y desagote.'),17:('alem-acopios','acopio','Saldo de acopio; la obra no está identificada inequívocamente.')},
 '2026-07':{12:('alem-otras','trabajo','Reparación no habitual de puerta.'),13:('alem-reparaciones','mixto','Agrupa albañilería y acopios; separar con comprobantes.'),14:('alem-bombas','trabajo','Bomba de desagote informada.')},
 '2026-08':{13:('alem-desagues','trabajo','Destape e inspección; no asumir equivalencia con cañerías centrales.'),14:('alem-reparaciones','trabajo','Albañilería no atribuida inequívocamente a obra específica.'),15:('alem-camara','acopio','Acopio para cámara. No debe sumarse al saldo pendiente como una nueva obligación.')},
 '2026-09':{11:('alem-desagues','trabajo','Destape y limpieza en ordinarios no habituales.'),12:('alem-bombas','trabajo','Compra e instalación de bomba.'),13:('alem-camara','acopio','Acopio liquidado en septiembre; puede relacionarse con el mismo proyecto que otros meses.')},
 '2026-10':{15:('alem-reparaciones','trabajo','La liquidación indica pagado; falta respaldo bancario independiente.'),16:('alem-camara','acopio','Saldo de trabajo de cámara registrado como pendiente en octubre.'),17:('alem-acopios','acopio','Acopio genérico pendiente en octubre, sin obra específica identificada.')},
}
L={
 '2025-04':{10:('lagos-canerias','fondo','A cuenta de cañerías: importe liquidado, no cobranza acreditada.')},
 '2025-05':{10:('lagos-gas','trabajo','Cuota de devolución de obra de gas.'),11:('lagos-gas','trabajo','Cuota de obra de gas según acuerdo.'),12:('lagos-canerias','fondo','Fondo operativo liquidado para cañerías.')},
 '2025-07':{10:('lagos-desagues','trabajo','Cambio de desagüe según liquidación.'),11:('lagos-desagues','trabajo','Reparación de desagüe.'),13:('lagos-gas','trabajo','Cuota de obra de gas.')},
 '2025-08':{4:('lagos-ascensores','trabajo','Reemplazo de pieza de ascensor; diferenciar del abono.'),11:('lagos-reserva','fondo','Partida genérica a cuenta de trabajos, sin saldo de reserva verificable.'),14:('lagos-gas','trabajo','Cuota de obra de gas.'),15:('lagos-gas','trabajo','Cuota de devolución de obra de gas.'),16:('lagos-gas','trabajo','Cuota de obra de gas.')},
 '2025-10':{10:('lagos-reserva','fondo','Partida genérica a cuenta de reparaciones.'),15:('lagos-gas','trabajo','Cuota final de obra de gas según liquidación.')},
 '2025-12':{3:('lagos-ascensores','anticipo','Anticipo de cambio de cables, sin comprobante bancario aportado.'),10:('lagos-reserva','fondo','Fondo de reserva a cuenta de trabajos, saldo acumulado no informado.')},
 '2026-01':{3:('lagos-ascensores','trabajo','Colocación de disyuntores en ascensores.'),4:('lagos-ascensores','anticipo','Primera cuota del cambio de cables; consta como cargo, no pago verificado.'),10:('lagos-desagues','trabajo','Desagüe subsuelo y rejillas.')},
 '2026-02':{6:('lagos-ascensores','anticipo','Segunda cuota del cambio de cables.'),7:('lagos-ascensores','trabajo','Reparación de patín.'),14:('lagos-reserva','fondo','Partida de fondo de reserva; no acredita disponibilidad bancaria.'),15:('lagos-desagues','trabajo','Soldadura de punteras de bronce; obra específica a comprobar.')},
 '2026-03':{10:('lagos-matafuegos','anticipo','A cuenta de compra de matafuegos.'),14:('lagos-reserva','fondo','Fondo de reserva liquidado, no saldo de caja.'),15:('lagos-desagues','trabajo','Cambio de llave de paso.')},
 '2026-04':{9:('lagos-ascensores','anticipo','Entrega para compra de polea.'),10:('lagos-ascensores','anticipo','Entrega para reparación de ascensor.'),11:('lagos-reserva','fondo','Devolución de fondo de reserva, se resta de las partidas de fondo.'),12:('lagos-reserva','fondo','Nueva partida de fondo de reserva.'),13:('lagos-matafuegos','ajuste','Reversión del anticipo anterior.'),14:('lagos-matafuegos','anticipo','A cuenta de compra de dos matafuegos.'),15:('lagos-matafuegos','trabajo','Compra de matafuegos y gabinetes; no equivale a pago comprobado.')},
 '2026-05':{9:('lagos-canerias','fondo','Fondo operativo a cuenta de trabajos en cañerías centrales.'),10:('lagos-matafuegos','trabajo','Compra de matafuegos, factura informada.'),11:('lagos-matafuegos','trabajo','Compra de matafuegos, factura informada.'),12:('lagos-matafuegos','ajuste','Devolución a cuenta de compra; no contar como trabajo negativo.')},
 '2026-06':{14:('lagos-canerias','fondo','Fondo operativo a cuenta de cañerías centrales.')},
 '2026-07':{3:('lagos-ascensores','trabajo','Cambio de contactor de ascensor.'),10:('lagos-canerias','fondo','Fondo operativo a cuenta de cañerías centrales.')},
}
PROJECTS={
 ALEM:[
  ('alem-camara','Cámara y trabajos asociados','Acopios y saldos informados para trabajo de cámara.'),
  ('alem-bajada','Caño de bajada','Acopios identificados para cambio de caño de bajada.'),
  ('alem-medianera','Reparación de medianera','Trabajos y saldo por reparación de medianera.'),
  ('alem-bombas','Bombas y equipos de desagote','Reparaciones, reemplazos e instalaciones específicas.'),
  ('alem-desagues','Destapes e inspecciones cloacales','Intervenciones no habituales informadas.'),
  ('alem-reparaciones','Reparaciones y filtraciones','Trabajos parcialmente agrupados con acopios o albañilería.'),
  ('alem-acopios','Acopios sin obra identificada','No se atribuyen a otra obra sin documentación.'),
  ('alem-otras','Otras reparaciones','Bocas de inspección y reparaciones edilicias puntuales.'),
 ],
 LAGOS:[
  ('lagos-canerias','Fondo operativo · cañerías centrales','Partidas liquidadas a cuenta de trabajos; no son gastos o pagos ejecutados.'),
  ('lagos-reserva','Fondo de reserva general','Partidas y devoluciones de reserva; no representan saldo disponible.'),
  ('lagos-ascensores','Ascensores · reparaciones y anticipos','Sin incluir servicios mensuales de mantenimiento.'),
  ('lagos-matafuegos','Matafuegos · anticipos, compras y ajustes','Anticipos y devoluciones por concepto; no presume conciliación final.'),
  ('lagos-desagues','Reparaciones hidráulicas y desagües','Partidas identificables, sin presumir que se financiaron con un fondo.'),
  ('lagos-gas','Obras de gas · cuotas informadas','Cuotas según acuerdos y devoluciones informadas.'),
 ]
}

KIND_NAMES={'fondo':'Partida de fondo','acopio':'Acopio liquidado','anticipo':'Anticipo/cuota liquidada','trabajo':'Trabajo/compra liquidada','mixto':'Movimiento mixto no desagregado','ajuste':'Ajuste/devolución'}

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def main():
    alem=load(Path('data/expensas-2026.json'))['months']
    lago25=load(Path('consorcios/lagos-2797/data/2025.json'))['months']
    lago26=load(Path('consorcios/lagos-2797/data/2026.json'))['months']
    events=[]
    for building,monthset,mapping in [(ALEM,alem,A),(LAGOS,lago25+lago26,L)]:
        months_by_id={m['id']:m for m in monthset}
        for month_id,selected in mapping.items():
            if month_id not in months_by_id:
                raise ValueError(f'Mes inexistente: {building}/{month_id}')
            m=months_by_id[month_id]
            for idx,(project,kind,note) in sorted(selected.items()):
                if project not in [p[0] for p in PROJECTS[building]]:
                    raise ValueError(f'Proyecto inexistente {project}')
                try:p=m['providers'][idx]
                except IndexError:raise ValueError(f'Índice {idx} fuera de providers {building}/{month_id}')
                amount=p['amount']
                if not isinstance(amount,(int,float)) or not isinstance(p.get('detail'),str):
                    raise ValueError(f'Importe/detalle inválido: {building}/{month_id}/{idx}')
                if kind=='ajuste' and amount>=0:raise ValueError(f'El ajuste debía ser negativo: {month_id}/{idx}')
                if kind=='fondo' and not ('fondo' in p['provider'].lower()):
                    raise ValueError(f'Una partida fondo no tiene proveedor fondo: {month_id}/{idx}')
                ref=(m.get('source') or {}).get('name') if building==LAGOS else (m.get('pdf') or f'{month_id}.pdf').split('/')[-1]
                if not ref:ref=f'Liquidación {month_id}'
                events.append({
                    'id':f'{building}:{month_id}:{idx}',
                    'building':building,'month':month_id,'project':project,
                    'kind':kind,'kindLabel':KIND_NAMES[kind],
                    'amount':round(float(amount),2),
                    'provider':p['provider'],'detail':p['detail'],
                    'source':ref,'page':(m.get('source') or {}).get('page') if building==LAGOS else (2 if month_id=='2026-10' else None),
                    'paymentEvidence':('Indicado como pagado en la liquidación; falta comprobante bancario' if building==ALEM and month_id=='2026-10' and idx==15 else 'Pago no verificable con la documentación disponible'),
                    'note':note,
                })
    events.sort(key=lambda e:(e['building'],e['month'],e['project'],e['id']))
    result={
      'version':'1.2.0',
      'methodology':{
        'dataType':'Cargos y ajustes publicados en liquidaciones mensuales; no son comprobantes bancarios ni saldos contables de fondos.',
        'noDoubleCount':'Las partidas de fondos y los cargos por obras se presentan en columnas separadas; no se restan entre sí para afirmar un saldo de caja o de obra.',
        'missing':'Mes sin liquidación no equivale a cero; no interpolar. El registro es una selección curada de obras y fondos, no un resumen de todos los gastos.',
        'payment':'Pago verificado = no disponible salvo documentación bancaria independiente. Una leyenda de pago en PDF no equivale a auditoría.',
        'sources':'Datos transcritos de los JSON mensuales preexistentes y cotejados con las liquidaciones aportadas.'
      },
      'buildings':{
        ALEM:{'name':'Consorcio Alem 1274','months':[m['id'] for m in alem], 'asOf':'2026-10', 'sourceKind':'Liquidaciones mensuales con estado patrimonial y cuentas por pagar.'},
        LAGOS:{'name':'Torre VI · Ovidio Lagos 2797','months':[m['id'] for m in lago25+lago26], 'asOf':'2026-07', 'sourceKind':'Liquidaciones individuales: no incluyen caja ni pasivos por obra.'},
      },
      'projects':[{'id':pid,'building':b,'name':nm,'description':desc} for b,items in PROJECTS.items() for pid,nm,desc in items],
      'entries':events,
      'pendingSnapshots':[
        {'building':ALEM,'month':'2026-10','project':'alem-camara','amount':100000,'source':'202610Expensas.pdf, p. 2','detail':'Saldo impago de acopio agosto 2026 (cámara).'},
        {'building':ALEM,'month':'2026-10','project':'alem-camara','amount':1150000,'source':'202610Expensas.pdf, p. 2','detail':'Saldo impago octubre 2026 para trabajo de cámara.'},
        {'building':ALEM,'month':'2026-10','project':'alem-acopios','amount':300000,'source':'202610Expensas.pdf, p. 2','detail':'Saldo impago octubre 2026, acopio extraordinario para reparaciones.'},
      ],
      'pendingMethod':'Sólo saldos impagos al 31/10/2026 informados en las cuentas por pagar de octubre. No acumular fotos de meses sucesivos.'
    }
    latest=next(m for m in alem if m['id']=='2026-10')
    assert round(sum(x['amount'] for x in result['pendingSnapshots']),2)==round(latest['accountsPayable'],2)
    for b in (ALEM,LAGOS):
        for m in result['buildings'][b]['months']:
            assert m in {z['id'] for z in (alem if b==ALEM else lago25+lago26)}
    out=ROOT/'data/seguimiento_fondos_v12.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Registradas',len(events),'partidas; proyectos',len(result['projects']))
    for b in (ALEM,LAGOS):
        rs=[e for e in events if e['building']==b]
        totals={k:round(sum(e['amount'] for e in rs if e['kind']==k),2) for k in KIND_NAMES}
        print(b,len(rs),totals)
    print('Foto pendiente Alem oct:',round(sum(x['amount'] for x in result['pendingSnapshots']),2))

if __name__=='__main__':main()
