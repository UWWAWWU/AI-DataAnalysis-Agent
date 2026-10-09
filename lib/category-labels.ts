export type CategoryLabel={en:string;id:string};
export type CategoryDictionary={label:CategoryLabel;values:Record<string,CategoryLabel>;order?:string[];source:string};
export type CategoryDictionaries=Record<string,CategoryDictionary>;
const label=(en:string,id=en):CategoryLabel=>({en,id});
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const hari=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
function dateOf(value:unknown){if(value instanceof Date&&!Number.isNaN(value.getTime()))return value;const text=String(value??'');if(!/^\d{4}-\d{2}-\d{2}(?:$|[ T])/.test(text))return null;const parsed=new Date(text.slice(0,10)+'T12:00:00Z');return Number.isNaN(parsed.getTime())?null:parsed}
/** Infer mappings from actual code/name pairs or matching dates, never from code numbers alone. */
export function inferCategoryLabels(rows:Record<string,unknown>[]):CategoryDictionaries{
 const names=Object.keys(rows[0]||{}),out:CategoryDictionaries={};
 for(const column of names){
  const literal=[...new Set(rows.map(row=>String(row[column]??'')).filter(Boolean))];
  if(/^smoker$/i.test(column)&&literal.every(value=>/^(yes|no)$/i.test(value)))out[column]={label:label('Smoking status','Status perokok'),values:Object.fromEntries(literal.map(value=>[value,value.toLowerCase()==='yes'?label('Smoker','Perokok'):label('Non-smoker','Bukan perokok')])),source:'Literal smoking status values'};
  const weekdayNames=['mon','tue','wed','thu','fri','sat','sun'];
  if(/^day$|weekday|day.of.week/i.test(column)&&literal.length&&literal.every(value=>weekdayNames.includes(value.toLowerCase().slice(0,3))))out[column]={label:label('Day','Hari'),values:Object.fromEntries(literal.map(value=>[value,label(value)])),order:[...literal].sort((a,b)=>weekdayNames.indexOf(a.toLowerCase().slice(0,3))-weekdayNames.indexOf(b.toLowerCase().slice(0,3))),source:'Literal weekday names'};

  const base=column.replace(/[_ ]?(code|kode|id)$/i,'');
  const paired=names.find(name=>name!==column&&[base+'_name',base+'_label',base+'_nama',base+'Name'].some(candidate=>candidate.toLowerCase()===name.toLowerCase()));
  if(base!==column&&paired){const values:Record<string,CategoryLabel>={},reverse=new Set<string>();let valid=true;
   for(const row of rows){const key=String(row[column]??''),text=String(row[paired]??'').trim();if(!key||!text)continue;if(values[key]&&values[key].en!==text){valid=false;break}values[key]=label(text);if(Object.keys(values).length>100){valid=false;break}}
   for(const value of Object.values(values)){if(reverse.has(value.en))valid=false;reverse.add(value.en)}
   if(valid&&Object.keys(values).length)out[column]={label:label(base.replace(/_/g,' ')),values,source:`Dataset column ${paired}`};
  }
  if(rows.some(row=>typeof row[column]==='boolean'||/^(true|false)$/i.test(String(row[column]??'')))&&rows.every(row=>row[column]==null||row[column]===''||typeof row[column]==='boolean'||/^(true|false)$/i.test(String(row[column]))))out[column]={label:label(column.replace(/_/g,' ')),values:Object.fromEntries([...new Set(rows.map(row=>String(row[column]??'')).filter(value=>/^(true|false)$/i.test(value)))].map(value=>[value,value.toLowerCase()==='true'?label('Yes','Ya'):label('No','Tidak')])),source:'Boolean values in the dataset'};
 }
 for(const column of names.filter(name=>/^(weekday|day_of_week|dayofweek|hari|hari_dalam_minggu)$/i.test(name))){
  for(const dateColumn of names.filter(name=>/date|tanggal|dteday/i.test(name))){const values:Record<string,CategoryLabel>={},byDay=new Map<number,string>();let valid=true,observed=0;
   for(const row of rows){const date=dateOf(row[dateColumn]),key=String(row[column]??'');if(!date||!/^\d+$/.test(key))continue;const day=date.getUTCDay();if((values[key]&&values[key].en!==days[day])||(byDay.has(day)&&byDay.get(day)!==key)){valid=false;break}values[key]=label(days[day],hari[day]);byDay.set(day,key);observed++}
   if(valid&&observed&&byDay.size>=2){out[column]={label:label('Day of the week','Hari dalam minggu'),values,order:[1,2,3,4,5,6,0].flatMap(day=>byDay.has(day)?[byDay.get(day)!]:[]),source:`Verified against ${dateColumn}`};break}
  }
 }
 // This registry is enabled only for the documented UCI Bike Sharing column signature
 // and rows whose date, month, year and rental identity match that dataset.
 const bike=['instant','dteday','season','yr','mnth','weekday','workingday','weathersit','temp','atemp','hum','windspeed','casual','registered','cnt'].every(name=>names.includes(name));
 const observed=rows.slice(0,500),verified=bike&&observed.length>0&&observed.every(row=>{const date=dateOf(row.dteday);return date&&[2011,2012].includes(date.getUTCFullYear())&&Number(row.mnth)===date.getUTCMonth()+1&&Number(row.yr)===date.getUTCFullYear()-2011&&Number(row.cnt)===Number(row.casual)+Number(row.registered)&&Number(row.season)>=1&&Number(row.season)<=4});
 if(verified){
  const source='https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset';
  const add=(column:string,title:CategoryLabel,values:Record<string,CategoryLabel>,order?:string[])=>{if(names.includes(column))out[column]={label:title,values,order,source}};
  add('mnth',label('Month','Bulan'),Object.fromEntries(Array.from({length:12},(_,month)=>[String(month+1),label(new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,month,1))),new Intl.DateTimeFormat('id',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,month,1))))])),Array.from({length:12},(_,month)=>String(month+1)));
  add('yr',label('Year','Tahun'),{'0':label('2011'),'1':label('2012')},['0','1']);
  add('season',label('Season','Musim'),{'1':label('Winter','Musim dingin'),'2':label('Spring','Musim semi'),'3':label('Summer','Musim panas'),'4':label('Autumn','Musim gugur')},['1','2','3','4']);
  add('weathersit',label('Weather','Cuaca'),{'1':label('Clear / partly cloudy','Cerah / berawan sebagian'),'2':label('Mist / cloudy','Berkabut / berawan'),'3':label('Light rain / snow','Hujan / salju ringan'),'4':label('Heavy rain / snow','Hujan / salju lebat')},['1','2','3','4']);
  add('workingday',label('Day type','Jenis hari'),{'0':label('Non-working day','Hari nonkerja'),'1':label('Working day','Hari kerja')});
  add('holiday',label('Holiday','Hari libur'),{'0':label('Not a holiday','Bukan hari libur'),'1':label('Holiday','Hari libur')});
  for(const [column,en,id] of [['cnt','Rentals','Penyewaan'],['casual','Casual rentals','Penyewaan pengguna nonterdaftar'],['registered','Registered rentals','Penyewaan pengguna terdaftar'],['hr','Hour of day','Jam'],['dteday','Date','Tanggal'],['temp','Temperature (normalized)','Suhu (normalisasi)']])add(column,label(en,id),{});
 }
 return out;
}
export function categoryName(dictionary:CategoryDictionary|undefined,value:string,locale:'en'|'id'){return dictionary?.values[value]?.[locale]||value}
export function categoryValue(dictionary:CategoryDictionary|undefined,name:string,locale:'en'|'id'){return Object.keys(dictionary?.values||{}).find(value=>dictionary!.values[value][locale]===name)||name}
function readableInterval(raw:string,locale:'en'|'id'){const edges=raw.split(' — ').map(Number),width=Math.abs(edges[1]-edges[0]);const digits=Math.min(12,Math.max(2,width?Math.ceil(-Math.log10(width))+1:2));const formatted=edges.map(value=>new Intl.NumberFormat(locale==='id'?'id-ID':'en-GB',{maximumFractionDigits:digits}).format(value));return (formatted[0]===formatted[1]&&edges[0]!==edges[1]?edges.map(value=>value.toPrecision(15)):formatted).join(' – ');}
export function readableChart<T extends import('./analysis').Chart>(source:T,locale:'en'|'id'):T{
 const dictionary=source.categoryLabels;
 const entries=source.labels.map((raw,index)=>({raw,value:source.values[index]}));
 if(dictionary?.order)entries.sort((a,b)=>{const ai=dictionary.order!.indexOf(a.raw),bi=dictionary.order!.indexOf(b.raw);return (ai<0?1000:ai)-(bi<0?1000:bi)});
 const name=(raw:string)=>/^smoker$/i.test(source.groupColumn||'')&&/^(yes|no)$/i.test(raw)?(raw.toLowerCase()==='yes'?(locale==='id'?'Perokok':'Smoker'):(locale==='id'?'Bukan perokok':'Non-smoker')):source.time&&/^\d{4}-\d{2}$/.test(raw)?new Intl.DateTimeFormat(locale,{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(raw+'-01T12:00:00Z')):source.view==='histogram'&&/^[-\d.e+]+ — [-\d.e+]+$/i.test(raw)?readableInterval(raw,locale):categoryName(dictionary,raw,locale),measure=source.measureLabel?.[locale]||source.measureColumns?.join(' × ').replace(/_/g,' '),group=source.groupLabel?.[locale]||source.groupColumn?.replace(/_/g,' ');
 const verbs=locale==='id'?{sum:'Total',mean:'Rata-rata',count:'Jumlah baris',distinct:'Jumlah nilai unik'}:{sum:'Total',mean:'Average',count:'Record count',distinct:'Distinct count'};
 const operation=verbs[source.aggregation as keyof typeof verbs];
 const metricLabel=operation?(source.aggregation==='count'?operation:`${operation}${measure?' '+measure:''}`):source.metricLabel;
 const description=source.description|| (metricLabel&&group?`${metricLabel} ${locale==='id'?'menurut':'by'} ${group}.`:undefined);
 return {...source,groupCounts:source.groupCounts?Object.fromEntries(Object.entries(source.groupCounts).map(([key,count])=>[name(key),count])):undefined,metricLabel,description,labels:entries.map(entry=>name(entry.raw)),values:entries.map(entry=>entry.value),boxes:source.boxes?.map(box=>({...box,name:name(box.name)})),points:source.points?.map(point=>({...point,group:point.group?name(point.group):point.group})),tableHeaders:source.tableHeaders?.map((header,index)=>index===0&&group?group:header),tableRows:source.tableRows?.map(row=>row.map((value,index)=>index===0?name(String(value)):value))};
}
