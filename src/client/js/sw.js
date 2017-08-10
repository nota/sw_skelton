/* global caches self URL fetch */
const NOCACHE_PATHS = [
  '/sw.js',
  '/api/',
  '/.+?/.+?/slide',
  '/.+?/.+?.json'
]
;
const ASSETS = [
  '/css/',
  '/img/',
  '/fonts/'
]

const ASSET_HOSTS = [
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
  for (let path of NOCACHE_PATHS) {
    const reg = new RegExp(path)
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
  const url = new URL(request.url)

  if (!isAssetHost(url.hostname)) return false
  if (isAssetPath(url.pathname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (request.method !== 'GET') return false

  const accept = request.headers.get('Accept')
  if (!accept || accept.indexOf('text/html') < 0) {
   return false
  }

  return true
}

function shouldCache (request, response) {
  const url = new URL(request.url)

  if (!isAssetHost(url.hostname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (request.method !== 'GET') return false
  if (!response.ok && response.status !== 0) return false

  return true
}


let _db = null
function openDB () {
  return new Promise(function (resolve, reject) {
    if (_db) return resolve(_db)

    // Open (or create) the database
    const open = indexedDB.open('MyDatabase', 3);

    // Create the schema
    open.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore('version', {keyPath: 'id'})
    }

    open.onsuccess = function (event) {
      const db = event.target.result
      _db = db // save in global
      resolve(db)
    }

    open.onblocked = function (event) {
      reject(event)
    }

    open.onerror = function (event) {
      reject(event)
    }
  })
}

function setItem (storeName, data) {
  return openDB().then(function (db) {
    const store = db.transaction(storeName, 'readwrite').objectStore(storeName)
    store.put(data)
  })
}

function getItem (storeName, id) {
  return openDB().then(function (db) {
    return new Promise(function(resolve, reject) {
      const store = db.transaction(storeName, 'readonly').objectStore(storeName)
      const request = store.get(id)
      request.onsuccess = function(event){
        resolve(event.target.result)
      }
      request.onerror = function (event) {
        reject(event)
      }
    })
  })
}

function setVersion (value) {
  return setItem('version', {id: 'version', value: value})
}

function getVersion () {
  return getItem('version', 'version').then(function (result) {
    if (!result) throw 'cache version is not set'
    return result.value
  })
}

// setVersion('hoihoi2')

function createAppHtmlRequest(request) {
  const url = new URL(request.url).origin + '/app.html'
  return new Request(url, {
      method: request.method,
      headers: request.headers,
      mode: 'same-origin', // need to set this properly
      credentials: request.credentials,
      redirect: 'manual'   // let browser handle redirects
  })
}

function deleteOldCache(currentVersion) {
  return caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key !== currentVersion) {
        console.log('sw: delete old cache', key)
        return caches.delete(key)
      } else {
        return Promise.resolve()
      }
    }))
  })
}

this.addEventListener('fetch', function (event) {
  let request = event.request

  if (useAppHtml(request)) {
    request = createAppHtmlRequest(request)
  }

  let tryFetched = false

  event.respondWith(
    getVersion().then(function(version) {
      return caches.open(version).then(function(cache) {
        return cache.match(request).then(function (response) {
          if (response) {
            console.log('sw: respond from cache', request.url)
            deleteOldCache(version)
            return response
          }
          console.log('sw: fetch', request.url)
          tryFetched = true
          return fetch(request).then(function(response) {
            if (shouldCache(request, response)) {
              console.log('sw: save cache', request.url)
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    }).catch(function(err) {
      if (!tryFetched) return fetch(request)
      throw(err)
    })
  )
})

