/** One shared listener set per document; menus never persist across sessions. */
const documents=new WeakMap<Document,{users:number;dispose:()=>void}>();
export function bindChartMenus(doc:Document){
 const existing=documents.get(doc);if(existing){existing.users++;return()=>release(doc)}
 const closeExcept=(keep:Element|null)=>doc.querySelectorAll<HTMLDetailsElement>('.chart-menu[open]').forEach(menu=>{if(menu!==keep)menu.open=false});
 const pointer=(event:Event)=>{const target=event.target as Element|null;closeExcept(target?.closest?.('.chart-menu')||null)};
 const toggle=(event:Event)=>{const menu=event.target as HTMLDetailsElement;if(menu.matches?.('.chart-menu')&&menu.open)closeExcept(menu)};
 const keyboard=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;const open=doc.querySelector<HTMLDetailsElement>('.chart-menu[open]');if(open){closeExcept(null);open.querySelector<HTMLElement>('summary')?.focus()}};
 doc.addEventListener('pointerdown',pointer,true);doc.addEventListener('toggle',toggle,true);doc.addEventListener('keydown',keyboard);
 documents.set(doc,{users:1,dispose:()=>{doc.removeEventListener('pointerdown',pointer,{capture:true});doc.removeEventListener('toggle',toggle,{capture:true});doc.removeEventListener('keydown',keyboard)}});
 return()=>release(doc);
}
function release(doc:Document){const entry=documents.get(doc);if(entry&&!--entry.users){entry.dispose();documents.delete(doc)}}
