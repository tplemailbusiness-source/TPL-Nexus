const CACHE_NAME = "tpl-nexus-v1.1-beta";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./data/songs.json",
    "./manifest.json",
    "./icons/icon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./covers/SesameStreet.gif",
    "./music/I listen to my Body.mp3",
    "./music/03 Pick it up.m4a"
];

self.addEventListener("install",(event)=>{
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache)=>cache.addAll(CORE_ASSETS))
            .then(()=>self.skipWaiting())
    );
});

self.addEventListener("activate",(event)=>{
    event.waitUntil(
        caches.keys()
            .then((keys)=>Promise.all(keys.filter((key)=>key !== CACHE_NAME).map((key)=>caches.delete(key))))
            .then(()=>self.clients.claim())
    );
});

self.addEventListener("fetch",(event)=>{
    if(event.request.method !== "GET"){
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse)=>{
            return cachedResponse || fetch(event.request).then((response)=>{
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache)=>cache.put(event.request,copy));
                return response;
            }).catch(()=>caches.match("./index.html"));
        })
    );
});
