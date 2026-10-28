// 原稿メモ帳 service worker — アプリを更新したら VERSION の数字を上げてください
const VERSION='genko-v3';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // ページ本体：ネット優先（更新を反映）、つながらない時は保存済みを表示
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put('./index.html',c));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  // フォント・アイコンなど：保存済みを優先し、裏で更新
  if(url.origin===location.origin||url.host==='fonts.googleapis.com'||url.host==='fonts.gstatic.com'){
    e.respondWith(caches.open(VERSION).then(async c=>{
      const hit=await c.match(req);
      const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>hit);
      return hit||net;
    }));
  }
});
