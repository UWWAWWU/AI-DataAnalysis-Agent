export type PythonEvidence={method:string;metrics:{label:string;value:number}[];limitations:string[];rows:number};
export function validatePythonEvidence(value:unknown,rows:number):PythonEvidence {
 const r=value as PythonEvidence;
 if(!r||typeof r.method!=='string'||!r.method.trim()||r.method.length>1000||!Array.isArray(r.metrics)||!r.metrics.length||r.metrics.length>40||r.metrics.some(m=>!m||typeof m.label!=='string'||!m.label.trim()||m.label.length>300||typeof m.value!=='number'||!Number.isFinite(m.value))||!Array.isArray(r.limitations)||r.limitations.length>20||r.limitations.some(s=>typeof s!=='string'||s.length>1000))throw Error('Python result must contain a method, 1–40 finite numeric metrics with labels, and limitations.');
 return {method:r.method,metrics:r.metrics.map(m=>({label:m.label,value:m.value})),limitations:r.limitations,rows};
}
export function pythonAnalysisProgram(config:unknown,code:string){return `import pandas as pd, numpy as np, json, os
_config=json.loads(${JSON.stringify(JSON.stringify(config))})
assert 0 < os.path.getsize(_config['path']) <= 40*1024*1024, 'Invalid dataset size'
_source=pd.read_excel(_config['path'],sheet_name=_config['sheet'] or 0) if _config['isExcel'] else pd.read_csv(_config['path'],sep=None,engine='python',encoding='utf-8-sig')
_source.columns=_source.columns.map(str)
_f=_config['selection']; _spec=_config.get('dashboard') or {}
if _config.get('baseDeduplicated') or _f.get('deduplicate'): _source=_source.drop_duplicates()
if _f.get('country'):
    assert _spec.get('countryColumn'), 'Active country selection requires a country column'
    _source=_source.loc[_source[_spec['countryColumn']].fillna('').astype(str)==_f['country']]
if _f.get('from') or _f.get('to'):
    assert _spec.get('dateColumn'), 'Active date selection requires a date column'
    _months=pd.to_datetime(_source[_spec['dateColumn']],errors='coerce').dt.strftime('%Y-%m').fillna('')
    if _f.get('from'): _source=_source.loc[_months>=_f['from']]
    if _f.get('to'): _source=_source.loc[_months.loc[_source.index]<=_f['to']]
_rows=len(_source)
_scope={'df':_source.copy(deep=True),'pd':pd,'np':np}
exec(${JSON.stringify(code)},_scope)
_output=json.dumps({'rows':_rows,'result':_scope.get('result')},allow_nan=False,default=lambda v: v.item() if isinstance(v,np.generic) else str(v))
assert len(_output)<=30000, 'Python evidence is too large'
print('__AGENT_RESULT__'+_output)
`}
