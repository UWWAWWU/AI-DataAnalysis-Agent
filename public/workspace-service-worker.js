const CACHE='analysis-offline-v5';
const assets=['/','/favicon.svg','/favicon.svg?v=cream','/logo-round.svg','/data-worker.js','/engine.js','/dashboard-engine.js','/review-engine.js','/preparation-engine.js','/presentation-engine.js','/session-store.js','/category-labels.js','/agent-tools.js','/xlsx.full.min.js','/interactive-dashboard.js'];
const allowed=url=>url.origin===self.location.origin&&(url.pathname==='/'||url.pathname.startsWith('/_next/static/')||assets.includes(url.pathname));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(assets)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('analysis-offline-')&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type!=='CACHE_ASSETS')return;event.waitUntil(caches.open(CACHE).then(cache=>Promise.all(event.data.urls.filter(value=>allowed(new URL(value,self.location.origin))).map(value=>cache.add(value).catch(()=>{})))))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!allowed(new URL(event.request.url)))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(event.request);
  if(event.request.mode==='navigate'||assets.includes(new URL(event.request.url).pathname)){
   try{const response=await fetch(event.request,{signal:AbortSignal.timeout(3000)});if(response.ok)await cache.put(event.request,response.clone());return response}catch(error){if(saved)return saved;throw error}
  }
  // Public engine files change between deployments; refresh them while serving cached assets offline.
  if(saved){event.waitUntil(fetch(event.request).then(response=>response.ok?cache.put(event.request,response):undefined).catch(()=>{}));return saved}
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 })());
});
