import type {AgentRun} from './analysis-agent';
import type {Fact} from './insight-facts';
export function agentEvidenceFacts(run:AgentRun|undefined,language:'en'|'id'='en'):Fact[]{
 const facts:Fact[]=[];const fmt=(v:number)=>new Intl.NumberFormat(language==='id'?'id-ID':'en-GB',{maximumFractionDigits:3}).format(v);
 const add=(id:string,label:string,value:unknown)=>{if(typeof value==='number'&&Number.isFinite(value))facts.push({id,text:`${label}: ${fmt(value)}.`})};
 for(const report of run?.reports||[]){if(!report.ok||report.kind!=='tool'||!report.tool)continue;const r=report.result as any;if(!r||typeof r!=='object')continue;const root='agent_'+report.id;
  if(report.tool.name==='correlation'){add(root+'_pearson',`${r.columns?.join(' / ')} — ${language==='id'?'korelasi Pearson pada pasangan lengkap':'Pearson correlation on complete pairs'}`,r.pearson);add(root+'_pairs',language==='id'?'Pasangan numerik lengkap':'Complete numeric pairs',r.pairedRows);add(root+'_excluded',language==='id'?'Baris dikecualikan dari korelasi':'Rows excluded from correlation',r.excluded);}
  if(report.tool.name==='describe')for(const [i,c] of (r.columns||[]).entries())for(const [key,en,id] of [['mean','mean','rata-rata'],['median','median','median'],['min','minimum','minimum'],['max','maximum','maksimum'],['numericCount','numeric observations','observasi numerik'],['iqrOutlierCandidates','IQR outlier candidates; not confirmed errors','kandidat pencilan IQR; belum tentu salah']])add(root+'_'+i+'_'+key,`${c.column} — ${language==='id'?id:en}`,c[key]);
  if(report.tool.name==='quality'){add(root+'_rows',language==='id'?'Pemeriksaan kualitas pada pilihan aktif — baris':'Active-selection quality check — rows',r.rows);add(root+'_duplicates',language==='id'?'Duplikat identik pada pilihan aktif':'Exact duplicates in active selection',r.duplicates);for(const [i,c] of (r.columns||[]).entries())add(root+'_missing_'+i,`${c.column} — ${language==='id'?'nilai kosong pada pilihan aktif':'missing in active selection'}`,c.missing);}
  if(report.tool.name==='aggregate')for(const [i,g] of (r.groups||[]).slice(0,10).entries())add(root+'_group_'+i,`${r.operation} ${r.measure||'rows'} / ${r.groupBy} = ${g.category}`,g.value);
 }
 return facts.slice(0,100);
}
