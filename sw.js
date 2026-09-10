/* =========================================================
   Combinado — service worker
   Guarda o "esqueleto" do app (HTML/CSS/JS/ícones) em cache pra
   funcionar sem internet depois da primeira visita. Os dados das
   tarefas continuam só em LocalStorage — isso aqui cuida só dos
   arquivos do app em si.

   Se vocês mudarem algum arquivo e o navegador insistir em mostrar
   a versão antiga, é só subir o número do CACHE_NAME (v1 -> v2) —
   isso força a limpeza do cache velho no próximo carregamento.
   ========================================================= */

var CACHE_NAME = "combinado-cache-v5";

var ARQUIVOS_PARA_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(ARQUIVOS_PARA_CACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches
      .keys()
      .then(function (nomes) {
        return Promise.all(
          nomes
            .filter(function (nome) {
              return nome !== CACHE_NAME;
            })
            .map(function (nome) {
              return caches.delete(nome);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (evento) {
  var requisicao = evento.request;

  // só cuidamos de GET dentro do nosso próprio domínio — fontes do
  // Google e qualquer outra origem seguem direto pra rede, sem cache.
  if (requisicao.method !== "GET") return;
  if (new URL(requisicao.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(requisicao).then(function (respostaEmCache) {
      var buscaNaRede = fetch(requisicao)
        .then(function (respostaDaRede) {
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(requisicao, respostaDaRede.clone());
          });
          return respostaDaRede;
        })
        .catch(function () {
          // offline e sem nada em cache: não tem o que fazer além de deixar falhar
          return respostaEmCache;
        });

      // H1 — visibilidade/robustez: mostra o que já temos guardado na hora,
      // e atualiza o cache por trás sem travar a navegação.
      return respostaEmCache || buscaNaRede;
    })
  );
});
