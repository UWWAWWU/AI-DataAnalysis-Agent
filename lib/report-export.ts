import type {Result} from './analysis';
import {jsPDF} from 'jspdf';
export function reportFilename(source:string,format:'json'|'csv'|'pdf'){
 const base=source.replace(/\.(xlsx|xls|csv|tsv)$/i,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim()||'dataset';return `report_${base}.${format}`;
}
type Report={source:string;title:string;result:Result;filter:{country:string;from:string;to:string;deduplicate:boolean};insight:string;locale:'en'|'id'};
const format=(n:number)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(n);
const plain=(s:string)=>s.replace(/\*\*|`|\\(?=[*_.])/g,'').replace(/&#x20;/g,' ').replace(/[–—]/g,'-').replace(/^#{1,6}\s*/gm,'');
export function buildReportPDF(report:Report){
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});const id=report.locale==='id';let y=28;
 const label=(en:string,indo:string)=>id?indo:en;
 const header=()=>{doc.setFillColor(48,45,40);doc.rect(0,0,210,15,'F');doc.setTextColor(226,217,190);doc.setFontSize(10);doc.text('AI Data Analysis Agent',16,10);doc.setTextColor(48,45,40)};header();
 const space=(height:number)=>{if(y+height>277){doc.addPage();header();y=26}};
 const text=(value:string,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(plain(value),178) as string[];for(const line of lines){space(size*.45+2);doc.text(line,16,y);y+=size*.45+2}y+=2};
 text(report.title,20,true);text(`${label('Source','Sumber')}: ${report.source}`,10);
 text(`${label('Generated','Dibuat')}: ${new Date().toLocaleString(id?'id-ID':'en-GB')}`,9);
 text(`${label('Active filters','Filter aktif')}: ${report.filter.country||label('All categories','Semua kategori')} | ${report.filter.from||label('Start','Awal')} - ${report.filter.to||label('End','Akhir')} | ${label('Exact duplicates excluded','Duplikat identik dikecualikan')}: ${report.filter.deduplicate?label('Yes','Ya'):label('No','Tidak')}`,9);
 text(`${label('Selected rows','Baris terpilih')}: ${format(report.result.rows)}`,10);
 y+=3;text(label('Key performance indicators','Indikator utama'),14,true);
 for(const [name,value] of Object.entries(report.result.kpis))text(`${name}: ${format(value)}${/percent|rate|%/i.test(name)?'%':''}`,12);
 for(const chart of report.result.charts){
  const view=(chart as typeof chart&{view?:string;time?:boolean}).view||((chart as typeof chart&{time?:boolean}).time?'area':'ranking');
  if(view==='table'){space(25);text(chart.title,14,true);for(let i=0;i<chart.labels.length;i++)text(`${chart.labels[i]}: ${format(chart.values[i])}`,10);continue}
  space(114);text(chart.title,14,true);const top=y,left=24,width=164,height=62;
  if(chart.values.length){const min=Math.min(0,...chart.values),max=Math.max(0,...chart.values);const range=max-min||1;
   doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setLineWidth(.2);doc.setDrawColor(222,215,205);doc.setTextColor(111,102,90);
   for(let i=0;i<=4;i++){const py=top+height-height*i/4;doc.line(left,py,left+width,py);doc.text(format(min+range*i/4),left-2,py,{align:'right'})}
   const count=chart.values.length,point=(i:number)=>left+(count===1?width/2:i*width/(count-1));const valueY=(v:number)=>top+height-(v-min)/range*height;
   doc.setDrawColor(188,97,61);doc.setFillColor(188,97,61);doc.setLineWidth(.65);
   if(view==='bar'||view==='ranking'){const bw=width/count*.65;chart.values.forEach((v,i)=>{const px=left+(i+.5)*width/count;const zero=valueY(0),py=valueY(v);doc.rect(px-bw/2,Math.min(zero,py),bw,Math.max(.2,Math.abs(zero-py)),'F')})}
   else{for(let i=1;i<count;i++)doc.line(point(i-1),valueY(chart.values[i-1]),point(i),valueY(chart.values[i]));if(count===1)doc.circle(point(0),valueY(chart.values[0]),1,'F')}
   doc.setTextColor(111,102,90);const step=Math.max(1,Math.ceil(count/5));for(let i=0;i<count;i+=step){const x=(view==='bar'||view==='ranking')?left+(i+.5)*width/count:point(i);const name=chart.labels[i];doc.text(name.length>20?name.slice(0,18)+'...':name,x,top+height+6,{align:'center'})}
  }else{doc.setFontSize(10);doc.text(label('No data in this selection.','Tidak ada data pada pilihan ini.'),left,top+20)}
  doc.setTextColor(48,45,40);y=top+height+17;
  // Include exact underlying figures, including category labels shortened in the chart.
  text(label('Underlying figures','Angka perhitungan'),10,true);for(let i=0;i<chart.labels.length;i++)text(`${chart.labels[i]}: ${format(chart.values[i])}`,9);y+=5;
 }
 space(30);text(label('Analysis insights','Insight analisis'),14,true);text(report.insight||label('AI narrative is unavailable. KPI and charts are calculated from the active selection.','Ringkasan AI belum tersedia. KPI dan grafik dihitung dari filter aktif.'),10);
 text(label('Methodology and data treatment','Metode dan perlakuan data'),14,true);for(const definition of report.result.definitions||[])text(definition,9);
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(8);doc.setTextColor(135,120,100);doc.text(`${page} / ${pages}`,194,289,{align:'right'});doc.text('AI Data Analysis Agent',16,289)}
 return doc;
}
export async function exportPDF(report:Report,name:string){buildReportPDF(report).save(name)}
