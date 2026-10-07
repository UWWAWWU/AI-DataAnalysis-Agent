'use client';
import {aiContextReplacer} from '@/lib/ai-summary';
import {DataChart} from '@/components/data-chart';
import {reportFilename,exportPDF} from '@/lib/report-export';
import {withModelFailover,type ModelOption} from '@/lib/model-failover';
import { useLanguage } from '@/lib/language';
import {useLocalizedContent} from '@/hooks/use-localized-content';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { insightFacts } from '@/lib/insight-facts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Upload, Settings, Download, ChartNoAxesCombined, MessageSquare, Database, Loader2, ShieldCheck, FileSpreadsheet, Code2, Check, ArrowRight, Play, RefreshCw, Sparkles, ArrowUpRight, Layers, Wallet, ShoppingBag, Activity, SlidersHorizontal,TableProperties } from 'lucide-react';
import type { Chart, Result, Profile } from '@/lib/analysis';
import { validatePlan, type AnalysisPlan } from '@/lib/python-contract';
const fmt = (n: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(n);
type Filter = {
    country: string;
    from: string;
    to: string;
    deduplicate: boolean;
};
type Stage = 'empty' | 'profiling' | 'planning' | 'ready' | 'executing' | 'insight' | 'complete' | 'error';
type PythonResult = Result & {
    cleaning_log: string[];
};
const INITIAL: Filter = { country: '', from: '', to: '', deduplicate: false };
function Picker({ label, value, onChange, values, all, disabled }: {
    label: string;
    value: string;
    onChange: (s: string) => void;
    values: string[];
    all?: string;
    disabled?: boolean;
}) { const { t,locale } = useLanguage(); return <label className="picker"><span>{label}</span><Select value={value || '__all__'} onValueChange={v => onChange(v === '__all__' ? '' : v)} disabled={disabled}><SelectTrigger aria-label={label}><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{all && <SelectItem value="__all__">{all}</SelectItem>}{values.map(v => <SelectItem key={v} value={v}>{monthLabel(v,locale)}</SelectItem>)}</SelectContent></Select></label>; }
function Markdown({ text }: {
    text: string;
}) { const { t } = useLanguage(); return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{text}</ReactMarkdown></div>; }
const compact = (n: number) => new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const monthLabel = (v: string,locale:'en'|'id'='en') => /^\d{4}-\d{2}$/.test(v) ? new Date(Number(v.slice(0, 4)), Number(v.slice(5)) - 1, 1).toLocaleDateString(locale==='id'?'id-ID':'en-GB', { month: 'short', year: 'numeric' }) : v;
export default function Analyst() {
    const { locale, setLocale, t } = useLanguage();
 const [chatUpdating,setChatUpdating]=useState(false),[chatReplyLanguage,setChatReplyLanguage]=useState<'en'|'id'>('en');
 const [exportOpen,setExportOpen]=useState(false),[exportBusy,setExportBusy]=useState(false);
 const [reviewData,setReviewData]=useState<any>(null),[reviewBusy,setReviewBusy]=useState(false);const baseDeduplicated=useRef(false);const requestLanguage=useRef<'en'|'id'|null>(null);
    const [unavailableProviders,setUnavailableProviders]=useState<string[]>([]);
    const [modelOptions, setModelOptions] = useState<{
        id: string;
        label: string;
    }[]>([]), [modelsLoading, setModelsLoading] = useState(true);
    const [brief, setBrief] = useState<{
        text: string;
        scope: string;
    } | null>(null), [chatOpen, setChatOpen] = useState(false), [filterBusy, setFilterBusy] = useState(false), [profile, setProfile] = useState<Profile | null>(null), [filter, setFilter] = useState<Filter>(INITIAL), [result, setResult] = useState<PythonResult | null>(null), [localResult, setLocalResult] = useState<Result | null>(null), [source, setSource] = useState(''), [sheets, setSheets] = useState<string[]>([]), [sheet, setSheet] = useState(''), [goal, setGoal] = useState(''), [plan, setPlan] = useState<AnalysisPlan | null>(null), [stage, setStage] = useState<Stage>('empty'), [status, setStatus] = useState(''), [error, setError] = useState(''), [tab, setTab] = useState('dashboard'), [apiKey, setKey] = useState(''), [e2bKey, setE2bKey] = useState(''), [model, setModel] = useState('gemini-3.8-flash'), [configured, setConfigured] = useState(false), [sandboxConfigured, setSandboxConfigured] = useState(false), [messages, setMessages] = useState<{
        role: string;
        text: string;
    }[]>([]), [question, setQuestion] = useState(''), [clarification, setClarification] = useState(''), [chatBusy, setChatBusy] = useState(false), [pendingInsight, setPendingInsight] = useState(false), [engine, setEngine] = useState(''), [repairCount, setRepairCount] = useState(0);
    const dynamicTexts=[plan?.title,plan?.objective,...(plan?.steps||[]),...(plan?.questions||[]),...(plan?.assumptions||[]),...Object.keys(result?.kpis||{}),...(result?.charts.map(c=>c.title)||[]),...(result?.definitions||[]),...(result?.cleaning_log||[]),...Object.keys(localResult?.kpis||{}),brief?.text,...messages.map(m=>m.text),error,status].filter((x):x is string=>typeof x==='string'&&Boolean(x));
    const localization=useLocalizedContent(dynamicTexts,locale,model,profile?.columns.map(c=>c.name)||[]),lt=localization.translate;
    const localizedResult=result?{...result,kpis:Object.fromEntries(Object.entries(result.kpis).map(([label,value])=>[lt(label),value])),charts:result.charts.map(c=>({...c,title:lt(c.title)})),definitions:result.definitions.map(lt),cleaning_log:result.cleaning_log.map(lt)}:null;
    const messagesNode=useRef<HTMLDivElement|null>(null);
    const attachMessages=useCallback((node:HTMLDivElement|null)=>{messagesNode.current=node;if(node)requestAnimationFrame(()=>{if(messagesNode.current===node)node.scrollTop=node.scrollHeight})},[]);
    useEffect(()=>{if(!chatOpen)return;const frame=requestAnimationFrame(()=>{const node=messagesNode.current;if(node)node.scrollTop=node.scrollHeight});return()=>cancelAnimationFrame(frame)},[chatOpen,messages,chatBusy,chatUpdating,localization.revision]);
    const modelCatalog=useRef<ModelOption[]>([]),activeModel=useRef(model);useEffect(()=>{activeModel.current=model},[model]);
    const worker = useRef<Worker | null>(null), pending = useRef(new Map<number, {
        resolve: (x: any) => void;
        reject: (e: Error) => void;
    }>()), counter = useRef(0), file = useRef<File | null>(null), fileInput = useRef<HTMLInputElement | null>(null), localRef = useRef<Result | null>(null), sheetRef = useRef('');
    const cubeReady = useRef(false), filterRequest = useRef(0);
    const busy = reviewBusy || filterBusy || ['profiling', 'planning', 'executing', 'insight'].includes(stage) || chatBusy;
    useEffect(() => { const w = new Worker('/data-worker.js'); worker.current = w; w.onmessage = e => { let p = pending.current.get(e.data.requestId); if (p) {
        e.data.error ? p.reject(Error(e.data.error)) : p.resolve(e.data.result);
        pending.current.delete(e.data.requestId);
    } }; w.onerror = () => { pending.current.forEach(p => p.reject(Error('Could not process this file. Try a smaller dataset.'))); pending.current.clear(); }; Promise.all([fetch('/api/ai').then(r => r.json()), fetch('/api/python').then(r => r.json())]).then(([a, b]: any[]) => { setConfigured(Boolean(a.configured)); setSandboxConfigured(Boolean(b.configured)); }).catch(() => { }); fetch('/api/models').then(readResponse).then(data => { setUnavailableProviders(data.unavailable||[]);if (data.models?.length)
        {modelCatalog.current=data.models;setModelOptions(data.models);activeModel.current=data.defaultModel||data.models[0].id;setModel(activeModel.current);} }).catch(() => { }).finally(() => setModelsLoading(false)); return () => w.terminate(); }, []);
    async function readResponse(response: Response) { const raw = await response.text(); try {
        return JSON.parse(raw);
    }
    catch {
        throw Error(response.status === 401 || response.status === 403 ? 'Your session has expired. Refresh the page and sign in again.' : 'The server could not complete the analysis. Please retry.');
    } }
    function call(action: string, args: Record<string, unknown> = {}) { return new Promise<any>((resolve, reject) => { if (!worker.current)
        return reject(Error('The data processor is not ready yet.')); const requestId = ++counter.current; pending.current.set(requestId, { resolve, reject }); worker.current.postMessage({ requestId, action, ...args }); }); }
    function summary(p = profile, f = filter, r: Result | null = result) { return { source: file.current?.name || source, profile: p ? { rows: p.rows, duplicates: p.duplicates, columns: p.columns } : null, filter: f, result: r, cleaning: (r as PythonResult|null)?.cleaning_log || [] }; }
    async function refreshModels(){setModelsLoading(true);try{const response=await fetch('/api/models',{signal:AbortSignal.timeout(18000)});const data=await readResponse(response);setUnavailableProviders(data.unavailable||[]);if(response.ok&&data.models?.length){modelCatalog.current=data.models;setModelOptions(data.models);if(!data.models.some((m:any)=>m.id===activeModel.current)){activeModel.current=data.defaultModel||data.models[0].id;setModel(activeModel.current);}}}catch{}finally{setModelsLoading(false)}}
    async function ai(mode: string, q: string, p = profile, f = filter, r: Result | null = result, previous?: AnalysisPlan, executionError?: unknown) {
        const response=await withModelFailover(activeModel.current,modelCatalog.current,async candidate=>{
            let resultResponse:Response;try{resultResponse=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(70000),body:JSON.stringify({mode,question:q,summary:{...summary(p,f,r),previousDashboard:previous?.dashboard||(mode==='chat'||mode==='repair'?plan?.dashboard:undefined),conversation:mode==='chat'?messages.slice(-6):[],reviewContext:reviewData?{operation:reviewData.operation,pending:reviewData.pending,scope:reviewData.scope,removedRows:reviewData.removedRows,columns:reviewData.columns}:null},toolResult:r,apiKey,model:candidate,language:requestLanguage.current||locale,previousCode:previous?.code,executionError},aiContextReplacer)});}catch(e){const failure=new Error('The AI request could not finish.') as Error&{code:string};failure.code=e instanceof Error&&['TimeoutError','AbortError'].includes(e.name)?'AI_TIMEOUT':'AI_CONNECTION';throw failure;}
            let j:any;try{j=await readResponse(resultResponse);}catch{throw Object.assign(new Error('The server returned an invalid AI response.'),{code:'AI_JSON'});}if(!resultResponse.ok){const failure=new Error(j.error) as Error&{code:string};failure.code=j.code||'AI_REQUEST';throw failure;}return j;
        },(candidate,index,previous)=>{const label=(id:string)=>modelCatalog.current.find(m=>m.id===id)?.label||id;const reason=previous?.code==='AI_HTTP_503'?t('Service busy'):previous?.code==='AI_HTTP_429'?t('Quota or rate limit reached'):previous?.code==='AI_TIMEOUT'?t('Request timed out'):t('Request failed');setStatus(`${previous?`${label(previous.model)}: ${reason}. `:''}${t('Trying model')} ${label(candidate)} (${index+1}/${modelCatalog.current.length||1}).`);});
        activeModel.current=response.model;setModel(response.model);const value=response.value;if(value.answer)localization.remember([value.answer],value.language||locale);if(value.plan&&['explore','repair'].includes(mode)){const p=value.plan;localization.remember([p.title,p.objective,...(p.steps||[]),...(p.assumptions||[]),...(p.questions||[]),...(p.dashboard?.kpis?.map((x:any)=>x.label)||[]),...(p.dashboard?.charts?.map((x:any)=>x.title)||[])],value.language||locale)}return value;
    }
    async function load(f: File, selected = '') { if (busy)
        return; if (f.size > 40 * 1024 * 1024) {
        setError('Choose a file up to 40 MB.');
        return;
    } if (!/\.(csv|xlsx)$/i.test(f.name)) {
        setError('Choose a CSV or XLSX file.');
        return;
    } window.scrollTo({top:0,behavior:'smooth'});setReviewData(null);baseDeduplicated.current=false;setStage('profiling'); setStatus('Checking columns, missing values and duplicate rows.'); setError(''); setResult(null); setPlan(null); setMessages([]); setBrief(null); setPendingInsight(false); setEngine(''); setRepairCount(0); try {
        const r = await call('load', { buffer: await f.arrayBuffer(), sheet: selected });
        file.current = f;
        setProfile(r.profile);
        setSheets(r.sheets);
        setSheet(selected || r.sheets[0]);
        sheetRef.current = selected || r.sheets[0] || '';
        setSource(f.name);
        setLocalResult(r.result);
        localRef.current = r.result;
        const nf = { ...INITIAL };
        setFilter(nf);
        cubeReady.current = false;
        setTab('dashboard');
        setGoal('');setStage('planning');setStatus('Checking available AI models.');await refreshModels(); await prepare(r.profile, nf, r.result, '', '');
    }
    catch (e) {
        setError((e as Error).message);
        setStage('error');
    } }
    async function prepare(p = profile, f = filter, local = localRef.current, answer = '', objective = goal):Promise<boolean|null> { if (!p)
        return false; setStage('planning'); setStatus('Identifying the metrics and patterns that matter.'); setError(''); setPendingInsight(false); try {
        const r = await ai('explore', `Build an automatic exploration for this dataset. User objective: ${objective || 'Identify key patterns, data quality and supported metrics.'}. User clarification: ${answer || 'none'}. Data treatment: deduplicate=${f.deduplicate}.`, p, f, null, answer.startsWith('Requested change:')?plan||undefined:undefined);
        const next = validatePlan(r.plan);
        setPlan(next);
        if (next.questions.length)
            setChatOpen(true);
        setStage('ready');
        setStatus(next.questions.length ? 'A definition needs clarification. Open the AI assistant to continue.' : 'Your analysis is ready to run.');
        if(next.questions.length)return null;
        return await execute(next,p,f);
    }
    catch (e) {
        setError((e as Error).message);
        setStage('error');
        setStatus('The dataset is loaded. Analysis planning could not finish.');return false;
    } }
    async function execute(current = plan, p = profile, f = filter, attempt = 0):Promise<boolean> { if (!current || !p || !file.current)
        return false; if (!sandboxConfigured && !e2bKey) {
        setError('The analysis service is not configured.');
        return false;
    } setStage('executing'); setStatus(attempt ? 'Running the corrected analysis.' : 'Preparing your dashboard and its interactive data.'); setError(''); try {
        const uploadSession = await readResponse(await fetch('/api/python/upload', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.current.name,size:file.current.size})}));
        const uploadForm=new FormData();uploadForm.append('file',file.current);
        let response:Response;let r:any;
        try {
            const uploaded=await fetch(uploadSession.uploadUrl,{method:'POST',body:uploadForm});
            if(!uploaded.ok)throw Error('Could not transfer the dataset. Please retry.');
            response=await fetch('/api/python',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:uploadSession.ticket,dashboard:current.dashboard,sheet:sheetRef.current,baseDeduplicated:baseDeduplicated.current})});
            r=await readResponse(response);
            if(response.ok){const downloaded=await fetch(r.cubeUrl);r.cube=await readResponse(downloaded);r.result=await call('cube',{cube:r.cube,filter:f});}
        } finally {
            void fetch('/api/python',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:uploadSession.ticket})}).catch(()=>{});
        }
        if (!response.ok) {
            if (response.status === 422 && attempt === 0 && r.executionError) {
                setStatus('The AI is correcting an analysis issue.');
                setRepairCount(1);
                const fix = validatePlan((await ai('repair', 'Repair the dashboard specification without changing its objective or definitions.', p, f, localRef.current, current, r.executionError)).plan);
                setPlan(fix);
                return await execute(fix, p, f, 1);
            }
            throw Error(r.error);
        }
        setProfile({ ...p, countries: [...new Set(r.cube.variants[0].rows.map((x: any) => String(x[0])).filter(Boolean))].sort() as string[], months: [...new Set(r.cube.variants[0].rows.map((x: any) => String(x[1])).filter(Boolean))].sort() as string[] });
        cubeReady.current = true;
        setResult(r.result);
        setEngine('Interactive data ready');
        setTab('dashboard');
        setStage('insight');
        setStatus('Your dashboard is ready. Writing the analysis brief.');
        setPendingInsight(true);
        try {
            const insight = await ai('insight', 'Write an executive analysis brief using only verified facts and the active selection.', p, f, r.result);
            setMessages(m => [...m, { role: 'AI', text: insight.answer }]);
            setBrief({ text: insight.answer, scope: JSON.stringify(f) });
            setPendingInsight(false);
        }
        catch (e) {
            setMessages(m => [...m, { role: 'Status', text: (e as Error).message }]);
        }
        setStage('complete');
        setStatus('Analysis complete. Explore your data.');return true;
    }
    catch (e) {
        setError((e as Error).message);
        setStage('error');
        setStatus('The analysis could not finish. Please try again.');return false;
    } }
    async function apply(f: Filter) { if (busy)
        return; if (f.from && f.to && f.from > f.to) {
        setError('The start month must come before the end month.');
        return;
    } if (!cubeReady.current) {
        setError('Wait for the dashboard to finish preparing.');
        return;
    } const request = ++filterRequest.current; setFilterBusy(true); setError(''); try {
        const r = await call('filterDashboard', { filter: f });
        if (request !== filterRequest.current)
            return;
        setFilter(f);
        setResult({ ...r, definitions: result?.definitions || r.definitions });
        setPendingInsight(false);
        setStatus('Dashboard updated to match your selection.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setFilterBusy(false);
    } }
    async function reviewPage(page:number){setReviewBusy(true);try{setReviewData(await call('reviewPage',{page}))}catch(e){setError((e as Error).message)}finally{setReviewBusy(false)}}
    async function discardReview(){setReviewBusy(true);try{await call('reviewDiscard');setReviewData(null)}catch(e){setError((e as Error).message)}finally{setReviewBusy(false)}}
    async function applyReview(){if((!reviewData?.pending&&!reviewData?.canApplyDuplicates)||busy||!profile)return;setReviewBusy(true);setError('');try{const ready=reviewData.canApplyDuplicates?await call('reviewStageDuplicates'):reviewData;setReviewData(ready);if(ready.dedupOnly&&cubeReady.current){const nextFilter={...filter,deduplicate:true};const applied=await call('reviewApplyDedup',{filter:nextFilter});baseDeduplicated.current=true;setProfile(applied.profile);setResult(applied.result);setFilter(nextFilter);setReviewData(null);setBrief(null);setTab('dashboard');setStatus('Changes applied to the dashboard.');return;}const prepared=await call('reviewPrepare');const previousFile=file.current,previousSheet=sheetRef.current,previousBase=baseDeduplicated.current;file.current=new File(['\ufeff'+prepared.csv],'reviewed-data.csv',{type:'text/csv'});sheetRef.current='';baseDeduplicated.current=false;let success=false;try{success=await execute(plan,prepared.profile,filter)}finally{if(!success){file.current=previousFile;sheetRef.current=previousSheet;baseDeduplicated.current=previousBase}}if(success){await call('reviewCommit');setReviewData(null);setBrief(null);setSheet('');setSheets([]);setStatus('Changes applied to the dashboard.')}}catch(e){setError((e as Error).message)}finally{setReviewBusy(false)}}
    async function ask() { if (!question.trim() || busy)
        return; const q = question; localization.remember([q],locale); setQuestion(''); setChatBusy(true); setMessages(m => [...m, { role: 'You', text: q }]); try {
        const r = await ai('chat', q);
        if(r.action!=='presentation'&&r.action!=='update')setMessages(m => [...m, { role: 'AI', text: r.answer }]);
        const responseLanguage=locale;setChatReplyLanguage(responseLanguage);
        if(r.action==='presentation'){const updated=await call('presentation',{patches:r.chartChanges,filter});setResult(updated.result);setTab('dashboard');if(r.chartChanges?.some((x:any)=>x.limit!==undefined))setBrief(null);setPlan(current=>current?{...current,dashboard:updated.spec}:current);const confirmation=responseLanguage==='id'?'Tampilan grafik yang diminta sudah diperbarui. KPI dan perhitungan lainnya tetap sama.':'The requested chart presentation has been updated. KPI values and other calculations are unchanged.';localization.remember([confirmation],responseLanguage);setMessages(m=>[...m,{role:'AI',text:confirmation}]);}
        else if(r.action==='review'){const view=await call('review',{plan:r.review,filter});setReviewData(view);setTab('review');setChatOpen(false);setMessages(m=>[...m,{role:'AI',text:responseLanguage==='id'?`Hasil review tersedia: ${fmt(view.matchingRows)} baris ditampilkan. ${fmt(view.removedRows)} baris disiapkan untuk dihapus. Dashboard belum berubah.`:`Review ready: ${fmt(view.matchingRows)} matching rows. ${fmt(view.removedRows)} rows staged for removal. The dashboard is unchanged.`}]);}
        else if (r.action === 'update') {
            setChatUpdating(true);
            setGoal(q);
            setPendingInsight(false);
            requestLanguage.current=responseLanguage;try{const completed=await prepare(profile, filter, localRef.current, 'Requested change: ' + q);if(completed===true){const confirmation=responseLanguage==='id'?'Dashboard berhasil diperbarui sesuai permintaan Anda.':'The dashboard has been updated to match your request.';localization.remember([confirmation],responseLanguage);setMessages(m=>[...m,{role:'AI',text:confirmation}]);}else if(completed===false){setPlan(plan);setMessages(m=>[...m,{role:'Status',text:responseLanguage==='id'?'Dashboard gagal diperbarui. Silakan coba kembali.':'The dashboard could not be updated. Please try again.'}]);}}finally{requestLanguage.current=null;setChatUpdating(false);}
        }
    }
    catch (e) {
        setMessages(m => [...m, { role: 'Status', text: (e as Error).message }]);
    }
    finally {
        setChatBusy(false);
    } }
    async function retryInsight() { if (!result || busy)
        return; setChatBusy(true);setMessages(m=>m.filter(x=>x.role!=='Status')); try {
        const r = await ai('insight', 'Explain the current selection, data treatment and limitations.');
        setMessages(m => [...m, { role: 'AI', text: r.answer }]);
        setBrief({ text: r.answer, scope: JSON.stringify(filter) });
        setPendingInsight(false);
    }
    catch (e) {
        setMessages(m => [...m, { role: 'Status', text: (e as Error).message }]);
    }
    finally {
        setChatBusy(false);
    } }
    function download(text: string, name: string, type: string) { const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
    async function exportCSV() { try {
        const csv = await call('export', { filter });
        download('\ufeff' + csv, 'selected-data.csv', 'text/csv');
    }
    catch (e) {
        setError((e as Error).message);
    } }
    async function exportReport(format:'json'|'csv'|'pdf'){setExportBusy(true);setError('');try{const name=reportFilename(source,format);if(format==='json')download(JSON.stringify({summary:summary(),plan,engine,repairCount,chat:messages},null,2),name,'application/json');else if(format==='csv'){const csv=await call('exportClean');download('\ufeff'+csv,name,'text/csv');}else{if(!result)throw Error(t('Wait for the dashboard to finish preparing.'));await exportPDF({source,title:plan?.title?lt(plan.title):t('Dataset overview'),result:localizedResult!,filter,insight:brief?.scope===JSON.stringify(filter)?lt(brief.text):insightFacts(profile,localizedResult,locale).map(f=>f.text).join('\n'),locale},name);}setExportOpen(false);}catch(e){setError((e as Error).message)}finally{setExportBusy(false)}}
    useEffect(() => { const context = (document as unknown as {
        modelContext?: {
            registerTool: (t: unknown, o: unknown) => Promise<void> | void;
        };
    }).modelContext; if (!context)
        return; const life = new AbortController(); Promise.resolve(context.registerTool({ name: 'read_analysis_summary', description: 'Baca profil, rencana, filter dan hasil yang tampil. Tidak mengirim data keluar.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: (input: unknown) => { if (!input || typeof input !== 'object' || Object.keys(input).length)
            throw Error('Input harus objek kosong.'); return { ...summary(), plan: plan ? { title: plan.title, steps: plan.steps } : null, stage, engine }; } }, { signal: life.signal })).catch(() => { }); return () => life.abort(); }, [profile, filter, result, plan, stage, engine]);
    const phase = stage==='error' ? (plan?2:profile?1:0) : stage === 'empty' ? 0 : stage === 'profiling' ? 0 : stage === 'planning' ? 1 : stage === 'ready' ? 1 : stage === 'executing' ? 2 : 3;
    return <main className={'workspace'+(!profile?' upload-workspace':'')+(!result&&stage!=='empty'&&stage!=='complete'?' preparing-workspace':'')}><aside className="workspace-rail"><button aria-label={t("Dashboard")} title={t("Dashboard")} className={tab === 'dashboard' ? 'rail-active' : ''} onClick={() => setTab('dashboard')}><ChartNoAxesCombined size={20}/></button><button aria-label={t("Data details")} title={t("Data details")} className={tab === 'quality' ? 'rail-active' : ''} disabled={!profile} onClick={() => setTab('quality')}><Layers size={20}/></button><button aria-label={t("Data review")} title={t("Data review")} className={tab==='review'?'rail-active':''} disabled={!profile} onClick={()=>setTab('review')}><TableProperties size={20}/>{reviewData?.pending&&<span className="draft-dot"/>}</button><div className="rail-bottom"><Dialog><DialogTrigger asChild><button className="rail-settings" aria-label={t("Settings")} title={t("Settings")}><Settings size={20}/></button></DialogTrigger><DialogContent className="settings-dialog"><DialogHeader><DialogTitle>{t("Settings")}</DialogTitle></DialogHeader><label>{t("Model")}<Select value={model} onValueChange={setModel} disabled={busy||modelsLoading}><SelectTrigger aria-label={t("Model")}><SelectValue /></SelectTrigger><SelectContent className="model-options" position="popper" align="start">{modelOptions.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent></Select>{modelsLoading && <span className="muted small">{t("Loading models\u2026")}</span>}</label>{model.startsWith('relink:')&&<p className="muted small">{t('Models listed by the provider may require additional account access.')}</p>}{unavailableProviders.length>0&&<p className="muted small">{unavailableProviders.join(', ')}: {t("Model options are temporarily unavailable.")}</p>}<label>{t("Language")}<Select value={locale} onValueChange={v => setLocale(v as 'en' | 'id')}><SelectTrigger aria-label={t("Language")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="id">Bahasa Indonesia</SelectItem></SelectContent></Select></label><p className="muted small">{t("Choose your preferred interface and response language.")}</p></DialogContent></Dialog><img className="rail-brand" src="/logo-round.svg" alt="AI Data Analysis Agent"/></div></aside><header className="app-header"><div className="brand"><img className="brand-mark" src="/favicon.svg?v=cream" alt=""/><div><strong>AI Data Analysis Agent</strong><span>{t("INTELLIGENCE WORKSPACE")}</span></div></div><div className="header-actions"><span className="private-label"><ShieldCheck size={14}/>{t("Workspace")}</span></div></header>
 <div className="title-row"><div><p className="eyebrow">{profile ? t("WORKSPACE / OVERVIEW") : t("THE ANALYSIS WORKSPACE")}</p><h1>{profile ? (plan?.title ? lt(plan.title) : t("Dataset overview")) : t("From raw data to a clearer picture.")}</h1><p className="muted">{profile ? `${source} · ${fmt(profile.rows)} ${t('rows')} · ${profile.columns.length} ${t('columns')}` : t("Upload your dataset. Get the metrics, patterns and context you need to move forward.")}</p></div>{profile && <div className="actions"><Dialog open={exportOpen} onOpenChange={setExportOpen}><DialogTrigger asChild><Button variant="outline" disabled={busy||exportBusy||localization.loading}><Download size={16}/>{t("Export report")}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t("Export report")}</DialogTitle></DialogHeader><p className="muted">{t("Choose a report format.")}</p><div className="export-options">{(['json','csv','pdf'] as const).map(format=><Button key={format} variant="outline" disabled={exportBusy} onClick={()=>void exportReport(format)}>{exportBusy?<Loader2 size={16} className="animate-spin"/>:<Download size={16}/>}<span><strong>{format.toUpperCase()}</strong><small>{t(format==='json'?'Analysis and dashboard configuration':format==='csv'?'Entire dataset with applied cleaning':'KPI, charts, insights and active filters')}</small></span></Button>)}</div></DialogContent></Dialog><Button disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={16}/>{t("New dataset")}</Button></div>}</div>
 <input ref={fileInput} type="file" accept=".csv,.xlsx" hidden onChange={e => { const f = e.target.files?.[0]; if (f)
        void load(f); }}/>
 {!profile && <section className="upload-layout"><div className="upload-main"><div className="dropzone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy && e.dataTransfer.files[0])
        void load(e.dataTransfer.files[0]); }}><div className="file-symbol"><FileSpreadsheet size={30}/></div><h2>{t("Drop your dataset here")}</h2><p className="muted">{t("CSV or XLSX \u00B7 up to 40 MB")}</p><Button disabled={busy} onClick={() => fileInput.current?.click()}><Upload size={16}/>{t("Browse files")}</Button></div><p className="upload-note">{t("Your file is processed in an isolated workspace. AI receives aggregate summaries, not raw rows. Filters run locally after preparation.")}</p></div><aside className="upload-side"><p className="eyebrow">{t("LESS WORK. MORE CLARITY.")}</p>{[['01', t("Understand the data"), t("Structure, completeness and duplicate checks.")], ['02', t("Find the right questions"), t("AI chooses meaningful metrics for your dataset.")], ['03', t("Calculate with confidence"), t("Python computes the results in an isolated workspace.")], ['04', t("Explore the bigger picture"), t("Instant filters, clear charts and an AI conversation.")]].map(([n, t, d]) => <div className="journey" key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></div>)}<div className="runtime-notice"><Code2 size={18}/><p>{sandboxConfigured ? t("Your analysis workspace is connected.") : t("The analysis service is not configured.")}</p></div></aside></section>}
 {localization.loading&&<div className="language-status" role="status"><Loader2 size={14} className="animate-spin"/>{t('Updating the language…')}</div>}
 {localization.error&&<div className="error" role="alert">{t(localization.error)}<Button variant="outline" onClick={localization.retry}>{t('Retry translation')}</Button></div>}
 {error && <div className="error" role="alert">{lt(error)}{stage === 'error' && profile && <Button variant="outline" onClick={() => void (plan?execute():prepare())} disabled={busy}><RefreshCw size={14}/>{t("Retry analysis")}</Button>}</div>}
 {stage !== 'empty' && stage !== 'complete' && <div className="pipeline" role="status"><div className="phase-row">{[t("Read data"), t("Analyze"), t("Build dashboard"), t("Ready")].map((s, i) => <span className={i < phase ? 'done' : i === phase ? (stage==='error'?'failed':'active') : ''} key={s}>{i < phase ? <Check size={14}/> : <b>{i + 1}</b>}{s}</span>)}</div><p aria-live="polite">{busy && <Loader2 size={16} className="animate-spin"/>}{lt(status)}</p></div>}
 {profile && <>{tab==='dashboard'&&<div className="dataset-tools"><div className="filter-heading"><SlidersHorizontal size={16}/><span>{t("Explore by")}</span></div>{sheets.length > 1 && <Picker label={t("Sheet")} value={sheet} values={sheets} disabled={busy} onChange={s => file.current && void load(file.current, s)}/>} {Boolean(plan?.dashboard.countryColumn) && profile.countries.length > 0 && <Picker label={plan?.dashboard.countryColumn||t("Category")} value={filter.country} values={profile.countries} all={t("All categories")} disabled={busy} onChange={v => void apply({ ...filter, country: v })}/>} {Boolean(plan?.dashboard.dateColumn) && profile.months.length > 0 && <><Picker label={t("From")} value={filter.from} values={profile.months} disabled={busy} onChange={v => void apply({ ...filter, from: v })}/><Picker label={t("To")} value={filter.to} values={profile.months} disabled={busy} onChange={v => void apply({ ...filter, to: v })}/></>}<label className="inline-toggle"><Switch aria-label={t("Remove exact duplicates")} checked={filter.deduplicate} disabled={busy} onCheckedChange={v => void apply({ ...filter, deduplicate: v })}/><span>{t("Remove exact duplicates")}</span></label><Button className="reset-filter" variant="ghost" disabled={busy} onClick={() => void apply({ ...INITIAL, from: profile.months[0] || '', to: profile.months.at(-1) || '' })}><RefreshCw size={13}/>{t("Reset")}</Button></div>}<Tabs value={tab} onValueChange={setTab}>
 <TabsContent value="dashboard">{result ? <><div className="adaptive-dashboard"><div className="result-meta"><span className="tag">{t(engine)}</span><span>{fmt(result.rows)}{' '}{t("rows in selection")}</span></div><div className={'metric-grid '+(plan?.dashboard.layout==='charts-first'?'after-charts':'')} style={{gridTemplateColumns:`repeat(${Math.min(4,Object.keys(result.kpis).length)||1},minmax(0,1fr))`}}>{Object.entries(result.kpis).map(([name, v], i) => <section className="metric" key={name}><div className="metric-heading"><span>{lt(name)}</span>{i % 4 === 0 ? <Activity size={17}/> : i % 4 === 1 ? <Layers size={17}/> : i % 4 === 2 ? <Activity size={17}/> : <Layers size={17}/>}</div><strong>{fmt(v)}{/percent|rate|%/i.test(name) && <small>%</small>}</strong><div className="metric-foot"><span className="metric-dot"/>{t("Current selection")}</div></section>)}</div><div className="chart-grid">{result.charts.map((c, i) => <DataChart chart={{...c,title:lt(c.title)}} index={i} key={JSON.stringify([c.title,c.view,c.displayView])}/>)}</div></div><section className="panel insight-summary"><div className="panel-heading"><div><span className="section-number">{t("THE BIGGER PICTURE")}</span><h2><Sparkles size={18}/>{t("Analysis brief")}</h2></div><Button variant="ghost" onClick={() => setChatOpen(true)}>{t("Ask a follow-up")}<ArrowUpRight size={15}/></Button></div>{pendingInsight&&!busy&&<div className="summary-status"><p>{t('Dashboard ready. The AI summary is unavailable; your calculations are unaffected.')}</p><Button variant="outline" disabled={busy} onClick={()=>void retryInsight()}>{t('Retry AI summary')}</Button></div>}{brief && brief.scope === JSON.stringify(filter) ? <Markdown text={lt(brief.text)}/> : <><p className="muted">{t("Computed highlights for the current selection. Ask the AI assistant for a deeper explanation.")}</p><div className="verified-highlights">{insightFacts(null, localizedResult,locale).filter(f => f.id.includes('_max')).slice(0, 3).map(f => <p key={f.id}><ArrowUpRight size={15}/>{f.text}</p>)}</div></>}</section><details className="panel definitions"><summary>{t("Methodology & data treatment")}</summary>{[...result.definitions, ...result.cleaning_log].map((x, i) => <p key={i}>{lt(x)}</p>)}</details></> : <section className="empty-result"><ChartNoAxesCombined size={32}/><h2>{t(stage==='error'?"Analysis could not finish":"Your dashboard is taking shape")}</h2><p className="muted">{t(stage==='error'?"Your dataset is retained. Retry the analysis to build your dashboard.":"We are calculating your metrics and preparing the charts.")}</p>{!busy&&stage!=='error'&&<Button variant="outline" onClick={() => void (plan ? execute() : prepare())}>{t("Retry analysis")}</Button>}{localResult && <details className="local-preview"><summary>{t("Preview basic dataset calculations")}</summary><p className="muted small">{t("Basic local calculations, before AI analysis.")}</p>{Object.entries(localResult.kpis).map(([k, v]) => <p key={k}>{lt(k)}: {fmt(v)}</p>)}</details>}</section>}</TabsContent>
 <TabsContent value="quality"><section className="panel"><div className="panel-heading"><h2>{t("Dataset health")}</h2><Button variant="outline" disabled={busy} onClick={() => void exportCSV()}><Download size={15}/>{t("Export selected data")}</Button></div><p className="muted">{fmt(profile.duplicates)}{' '}{t("exact duplicate rows. Quality figures describe the original dataset before filters. Exports follow the current selection.")}</p><Table><TableHeader><TableRow><TableHead>{t("Column")}</TableHead><TableHead>{t("Detected type")}</TableHead><TableHead>{t("Missing values")}</TableHead><TableHead>{t("Missing share")}</TableHead></TableRow></TableHeader><TableBody>{profile.columns.map(c => <TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell>{t(/(id$|code$|invoice)/i.test(c.name) ? 'identifier' : c.type)}</TableCell><TableCell>{fmt(c.missing)}</TableCell><TableCell>{fmt(profile.rows ? 100 * c.missing / profile.rows : 0)}%</TableCell></TableRow>)}</TableBody></Table><details className="code-details"><summary>{t("Technical analysis details")}</summary><p>{plan?.objective?lt(plan.objective):''}</p><ol>{plan?.steps.map((step, i) => <li key={i}>{lt(step)}</li>)}</ol><pre>{plan?.code}</pre></details><h2 className="preview-title">{t("Source preview")}</h2><Table><TableHeader><TableRow>{profile.columns.map(c => <TableHead key={c.name}>{c.name}</TableHead>)}</TableRow></TableHeader><TableBody>{profile.preview.map((r, i) => <TableRow key={i}>{profile.columns.map(c => <TableCell key={c.name}>{r[c.name] instanceof Date ? `${(r[c.name] as Date).getFullYear()}-${String((r[c.name] as Date).getMonth() + 1).padStart(2, '0')}-${String((r[c.name] as Date).getDate()).padStart(2, '0')} ${String((r[c.name] as Date).getHours()).padStart(2, '0')}:${String((r[c.name] as Date).getMinutes()).padStart(2, '0')}:${String((r[c.name] as Date).getSeconds()).padStart(2, '0')}` : String(r[c.name] ?? '—')}</TableCell>)}</TableRow>)}</TableBody></Table></section></TabsContent>
<TabsContent value="review"><section className="panel data-review"><div className="panel-heading"><div><span className="section-number">{t('REVIEW BEFORE APPLYING')}</span><h2>{t('Data review')}</h2></div><Button variant="outline" disabled={busy} onClick={()=>setChatOpen(true)}><Sparkles size={15}/>{t('Ask AI')}</Button></div>{reviewData?<><div className="review-stats"><div><span>{t('Matching rows')}</span><strong>{fmt(reviewData.matchingRows)}</strong></div><div><span>{t('Rows in draft')}</span><strong>{fmt(reviewData.draftRows)}</strong></div><div><span>{t('Staged removals')}</span><strong>{fmt(reviewData.proposedRemovals??reviewData.removedRows)}</strong></div></div><p className="muted small">{reviewData.scope==='all'?t('Scope: entire working dataset.'):t('Scope: filters captured when the review was requested.')} {t('The source file is unchanged. Draft changes do not affect the dashboard until applied.')}</p>{reviewData.operation==='remove_duplicates'&&<p className="review-notice">{t('Showing retained rows from duplicate groups. The first copy is kept; all identical copies are staged for removal.')}</p>}{reviewData.pending&&<span className="tag">{t('Unapplied draft')}</span>}<Table><TableHeader><TableRow><TableHead>{t('Working row')}</TableHead>{reviewData.rows.some((r:any)=>r.group)&&<TableHead>{t('Group')}</TableHead>}{reviewData.columns.map((c:string)=><TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader><TableBody>{reviewData.rows.map((r:any,i:number)=><TableRow key={i}><TableCell>{r.row}</TableCell>{reviewData.rows.some((x:any)=>x.group)&&<TableCell>{r.group}</TableCell>}{reviewData.columns.map((c:string)=><TableCell key={c}>{r.values[c] instanceof Date?`${r.values[c].getFullYear()}-${String(r.values[c].getMonth()+1).padStart(2,'0')}-${String(r.values[c].getDate()).padStart(2,'0')} ${String(r.values[c].getHours()).padStart(2,'0')}:${String(r.values[c].getMinutes()).padStart(2,'0')}:${String(r.values[c].getSeconds()).padStart(2,'0')}.${String(r.values[c].getMilliseconds()).padStart(3,'0')}`:String(r.values[c]??'—')}</TableCell>)}</TableRow>)}</TableBody></Table>{!reviewData.rows.length&&<p className="review-empty">{t('No rows match this request.')}</p>}<div className="review-pagination"><Button variant="outline" disabled={busy||reviewData.page===0} onClick={()=>void reviewPage(reviewData.page-1)}>{t('Previous')}</Button><span>{reviewData.page+1} / {reviewData.pages}</span><Button variant="outline" disabled={busy||reviewData.page+1>=reviewData.pages} onClick={()=>void reviewPage(reviewData.page+1)}>{t('Next')}</Button></div><div className="review-apply"><p>{reviewData.canApplyDuplicates?t('Apply changes removes extra identical copies and keeps the first row of each group.'):t('Review the draft, then apply it to update the dashboard.')}</p><div><Button variant="outline" disabled={busy} onClick={()=>void discardReview()}>{t('Discard draft')}</Button><Button disabled={busy||(!reviewData.pending&&!reviewData.canApplyDuplicates)} onClick={()=>void applyReview()}>{reviewBusy&&<Loader2 size={14} className="animate-spin"/>}{t('Apply changes')}</Button></div></div></>:<div className="review-empty"><TableProperties size={30}/><h3>{t('Inspect data through the AI assistant')}</h3><p>{t('Ask to show duplicate rows, missing values, or rows matching a condition. Proposed deletions stay here as a draft.')}</p><Button onClick={()=>{setQuestion(locale==='id'?'Tampilkan data yang duplikat':'Show exact duplicate rows');setChatOpen(true)}}>{t('Review duplicate rows')}</Button></div>}</section></TabsContent>
        </Tabs></>}

 {profile && <Sheet open={chatOpen} onOpenChange={setChatOpen}><SheetTrigger asChild><Button className="ai-fab" aria-label={t("Open AI assistant")}><Sparkles size={25}/><span className="sr-only">{t("AI assistant")}</span></Button></SheetTrigger><SheetContent className="ai-sheet"><SheetHeader><SheetTitle><Sparkles size={20}/>{t("AI assistant")}</SheetTitle><SheetDescription>{t("Understand, question and refine your dashboard.")}</SheetDescription></SheetHeader><section className="panel chat-panel"><p className="muted">{t("Ask a question or request a new chart. Your assistant uses the current dataset and selection.")}</p><div className="active-scope">{filter.country || t("All markets")} · {filter.from} – {filter.to}</div>{plan?.questions.length ? <div className="clarification"><h3>{t("One clarification before we continue")}</h3>{plan.questions.map((q, i) => <p key={i}>{lt(q)}</p>)}<Textarea aria-label={t("Your clarification")} value={clarification} onChange={e => setClarification(e.target.value)}/><Button disabled={busy || !clarification.trim()} onClick={() => void prepare(profile, filter, localRef.current, clarification)}>{t("Continue analysis")}</Button></div> : null}<div className="messages" ref={attachMessages} aria-live="polite">{!messages.length && <p className="muted">{t("Your analysis brief will appear here when the dashboard is ready.")}</p>}{messages.map((m, i) => <div className={'message ' + (m.role === 'You' ? 'user-message' : '')} key={i}><strong>{t(m.role)}</strong>{m.role === 'You' ? <p>{lt(m.text)}</p> : <Markdown text={lt(m.text)}/>}</div>)}{chatUpdating&&<div className="chat-update-status" role="status"><Loader2 size={16} className="animate-spin"/><span>{t('Updating the dashboard…')}</span></div>}</div>{pendingInsight && <Button variant="outline" disabled={busy} onClick={() => void retryInsight()}>{t("Retry AI summary")}</Button>}<form className="question-row" onSubmit={e => { e.preventDefault(); void ask(); }}><Input aria-label={t("Ask the AI assistant")} value={question} onChange={e => setQuestion(e.target.value)} disabled={busy} placeholder={t("Ask about your data or request a change\u2026")}/><Button type="submit" disabled={busy || localization.loading || !question.trim()}>{chatBusy ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16}/>}{t("Send")}</Button></form><p className="muted small">{t("AI uses computed summaries. New analyses run Python; questions use the available evidence.")}</p></section></SheetContent></Sheet>}
 <footer><span>AI Data Analysis Agent</span><span>{t("Session data is cleared on reload. Export your report before leaving.")}</span></footer></main>;
}
