// O service worker do Admin (agente AM1, 15/10/2026).
//
// Guarda SÓ a casca do app (HTML, JS, CSS, fontes, ícones) para ele abrir
// rápido e poder ser instalado. NUNCA guarda dado: os pedidos ao Supabase (outro
// endereço) passam direto, sem cache, e o Admin não tem fila offline — dinheiro
// não grava sem rede (03-arquitetura/05-ADMIN.md, seção 5).

const CACHE = 'rf-admin-casca-v1';
const CASCA = ['/', '/index.html', '/manifest.webmanifest', '/icones/icone.svg', '/icones/icone-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // só o que é do próprio Admin e só GET; o resto (Supabase, wa.me) não passa por aqui
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // navegação: rede primeiro (a versão nova), a casca guardada se estiver sem rede
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  // arquivos com hash no nome (/assets/…), fontes e ícones: do cache, e guarda o que vier
  if (/^\/(assets|fontes|icones)\//.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then((achou) => achou || fetch(e.request).then((r) => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
      return r;
    })));
  }
});
