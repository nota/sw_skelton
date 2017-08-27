/* global caches self URL fetch */
/* eslint-env browser */

const NOCACHE_PATHS = [
  '/serviceworker.js',
  '/api/',
  '/.+?/.+?/slide',
  '/.+?/.+?.json'
]

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

const DB_NAME = 'cache'
const STORE_NAME = 'version'

console.log('sw: hello')

this.addEventListener('install', function (event) {
  event.waitUntil(
    self.skipWaiting()
  )
})

this.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim()
  )
})

function isNoCachePath (pathname) {
  for (let path of NOCACHE_PATHS) {
    const reg = new RegExp(path)
    if (reg.test(pathname)) return true
  }
  return false
}

function isAssetHost (hostname) {
  for (let host of ASSET_HOSTS) {
    if (host === hostname) return true
  }
  return false
}

function isAssetPath (pathname) {
  for (let path of ASSETS) {
    if (pathname.indexOf(path) === 0) return true
  }
  return false
}

function isAppHtmlRequest (req) {
  const url = new URL(req.url)

  if (!isAssetHost(url.hostname)) return false
  if (isAssetPath(url.pathname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (req.method !== 'GET') return false

  const accept = req.headers.get('Accept')
  if (!accept || accept.indexOf('text/html') < 0) {
    return false
  }

  return true
}

function shouldCache (req, res) {
  const url = new URL(req.url)

  if (!isAssetHost(url.hostname)) return false
  if (isNoCachePath(url.pathname)) return false
  if (req.method !== 'GET') return false
  if (!res.ok && res.status !== 0) return false

  return true
}

let _db = null
function openDB () {
  return new Promise(function (resolve, reject) {
    if (_db) return resolve(_db)

    // Open (or create) the database
    const open = indexedDB.open(DB_NAME, 1)

    // Create the schema
    open.onupgradeneeded = function (event) {
      const db = event.target.result
      db.createObjectStore(STORE_NAME, {keyPath: 'key'})
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

function setItem (key, value) {
  return openDB().then(function (db) {
    const objectStore = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)
    objectStore.put({key: key, value: value})
  })
}

function getItem (key) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const objectStore = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME)
      const req = objectStore.get(key)
      req.onsuccess = function (event) {
        resolve(event.target.result)
      }
      req.onerror = function (event) {
        reject(event)
      }
    })
  })
}

function setVersion (value) {
  return setItem('version', value)
}

function getVersion () {
  return getItem('version').then(function (result) {
    if (!result) throw new Error('cache version is not set')
    return result.value
  })
}

// setVersion('hoihoi2')

function createAppHtmlRequest (req) {
  const url = new URL(req.url).origin + '/app.html'
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    mode: 'same-origin', // need to set this properly
    credentials: req.credentials,
    redirect: 'manual'   // let browser handle redirects
  })
}

function deleteOldCache (currentVersion) {
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

function isCacheAllRequest (req) {
  const url = new URL(req.url)

  if (!isAssetHost(url.hostname)) return false

  return (url.pathname === '/api/cacheall')
}

function cacheAll (manifest) {
  return caches.open(manifest.version).then(function (cache) {
    return cache.addAll(manifest.cacheall)
//    .then(function() {
//      // install 成功
//      return setVersion(manifest.version)
//    })
  })
}

this.addEventListener('fetch', function (event) {
  let req = event.request

  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }

  if (isCacheAllRequest(req)) {
    console.log('sw: cache all')
    event.respondWith(
      fetch(req).then(function (res) {
        return res.clone().json().then(function (manifest) {
          return cacheAll(manifest).then(function () {
            console.log('sw: cache all done')
            return res
          })
        })
      })
    )
    return
  }

  let tryFetched = false

  event.respondWith(
    getVersion().then(function (version) {
      return caches.open(version).then(function (cache) {
        return cache.match(req).then(function (res) {
          if (res) {
            console.log('sw: respond from cache', req.url)
            deleteOldCache(version)
            return res
          }
          console.log('sw: fetch', req.url)
          tryFetched = true
          return fetch(req).then(function (res) {
            if (shouldCache(req, res)) {
              console.log('sw: save cache', req.url)
              cache.put(req, res.clone())
            }
            return res
          })
        })
      })
    }).catch(function (err) {
      if (!tryFetched) return fetch(req)
      throw (err)
    })
  )
})

