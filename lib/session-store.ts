const DATABASE='analysis-workspace-v1';
let connection:Promise<IDBDatabase>|null=null;
export function openSessionStore(){
 if(!connection)connection=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('sessions');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>{connection=null;reject(request.error)};
 });
 return connection;
}
export async function readSession<T>(key:string):Promise<T|undefined>{const db=await openSessionStore();return new Promise((resolve,reject)=>{const r=db.transaction('sessions').objectStore('sessions').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}
export async function writeSession(key:string,value:unknown){const db=await openSessionStore();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});}
/** Reload/back-forward reuse this tab; a new navigation ignores a copied opener token. */
export function tabSessionId(navigation:string|undefined,previous:string|null){return (navigation==='reload'||navigation==='back_forward')&&previous?previous:crypto.randomUUID();}
export function initTabSession(){const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;const id=tabSessionId(navigation?.type,sessionStorage.getItem('analysis-tab-session'));sessionStorage.setItem('analysis-tab-session',id);return id;}
