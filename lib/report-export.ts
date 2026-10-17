import type {Result} from './analysis';
import {jsPDF} from 'jspdf';
export function reportFilename(source:string,format:'json'|'csv'|'pdf'|'html'){
 const base=source.replace(/\.(xlsx|xls|csv|tsv)$/i,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim()||'dataset';return `report_${base}.${format}`;
}
/** Export the same renderer and aggregate engine in a self-contained browser document. */
export async function exportInteractiveHTML(payload:import('./interactive-entry').InteractivePayload,name:string){
 const response=await fetch('/interactive-dashboard.js');
 if(!response.ok)throw Error(payload.locale==='id'?'Ekspor interaktif belum tersedia.':'Interactive export is unavailable.');
 const script=await response.text();
 let css='';
 for(const sheet of Array.from(document.styleSheets)){try{css+=Array.from(sheet.cssRules).map(rule=>rule.cssText).join('\n')}catch{}}
 css=css.replace(/@font-face\s*\{[^}]*\}/g,'').replace(/@import[^;]+;/g,'');
 css+='\nbody{font-family:Arial,sans-serif;margin:0;background:#f8f5ef}.offline-workspace{padding:20px;max-width:1600px;margin:auto}.offline-workspace select,.offline-workspace button{font:inherit}.offline-workspace .picker select{min-width:110px;max-width:180px}.canvas-toolbar{font-size:12px}';
 const json=JSON.stringify(payload).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const title=payload.title.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const html=`<!doctype html><html lang="${payload.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:"><title>${title}</title><style>${css.replace(/<\/style/gi,'<\\/style')}</style></head><body><div id="dashboard-root"></div><script type="application/json" id="dashboard-data">${json}</script><script>${script.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
type Report={source:string;title:string;result:Result;filter:{country:string;from:string;to:string;deduplicate:boolean};insight:string;locale:'en'|'id'};
export function buildReportPDF(image:string){
 const doc=new jsPDF({orientation:'landscape',unit:'mm',format:[320,180],compress:true});
 doc.addImage(image,'PNG',0,0,320,180);return doc;
}
/** Capture the actual canvas, preserving chart types, formatting and manual placement. */
export async function exportPDF(report:Report,name:string){
 const canvas=document.querySelector<HTMLElement>('[data-dashboard-canvas]');
 if(!canvas)throw Error(report.locale==='id'?'Dashboard belum siap.':'Dashboard is not ready.');
 await document.fonts.ready;
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const {toPng}=await import('html-to-image');
 const image=await toPng(canvas,{width:canvas.offsetWidth,height:canvas.offsetHeight,pixelRatio:Math.min(2,6000/canvas.offsetWidth),backgroundColor:getComputedStyle(canvas).backgroundColor,style:{transform:'none'},filter:node=>!(node instanceof HTMLElement&&node.classList.contains('chart-menu'))&&!(node instanceof HTMLElement&&node.classList.contains('tile-tools'))&&!(node instanceof HTMLElement&&node.classList.contains('tile-resize'))});
 buildReportPDF(image).save(name);
}
