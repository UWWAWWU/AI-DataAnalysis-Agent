'use client';
import {Children,cloneElement,isValidElement,useEffect,useSyncExternalStore,type ReactNode,type ReactElement} from 'react';
import messages from './product-en.json';
type Locale='id'|'en';
let current:Locale='en';
const listeners=new Set<()=>void>();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}};
export const useLocale=()=>useSyncExternalStore(subscribe,()=>current,()=>'en' as Locale);
export function setProductLocale(locale:Locale){current=locale;document.documentElement.lang=locale;try{localStorage.setItem('analysis-preview-language-v2',locale)}catch{}listeners.forEach(listener=>listener())}
const dictionary=messages as Record<string,string>;
function text(value:string,locale:Locale){if(locale==='id')return value;const key=value.trim();const translated=dictionary[key];if(translated)return value.replace(key,translated);return value.replace(/(\d+) salinan baris ditemukan/g,'$1 duplicate rows found').replace(/(\d+) nilai penjualan belum terisi/g,'$1 missing sales values').replace(/Lihat semua (\d+) pilihan/g,'View all $1 options').replace(/(\d+) nilai kosong tetap disimpan\./g,'$1 missing values are retained.');}
export function localizeTree(node:ReactNode,locale:Locale):ReactNode{
 if(typeof node==='string')return text(node,locale);
 if(Array.isArray(node))return Children.map(node,child=>localizeTree(child,locale));
 if(!isValidElement(node))return node;
 const element=node as ReactElement<Record<string,unknown>>;const props:Record<string,unknown>={};
 for(const key of ['aria-label','title','placeholder','alt'])if(typeof element.props[key]==='string')props[key]=text(element.props[key] as string,locale);
 if(element.type==='option'&&element.props.value===undefined&&typeof element.props.children==='string')props.value=element.props.children;
 if(element.type!=='pre'&&element.type!=='code'&&element.props.children!==undefined)props.children=localizeTree(element.props.children as ReactNode,locale);
 return cloneElement(element,props);
}
export function LocaleSwitch(){const locale=useLocale();useEffect(()=>{try{const saved=localStorage.getItem('analysis-preview-language-v2');setProductLocale(saved==='id'?'id':'en')}catch{}},[]);return <div className="pd-language" role="group" aria-label={locale==='id'?'Bahasa tampilan':'Display language'}><button lang="id" aria-pressed={locale==='id'} onClick={()=>setProductLocale('id')}>ID</button><span aria-hidden="true">/</span><button lang="en" aria-pressed={locale==='en'} onClick={()=>setProductLocale('en')}>EN</button></div>}
