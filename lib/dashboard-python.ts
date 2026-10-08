export const DATASET_LOADER_PYTHON=String.raw`
import re
def _load_dataset(settings):
    frame=pd.read_excel(settings['path'],sheet_name=settings['sheet'] or 0,dtype=object,keep_default_na=False) if settings['isExcel'] else pd.read_csv(settings['path'],sep=None,engine='python',encoding='utf-8-sig',dtype=object,keep_default_na=False)
    frame.columns=frame.columns.map(str)
    for col in frame.columns:
        frame[col]=frame[col].map(lambda v: v.strip() if isinstance(v,str) else v)
        values=[v for v in frame[col] if not pd.isna(v) and v!='']
        if values and not re.search(r'(?:id|code|phone|zip|postal|invoice)$|invoice',col,re.I) and all(isinstance(v,(int,float,np.number)) and np.isfinite(v) or isinstance(v,str) and re.fullmatch(r'[+-]?(?:0|[1-9]\d*)(?:\.\d+)?',v) and np.isfinite(float(v)) for v in values):
            frame[col]=pd.to_numeric(frame[col],errors='coerce')
    return frame
`;
export const CUBE_PYTHON=DATASET_LOADER_PYTHON+String.raw`
import hashlib
_spec=json.loads(__SPEC__)
_src=_load_dataset(config)
_src.columns=_src.columns.map(str)
for _chart in _spec['charts']:
    for _axis in (['xColumn','yColumn'] if _chart.get('view')=='scatter' else ['xColumn'] if _chart.get('view') in ['histogram','boxplot'] else []):
        _raw=_src[_chart[_axis]]
        _present=_raw.notna() & (_raw.map(str)!='')
        _numeric=pd.to_numeric(_raw,errors='coerce')
        if _present.any() and not np.isfinite(_numeric).any():
            raise ValueError('Numeric chart axes require numeric source values; correct '+_axis)

if config.get('baseDeduplicated'): _src=_src.drop_duplicates().copy()
def _series(frame,col):
    return frame[col] if col else pd.Series('',index=frame.index)
def _category_text(v):
    return '' if pd.isna(v) else str(v).lower() if isinstance(v,(bool,np.bool_)) else str(int(v)) if isinstance(v,(float,np.floating)) and np.isfinite(v) and float(v).is_integer() else str(v)
def _text(series):
    return series.map(_category_text)
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
    variant={'rows':[[c,d,int(n)] for (c,d),n in frame.groupby(base,sort=False).size().items()],'metrics':[],'charts':[],'observations':[],'sampledCharts':[],'histogramLabels':{},'tableMetrics':[]}
    for i,metric in enumerate(_spec['metrics']):
        part=_metric_frame(frame,metric)
        for key,stats in _aggregate(part,base,metric): variant['metrics'].append(key+[i,stats])
        _metric_part=part
        for j,chart in enumerate(_spec['charts']):
            if chart['metric']!=metric['id'] and metric['id'] not in chart.get('tableMetrics',[]): continue
            part=_metric_part.copy()
            if chart.get('tableMetrics'):
                part['__group__']=_text(part[chart['groupBy']]).replace('','(missing)')
                for key,stats in _aggregate(part,base+['__group__'],metric): variant['tableMetrics'].append(key[:2]+[j,metric['id'],key[2],stats])
                if chart['metric']!=metric['id']: continue
            if chart.get('view') in ['scatter','boxplot']:
                part['__x__']=pd.to_numeric(part[chart['xColumn']],errors='coerce')
                part['__y__']=pd.to_numeric(part[chart['yColumn']],errors='coerce') if chart.get('view')=='scatter' else 0.0
                valid=part.replace([np.inf,-np.inf],np.nan).dropna(subset=['__x__','__y__'])
                for _,segment in valid.groupby(base,sort=False):
                    if len(segment)>1000:
                        segment=segment.sample(1000,random_state=42)
                        if j not in variant['sampledCharts']: variant['sampledCharts'].append(j)
                    for _,row in segment.iterrows():
                        variant['observations'].append([row[base[0]],row[base[1]],j,_category_text(row[chart['groupBy']]) or '(missing)',float(row['__x__']),float(row['__y__'])])
                continue
            if chart.get('view')=='histogram':
                assert metric['operation']=='count', 'Histogram requires count metric'
                source=pd.to_numeric(_src[chart['xColumn']],errors='coerce').replace([np.inf,-np.inf],np.nan).dropna()
                if source.empty: continue
                edges=np.histogram_bin_edges(source,bins=chart.get('bins',10))
                variant['histogramLabels'][str(j)]=[format(edges[k],'.8g')+' — '+format(edges[k+1],'.8g') for k in range(len(edges)-1)]
                numbers=pd.to_numeric(part[chart['xColumn']],errors='coerce').replace([np.inf,-np.inf],np.nan)
                part=part.loc[numbers.notna()].copy()
                part['__x__']=numbers.loc[part.index]
                for _,segment in part.groupby(base,sort=False):
                    if len(segment)>1000:
                        segment=segment.sample(1000,random_state=42)
                        if j not in variant['sampledCharts']: variant['sampledCharts'].append(j)
                    for _,row in segment.iterrows():
                        variant['observations'].append([row[base[0]],row[base[1]],j,_category_text(row[chart['groupBy']]) or '(missing)',float(row['__x__']),0.0])
                positions=np.clip(np.searchsorted(edges,numbers.loc[part.index],side='right')-1,0,len(edges)-2)
                part['__group__']=[format(edges[k],'.8g')+' — '+format(edges[k+1],'.8g') for k in positions]
            else:
                part['__group__']=pd.to_datetime(part[chart['groupBy']],errors='coerce').dt.strftime('%Y-%m').fillna('(kosong)') if chart['time'] else _text(part[chart['groupBy']]).replace('','(kosong)')
            for key,stats in _aggregate(part,base+['__group__'],metric): variant['charts'].append(key[:2]+[j,key[2],stats])
    assert sum(row[2] for row in variant['rows']) == len(frame), 'Dashboard row count mismatch'
    _variants.append(variant)
with open('/home/user/dashboard.json','w',encoding='utf-8') as f:
    json.dump({'spec':_spec,'variants':_variants},f,ensure_ascii=False,allow_nan=False,separators=(',',':'))
assert os.path.getsize('/home/user/dashboard.json') <= 24000000, 'Dashboard terlalu besar; sederhanakan dimensi'
`;
