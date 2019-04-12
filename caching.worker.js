let cacheName = 'camp-wasm';
let filesToCache = [
    '/',
    '/index.html',
    '/opencv/opencv.js',
    '/filter.worker.js',
];
self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        }),
    );
});
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(cacheName).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request).then(response => {
                    console.log("caching file: " + event.request);
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        }),
    );
});
