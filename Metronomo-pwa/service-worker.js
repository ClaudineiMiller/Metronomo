// Service Worker para Metrônomo PWA
const APP_VERSION = '1.0.0';
const CACHE_NAME = `metronome-cache-v${APP_VERSION}`;

// Recursos para cache
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css?family=Segoe+UI&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando versão:', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] Recursos em cache');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Erro no cache:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando versão:', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ativação completa');
      return self.clients.claim();
    })
  );
});

// Estratégia: Cache First, depois Network
self.addEventListener('fetch', event => {
  // Ignorar requisições de chrome-extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }
        
        // Se não estiver no cache, busca na rede
        return fetch(event.request)
          .then(response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta para cache e uso
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Evita cache de recursos externos desnecessários
                if (event.request.url.startsWith('http') && 
                    !event.request.url.includes('chrome-extension') &&
                    !event.request.url.includes('safari-extension')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch falhou:', error);
            // Pode retornar uma página offline customizada aqui
          });
      })
  );
});

// Mensagens do Client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});