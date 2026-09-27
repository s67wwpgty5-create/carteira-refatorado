const CACHE='carteira-offline-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.add('/offline.html')));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('carteira-offline-')&&k!==CACHE).map(k=>caches.delete(k))))]))});
// Keep customer data, authenticated pages, API responses and mutations network-only.
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate'&&event.request.method==='GET'&&new URL(event.request.url).origin===self.location.origin){event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html').then(r=>r||Response.error())))}});
