let cacheName = 'camp-wasm';
let filesToCache = [
    '/',
    '/index.html',
    '/opencv/opencv.js',
    '/filter.worker.js',
];
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
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
                    cache.put(event.request.url, response.clone());
                    return response;
                });
            });
        }),
    );
});
