'use client';
import {useEffect,useRef,useState} from 'react';
import {ID} from '@/lib/language';
import {translationBatches,type Locale} from '@/lib/localization';
const english=new Map(Object.entries(ID).map(([en,id])=>[id,en]));
export function useLocalizedContent(texts:string[],locale:Locale,model:string,columns:string[]){
 const cache=useRef(new Map<string,string>()),[revision,setRevision]=useState(0),[retry,setRetry]=useState(0),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const originals=JSON.stringify([...new Set(texts.filter(Boolean))]),columnKey=JSON.stringify(columns);
 const staticText=(text:string)=>ID[text]?(locale==='id'?ID[text]:text):english.has(text)?(locale==='en'?english.get(text)!:text):null;
 useEffect(()=>{const controller=new AbortController();let live=true;
  const pending=(JSON.parse(originals) as string[]).filter(text=>staticText(text)===null&&!cache.current.has(locale+'\0'+text));
  if(!pending.length){setLoading(false);setError('');return()=>controller.abort()}
  setLoading(true);setError('');
  void (async()=>{try{for(const batch of translationBatches(pending)){
   const response=await fetch('/api/localize',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({texts:batch,language:locale,model,columns:JSON.parse(columnKey)})});
   const data=await response.json();if(!response.ok||!Array.isArray(data.translations)||data.translations.length!==batch.length)throw Error('Translation unavailable.');
   if(!live)return;batch.forEach((text,i)=>{if(typeof data.translations[i]!=='string')throw Error('Invalid translation.');cache.current.set(locale+'\0'+text,data.translations[i])});setRevision(n=>n+1);
  }}catch(e){if(live&&!controller.signal.aborted)setError('The language update could not finish. Please retry.')}finally{if(live)setLoading(false)}})();
  return()=>{live=false;controller.abort()};
 },[originals,columnKey,locale,model,retry]);
 const remember=(texts:string[],language:Locale)=>{for(const text of texts.filter(Boolean))cache.current.set(language+'\0'+text,text);setRevision(n=>n+1)};
 const hasPending=(JSON.parse(originals) as string[]).some(text=>staticText(text)===null&&!cache.current.has(locale+'\0'+text));
 const translate=(text:string)=>!text?'':staticText(text)??cache.current.get(locale+'\0'+text)??(error?text:locale==='id'?'Menerjemahkan…':'Translating…');
 const snapshot=()=>[...cache.current];const restore=(entries:[string,string][])=>{cache.current=new Map(entries);setRevision(n=>n+1)};
 return {translate,remember,snapshot,restore,loading:loading||(hasPending&&!error),error,retry:()=>setRetry(n=>n+1),revision};
}
