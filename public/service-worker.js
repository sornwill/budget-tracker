const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/assets/js/index.js',
    '/assets/js/db.js',
    '/manifest.webmanifest',
    '/assets/css/style.css','/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";


self.addEventListener("install", function (evt) {
    evt.waitUntil(
        cache.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        cache.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return cache.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});


self.addEventListener("fetch", function (evt) {

    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            cache.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                    .then(response => {
                     
                        if (response.status === 200) {
                            cache.put(evt.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        return cache.match(evt.request);
                    });
            }).catch(err => console.log(err))
        );

        return;
    }

    evt.respondWith(
        cache.match(evt.request).then(function (response) {
            return response || fetch(evt.request);
        })
    );
});