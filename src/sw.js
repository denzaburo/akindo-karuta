// Web版のオフライン対応。中身を更新したら VERSION を上げる（古いキャッシュが捨てられる）
const VERSION='akindo-v5';
const CORE=['./','index.html','app.css','app.js','cards.json','manifest.webmanifest','assets/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// まずネットワーク（サーバーに必ず確認＝古いHTTPキャッシュを使わない）、だめならキャッシュ。取れたものは次回のためにしまう
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp));return r})
  .catch(()=>caches.match(e.request)));
});
