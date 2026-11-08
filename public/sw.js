/* Karma PWA static/offline shell. Private requests, API calls and checkout are never cached. */
const STATIC='karma-static-v1';
self.addEventListener('install', event=>{event.waitUntil(caches.open(STATIC).then(cache=>cache.addAll(['/offline.html','/icon.svg'])));self.skipWaiting()});
self.addEventListener('activate', event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(x=>x!==STATIC).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/')||['/account','/admin','/checkout','/cart','/login','/register','/order'].some(x=>url.pathname.startsWith(x)))return;
 if(request.mode==='navigate') event.respondWith(fetch(request).catch(()=>caches.match('/offline.html')));
});
