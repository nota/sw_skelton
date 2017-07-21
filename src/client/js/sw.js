/* global caches self URL fetch */
var NOCACHE_PATHS = [
  '/sw.js',
  '/api/',
  '/.+?/.+?/slide',
  '/.+?/.+?.json'
]

var ASSETS = [
  '/css/',
  '/img/',
  '/fonts/'
]

var ASSET_HOSTS = [
  'localhost',
  'scrapbox.io',
  'staging.scrapbox.io',
  'maxcdn.bootstrapcdn.com'
]

console.log('sw: hello')

this.addEventListener('install', function (event) {
  event.waitUntil(
    self.skipWaiting()
  )
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim()
  )
})

function isNoCachePath(pathname) {
  for (var path of NOCACHE_PATHS) {
    var reg = new RegExp(path)
    if (reg.test(pathname)) return true
  }
  return false
}

function isAssetHost(hostname) {
  for (let asset_host of ASSET_HOSTS) {
    if (asset_host === hostname) return true
  }
  return false
}

function isAssetPath(pathname) {
  for (let asset_path of ASSETS) {
    if (pathname.indexOf(asset_path) === 0) return true
  }
  return false
}

function useAppHtml (request) {
  var url = new URL(request.url)

  if (!isAssetHost(url.hostname)) return false
  if (isAssetPath(url.pathname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (request.method !== 'GET') return false

  var accept = request.headers.get('Accept')
  if (!accept || accept.indexOf('text/html') < 0) {
   return false
  }

  return true
}

function shouldCache (request, response) {
  var url = new URL(request.url)

  if (!isAssetHost(url.hostname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (request.method !== 'GET') return false
  if (!response.ok && response.status !== 0) return false

  return true
}


var _db = null
function openStore (readOnly = false) {
  var permission = readOnly ? "readonly" : "readwrite"
  return new Promise(function(resolve, reject) {
    if (_db) {
      var store = _db.transaction("version", permission).objectStore("version")
      resolve(store)
      return
    }

    // Open (or create) the database
    var open = indexedDB.open("MyDatabase", 3);

    // Create the schema
    open.onupgradeneeded = function (event) {
      var db = event.target.result // or open.result
      db.createObjectStore("version", {keyPath: 'id'})
    }

    open.onsuccess = function (event) {
      var db = event.target.result // or open.result
      _db = db // save in global
      var store = db.transaction("version", permission).objectStore("version")
      resolve(store)
    }
  })
}

function putVersion(version) {
  openStore().then(function (store) {
    store.put({id: 'version', value: version})
  })
}

function getVersion(version) {
  return openStore(true).then(function (store) {
    return new Promise(function(resolve, reject) {
      var req = store.get('version')
      req.onsuccess = function(event){
        resolve(event.target.result.value)
      }
      req.onerror = function (event) {
        reject(event)
      }
    })
  })
}

putVersion('hoihoi')

this.addEventListener('fetch', function (event) {
  var request = event.request

  // TODO: 特定のfetchがあれば、キャッシュをクリアするというのを試してみたい
  if (useAppHtml(request)) {
    var url = new URL(request.url).origin + '/app.html'
    request = new Request(url, {
        method: request.method,
        headers: request.headers,
        mode: 'same-origin', // need to set this properly
        credentials: request.credentials,
        redirect: 'manual'   // let browser handle redirects
    })
  }

  event.respondWith(
    getVersion().then(function(version) {
      return caches.open(version).then(function(cache) {
        return cache.match(request).then(function (response) {
          if (response) {
            console.log('sw: respond from cache', request.url)
            return response
          }
/*
          if (shouldUseAppHtml(request)) {
            return caches.match('/app.html').then(function (response) {
              if (response) {
                console.log('sw: respond app.html', request.url)
                return response
              }

              console.log('sw: fetch', request.url)
              return fetch(request, {credentials: 'include'})
            })
          }
*/
          console.log('sw: fetch', request.url)
          return fetch(request).then(function(response) {
            if (shouldCache(request, response)) {
              console.log('sw: save cache', request.url)
  //            return caches.open(CACHENAME).then(function(cache) {
              cache.put(request, response.clone());
              return response;
  //            });
            } else {
              return response;
            }
          })
        })
      })
    })
  )
})

