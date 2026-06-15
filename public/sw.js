const CACHE_NAME = 'finance-tracker-v2';

// При установке — кэшируем базовые файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/offline.html'
      ]);
    })
  );
  self.skipWaiting();
});

// При активации — контролируем все вкладки
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Обработка всех запросов
self.addEventListener('fetch', event => {
  // Пропускаем запросы к другим доменам
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Есть в кэше — отдаём
        return cachedResponse;
      }
      
      // Нет в кэше — загружаем из сети
      return fetch(event.request).then(networkResponse => {
        // Кэшируем успешные ответы
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Сеть недоступна — отдаём offline.html для навигаций
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});