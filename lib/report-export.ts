import type {Result} from './analysis';
import {jsPDF} from 'jspdf';
export function reportFilename(source:string,format:'json'|'csv'|'pdf'){
 const base=source.replace(/\.(xlsx|xls|csv|tsv)$/i,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim()||'dataset';return `report_${base}.${format}`;
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
