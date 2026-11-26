#!/usr/bin/env python3
"""Auditoría reproducible de coherencia del dashboard (no auditoría contable externa).

Uso desde la raíz del repositorio:
  python scripts/auditar_consorcios_v13.py --build
  python scripts/auditar_consorcios_v13.py --check

El comando NO toca los JSON mensuales ni sube archivos. Sólo genera
`data/auditoria_v13.json` con resultados y rutas de procedencia.
"""
from __future__ import annotations
import argparse
import json
import hashlib
import re
import sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

DATA_SOURCES = (
    ('alem-1274', 'Consorcio Alem 1274', 'data/expensas-2026.json'),
    ('lagos-2797', 'Torre VI · Ovidio Lagos 2797', 'consorcios/lagos-2797/data/2025.json'),
    ('lagos-2797', 'Torre VI · Ovidio Lagos 2797', 'consorcios/lagos-2797/data/2026.json'),
)
PENNY = Decimal('0.01')
TOL = Decimal('0.02')
STATES = ('ok', 'warning', 'error', 'pending', 'info')


def number(v):
    if v is None or isinstance(v, bool):
        raise ValueError('valor numérico faltante o inválido')
    try:
        n = Decimal(str(v))
    except (InvalidOperation, ValueError):
        raise ValueError(f'no es un importe numérico: {v!r}') from None
    if not n.is_finite():
        raise ValueError('valor NaN o infinito')
    return n


def cents(v):
    return str(number(v).quantize(PENNY))


def money(v):
    return f'${number(v):,.2f}'


def items_sum(rows):
    if not isinstance(rows, list):
        raise ValueError('el detalle no es una lista')
    return sum((number(x['amount']) for x in rows), Decimal('0'))


def check(cid, state, title, detail, *, source=None, group='integridad', found=None, expected=None):
    if state not in STATES:
        raise ValueError(state)
    out = {'id': cid, 'state': state, 'group': group, 'title': title, 'detail': detail}
    if source:
        out['source'] = source
    if expected is not None and found is not None:
        out['expected'] = cents(expected)
        out['found'] = cents(found)
        out['difference'] = cents(number(found)-number(expected))
    return out


def equals(key, title, expected, found, origin):
    try:
        delta = number(found) - number(expected)
        state = 'ok' if abs(delta) <= TOL else 'error'
        detail = f'Esperado {money(expected)} · obtenido {money(found)} · diferencia {money(delta)}.'
        return check(key, state, title, detail, source=origin, found=found, expected=expected)
    except (ValueError, TypeError) as err:
        return check(key, 'error', title, f'No se pudo comparar: {err}', source=origin)


def audit(root: Path):
    months = []
    existing_ids = set()
    for building, name, relative in DATA_SOURCES:
        path = root/relative
        if not path.is_file():
            raise RuntimeError(f'No se puede auditar porque falta {relative}')
        dataset = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(dataset.get('months'), list):
            raise RuntimeError(f'No existe months[] en {relative}')
        for ix, m in enumerate(dataset['months']):
            ident = m.get('id', '')
            if (building, ident) in existing_ids:
                raise RuntimeError(f'Mes duplicado: {building} {ident}')
            existing_ids.add((building, ident))
            if not re.fullmatch(r'20\d\d-(0[1-9]|1[0-2])', ident):
                raise RuntimeError(f'ID de mes inválido en {relative}: {ident}')
            origin = f'{relative} → months[{ix}]'
            checks = []
            total_key = 'totalExpenses' if building=='alem-1274' else 'liquidatedTotal'
            expected_total = m.get(total_key)
            if expected_total is None:
                checks.append(check('total-source','error','Total del mes','No se informó total.',source=origin))
            else:
                try:
                    base = (number(m.get('ordinaryExpenses',0))+number(m.get('extraordinaryExpenses',0))+number(m.get('particularExpenses',0)) if building=='alem-1274' else number(m['habitualExpenses'])+number(m['nonHabitualExpenses']))
                    checks.append(equals('total-parts','Gasto total = suma de tipos',expected_total,base,origin))
                except (ValueError, KeyError) as exc:
                    checks.append(check('total-parts','error','Gasto total = suma de tipos',str(exc),source=origin))
                for key,title in [('composition','Rubros = total'),('providers','Movimientos por proveedor = total')]:
                    try:
                        checks.append(equals('sum-'+key,title,expected_total,items_sum(m.get(key,[])),origin+' → '+key))
                    except (ValueError, KeyError) as exc:
                        checks.append(check('sum-'+key,'error',title,str(exc),source=origin+' → '+key))
            debt_field = 'debtCapital' if building=='alem-1274' else 'listedDebtTotal'
            if m.get(debt_field) is not None:
                try:
                    checks.append(equals('debt','Deuda declarada = suma de unidades',m[debt_field],items_sum(m.get('debtors',[])),origin+' → debtors'))
                except (ValueError, KeyError) as exc:
                    checks.append(check('debt','error','Deuda declarada = suma de unidades',str(exc),source=origin))
            else:
                checks.append(check('debt','pending','Deuda declarada','No se informa un total para conciliar.',source=origin))
            units = [str(d.get('unit','')).strip() for d in m.get('debtors',[])]
            duplicated = sorted({u for u in units if units.count(u)>1 or not u})
            checks.append(check('units','error' if duplicated else 'ok','Unidades únicas y definidas',('Repetidas o vacías: '+', '.join(duplicated)) if duplicated else f'{len(units)} unidades sin duplicados.', source=origin+' → debtors'))
            try:
                bad = [p for p in m.get('providers',[]) if not str(p.get('provider','')).strip() or number(p['amount']) < 0 and building=='alem-1274']
                checks.append(check('providers-form','warning' if bad else 'ok','Movimientos identificados', f'{len(bad)} movimientos incompletos o importes negativos que requieren revisión.' if bad else f'{len(m.get("providers",[]))} movimientos con proveedor y monto.',source=origin+' → providers'))
            except (ValueError, KeyError) as exc:
                checks.append(check('providers-form','error','Movimientos identificados',str(exc),source=origin))
            if building=='alem-1274':
                try:
                    if m.get('netCash') is not None:
                        checks.append(equals('net-cash','Caja neta = caja final − cuentas por pagar',m['netCash'],number(m['cashFinal'])-number(m['accountsPayable']),origin))
                    else:
                        checks.append(check('net-cash','pending','Caja neta','No informada.',source=origin))
                except (ValueError, KeyError) as exc:
                    checks.append(check('net-cash','error','Caja neta',str(exc),source=origin))
            else:
                checks.append(check('cash-unavailable','info','Estado de caja no informado','La liquidación individual no permite auditar caja, pagos ni recuperos. No equivale a cero.',source=origin,group='alcance'))
            report = m.get('report')
            pdf = m.get('pdf')
            if report and (root/report).is_file():
                checks.append(check('report','ok','Informe mensual disponible','Archivo PDF localizado en el proyecto.',source=report,group='documentos'))
            else:
                checks.append(check('report','warning','Informe mensual no localizado','No hay informe disponible o la ruta es incorrecta.',source=report or origin,group='documentos'))
            if building=='alem-1274':
                if pdf and (root/pdf).is_file():
                    checks.append(check('pdf','ok','PDF publicado presente','El archivo existe. Esto no acredita que esté correctamente anonimizado.',source=pdf,group='documentos'))
                else:
                    checks.append(check('pdf','warning','PDF público ausente','Verificar su ruta y si debe permanecer privado.',source=pdf or origin,group='documentos'))
                checks.append(check('privacy','pending','Privacidad del PDF','La existencia del archivo no verifica ausencia de nombres o datos personales. Revisar antes de publicar.',source=pdf or origin,group='privacidad'))
            else:
                checks.append(check('pdf','info','Liquidación original privada','No se publica en GitHub Pages; contiene información personal. Revisión independiente pendiente.',source=origin,group='documentos'))
            checks.append(check('source-verified','pending','Contraste independiente con PDF original','Los controles aritméticos usan el JSON. Se requiere cotejar cifras y partidas con el PDF original para certificar transcripción.',source=pdf or origin,group='trazabilidad'))
            months.append({
                'building':building,'buildingName':name,'id':ident,'label':m.get('label',ident),
                'source':relative,'sourcePath':origin,'pdf':pdf if building=='alem-1274' else None,
                'report':report if report and (root/report).is_file() else None,
                'total':cents(expected_total) if expected_total is not None else None,
                'debt':cents(m[debt_field]) if m.get(debt_field) is not None else None,
                'counts':{'rubros':len(m.get('composition',[])),'movimientos':len(m.get('providers',[])),'unidades':len(units)},
                'checks':checks,
            })
    hashes = {}
    for _building, _name, relative in DATA_SOURCES:
        hashes[relative] = hashlib.sha256((root/relative).read_bytes()).hexdigest()
    funds_path = root/'data/seguimiento_fondos_v12.json'
    funds = {'included':False,'entries':0,'unreferenced':0,'pending':0}
    if funds_path.is_file():
        hashes['data/seguimiento_fondos_v12.json'] = hashlib.sha256(funds_path.read_bytes()).hexdigest()
        registry=json.loads(funds_path.read_text(encoding='utf-8'))
        funds.update(included=True,entries=len(registry.get('entries',[])),pending=len(registry.get('pendingSnapshots',[])))
        all_months={(m['building'],m['id']) for m in months}
        funds['unreferenced']=sum((e.get('building'),e.get('month')) not in all_months for e in registry.get('entries',[]))
        if funds['unreferenced']:
            for m in months:
                m['checks'].append(check('funds-index','warning','Registro de fondos','Hay movimientos del registro de fondos cuyo edificio/mes no existe en la base; revisar.',source='data/seguimiento_fondos_v12.json',group='trazabilidad'))
    months.sort(key=lambda x:(x['building'],x['id']))
    summaries = {}
    for b, title,_ in DATA_SOURCES:
        bb = [m for m in months if m['building']==b]
        states = {s:sum(1 for m in bb for c in m['checks'] if c['state']==s) for s in STATES}
        summaries[b]={'name':title,'months':len(bb),'states':states,'asOf':max((m['id'] for m in bb),default=None)}
    return {'version':'1.3.0','generatedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'method':'Controles estructurales y aritméticos sobre JSON; documentos verificados sólo por presencia. Sin auditoría externa ni certificación de importes contra PDF.',
            'tolerance':'0.02','sourcePolicy':'El cotejo con los PDFs, la confidencialidad y la conciliación bancaria requieren control adicional.',
            'funds':funds,'sourceHashes':hashes,'summaries':summaries,'months':months}


def run():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--build',action='store_true',help='Regenerar data/auditoria_v13.json')
    mode.add_argument('--check',action='store_true',help='Ejecutar controles, sin crear archivos')
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1],help='Raíz del repositorio')
    args=parser.parse_args()
    result=audit(args.root.resolve())
    errors=sum(1 for m in result['months'] for c in m['checks'] if c['state']=='error')
    warns=sum(1 for m in result['months'] for c in m['checks'] if c['state']=='warning')
    print(f'Períodos: {len(result["months"])} · Errores: {errors} · Advertencias: {warns} · Pendientes: '+str(sum(1 for m in result['months'] for c in m['checks'] if c['state']=='pending')))
    for key, group in result['summaries'].items():
        print(f'  {key}: {group["months"]} meses, {group["states"]["ok"]} controles OK, {group["states"]["warning"]} advertencias, {group["states"]["error"]} errores')
    if args.build:
        output=args.root/'data/auditoria_v13.json';output.parent.mkdir(parents=True,exist_ok=True)
        output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('Registro actualizado:',output)
    return 1 if errors else 0

if __name__=='__main__':
    try:sys.exit(run())
    except (RuntimeError,ValueError,KeyError,json.JSONDecodeError) as exc:
        print('ERROR:',exc,file=sys.stderr);sys.exit(2)
