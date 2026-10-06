export const CUBE_PYTHON=String.raw`
import hashlib
_spec=json.loads(__SPEC__)
_src=pd.read_excel(config['path'], sheet_name=config['sheet'] or 0) if config['isExcel'] else pd.read_csv(config['path'], sep=None, engine='python')
_src.columns=_src.columns.map(str)
if config.get('baseDeduplicated'): _src=_src.drop_duplicates().copy()
def _series(frame,col):
    return frame[col] if col else pd.Series('',index=frame.index)
def _text(series):
    return series.fillna('').astype(str)
def _metric_frame(frame,metric):
    mask=pd.Series(True,index=frame.index)
    for rule in metric['rules']:
        x=frame[rule['column']]; op=rule['op']; val=rule.get('value','')
        if op in ['gt','ge','lt','le']:
            x=pd.to_numeric(x,errors='coerce'); val=float(val)
            if op=='gt': cond=x>val
            elif op=='ge': cond=x>=val
            elif op=='lt': cond=x<val
            else: cond=x<=val
        elif op=='eq': cond=_text(x)==str(val)
        elif op=='ne': cond=_text(x)!=str(val)
        elif op=='prefix': cond=_text(x).str.upper().str.startswith(str(val).upper())
        elif op=='notPrefix': cond=~_text(x).str.upper().str.startswith(str(val).upper())
        else: cond=x.notna() & (_text(x)!='')
        mask &= cond
    out=frame.loc[mask].copy(); op=metric['operation']
    if op=='distinct':
        ids=_text(out[metric['columns'][0]])
        out=out.loc[ids!=''].copy(); ids=ids.loc[out.index]
        hashes={x:hashlib.sha256(str(x).encode()).hexdigest()[:24] for x in ids.unique()}
        out['__value__']=ids.map(hashes)
    elif op=='count': out['__value__']=1.0
    else:
        values=pd.Series(1.0,index=out.index)
        for col in metric['columns']: values*=pd.to_numeric(out[col],errors='coerce')
        out['__value__']=values.replace([np.inf,-np.inf],np.nan)
        out=out.dropna(subset=['__value__'])
    return out

def _aggregate(frame,keys,metric):
    groups=frame.groupby(keys,dropna=False,sort=False)['__value__']
    if metric['operation']=='distinct':
        return [(list(key),[0,0,list(values)]) for key,values in groups.unique().items()]
    totals=groups.agg(['sum','count'])
    return [(list(key),[float(row['sum']),int(row['count']),[]]) for key,row in totals.iterrows()]

_variants=[]
for _dedup in [False,True]:
    frame=_src.drop_duplicates().copy() if _dedup else _src.copy()
    frame['__dash_country__']=_text(_series(frame,_spec['countryColumn']))
    frame['__dash_month__']=pd.to_datetime(_series(frame,_spec['dateColumn']),errors='coerce').dt.strftime('%Y-%m').fillna('') if _spec['dateColumn'] else pd.Series('',index=frame.index)
    base=['__dash_country__','__dash_month__']
    variant={'rows':[[c,d,int(n)] for (c,d),n in frame.groupby(base,sort=False).size().items()],'metrics':[],'charts':[]}
    for i,metric in enumerate(_spec['metrics']):
        part=_metric_frame(frame,metric)
        for key,stats in _aggregate(part,base,metric): variant['metrics'].append(key+[i,stats])
        for j,chart in enumerate(_spec['charts']):
            if chart['metric']!=metric['id']: continue
            part['__group__']=pd.to_datetime(part[chart['groupBy']],errors='coerce').dt.strftime('%Y-%m').fillna('(kosong)') if chart['time'] else _text(part[chart['groupBy']]).replace('','(kosong)')
            for key,stats in _aggregate(part,base+['__group__'],metric): variant['charts'].append(key[:2]+[j,key[2],stats])
    assert sum(row[2] for row in variant['rows']) == len(frame), 'Dashboard row count mismatch'
    _variants.append(variant)
with open('/home/user/dashboard.json','w',encoding='utf-8') as f:
    json.dump({'spec':_spec,'variants':_variants},f,ensure_ascii=False,allow_nan=False,separators=(',',':'))
assert os.path.getsize('/home/user/dashboard.json') <= 24000000, 'Dashboard terlalu besar; sederhanakan dimensi'
`;
