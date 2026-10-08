import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {DashboardCanvas} from '@/components/dashboard-canvas';
import {VisualStateProvider,type VisualState} from '@/components/visual-state';
import {LanguageProvider,useLanguage} from './language';
import {reduceCube,type Cube} from './dashboard';
type Filter={country:string;from:string;to:string;deduplicate:boolean};
export type InteractivePayload={source:string;title:string;locale:'en'|'id';cube:Cube;filter:Filter;visuals:VisualState;kpiLabels:Record<string,string>;chartTitles:string[]};
const payload=JSON.parse(document.getElementById('dashboard-data')!.textContent!) as InteractivePayload;
function InteractiveDashboard(){
 const {locale,t}=useLanguage(),id=locale==='id';
 const [filter,setFilter]=useState(payload.filter),[visuals,setVisuals]=useState(payload.visuals);
 const result=reduceCube(payload.cube,filter),spec=payload.cube.spec;
 const countries=[...new Set(payload.cube.variants[0].rows.map(row=>row[0]).filter(Boolean))].sort(),months=[...new Set(payload.cube.variants[0].rows.map(row=>row[1]).filter(Boolean))].sort();
 function dateChange(field:'from'|'to',value:string){setFilter(previous=>{const next={...previous,[field]:value};if(next.from&&next.to&&next.from>next.to)next[field==='from'?'to':'from']=value;return next})}
 const filters=<div className="dataset-tools">{spec.countryColumn&&<label className="picker"><span>{spec.countryColumn}</span><select aria-label={spec.countryColumn} value={filter.country} onChange={e=>setFilter({...filter,country:e.target.value})}><option value="">{id?'Semua':'All'}</option>{countries.map(value=><option key={value}>{value}</option>)}</select></label>}{spec.dateColumn&&(['from','to'] as const).map(field=><label className="picker" key={field}><span>{t(field==='from'?'From':'To')}</span><select aria-label={t(field==='from'?'From':'To')} value={filter[field]} onChange={e=>dateChange(field,e.target.value)}><option value="">{id?'Semua bulan':'All months'}</option>{months.map(value=><option key={value}>{value}</option>)}</select></label>)}<button className="reset-filter" onClick={()=>setFilter({country:'',from:'',to:'',deduplicate:payload.filter.deduplicate})}>{t('Reset')}</button></div>;
 return <main className="offline-workspace"><VisualStateProvider values={visuals} setValues={setVisuals}><DashboardCanvas charts={result.charts.map((chart,index)=>({...chart,title:payload.chartTitles[index]||chart.title}))} dataset={payload.source} title={payload.title} status={t('Interactive data ready')} kpis={Object.fromEntries(Object.entries(result.kpis).map(([key,value])=>[payload.kpiLabels[key]||key,value]))} filters={filters} filterColumn={spec.countryColumn} onCategory={(_column,value)=>setFilter({...filter,country:filter.country===value?'':value})} layout={spec.layout} kpiPlacement={spec.kpiPlacement}/></VisualStateProvider></main>;
}
createRoot(document.getElementById('dashboard-root')!).render(<LanguageProvider initialLocale={payload.locale}><InteractiveDashboard/></LanguageProvider>);
