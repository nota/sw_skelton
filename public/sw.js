var WHITELIST = [
  '/',
  '/[a-ZA-Z0-9]+/',
  '/[a-ZA-Z0-9]/[^¥]+'
];

var BLACKLIST = [
  '/gen_204\?',
  '/async/',
  '/css/'
/*  '/sw.js',*/
/*  '/app2.css'*/
];

var FILES = [
  '/img/logo.png',
  '/css/app.css',
  '/index.js'
];

var CHECKSUM = "2mxua9-1234580980";
var CACHENAME = 'cache-' + CHECKSUM;

console.log('sw: hello', CHECKSUM)

this.addEventListener('install', function(event) {
  console.log('sw: installed')

  event.waitUntil(
    caches.open(CACHENAME).then(function(cache) {
      return cache.addAll(FILES)
    }).then(function() {
      // `skipWaiting()` forces the waiting ServiceWorker to become the
      // active ServiceWorker, triggering the `onactivate` event.
      // Together with `Clients.claim()` this allows a worker to take effect
      // immediately in the client(s).
      console.log('sw: cache all done')
      return self.skipWaiting()
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('sw: activated')

  return event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k != CACHENAME/* && k.indexOf('me-') == 0*/) {
          console.log('sw: delete cache', k)
          return caches.delete(k);
        } else {
          console.log('sw: keep cache', k)
          return Promise.resolve();
        }
      }))
    }).then(function() {
      // `claim()` sets this worker as the active worker for all clients that
      // match the workers scope and triggers an `oncontrollerchange` event for
      // the clients.
      console.log('sw: claim')
      return self.clients.claim();
    })
  )
});

this.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log('sw: respond from cache', event.request.url);
        return response;
      }

      return fetch(event.request).then(function(response) {
        var shouldCache = false;

        for (var i = 0; i < WHITELIST.length; ++i) {
          var b = new RegExp(WHITELIST[i]);
          if (b.test(event.request.url)) {
//            shouldCache = true;
            break;
          }
        }

        for (var i = 0; i < BLACKLIST.length; ++i) {
          var b = new RegExp(BLACKLIST[i]);
          if (b.test(event.request.url)) {
            shouldCache = false;
            break;
          }
        }

        if (event.request.method == 'POST') {
          shouldCache = false;
        }

        if (!response.ok) {
          shouldCache = false;
        }

        if (shouldCache) {
          console.log('sw: save cache', event.request.url)
          return caches.open(CACHENAME).then(function(cache) {
            cache.put(event.request, response.clone());
            return response;
          });
        } else {
          return response;
        }
      });
    }) // XXX: no ; !!
  );
});
