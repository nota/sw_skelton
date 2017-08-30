/* global caches self URL fetch */
/* eslint-env browser */

const NOCACHE_PATHS = [
  '/serviceworker\.js',
  '/api/',
]

const ASSET_PATHS = [
  '/css/',
  '/img/',
  '/fonts/',
  '/app.html',
  '/index.js'
]

const THIRDPARTY_ASSET_HOSTS = [
  'maxcdn.bootstrapcdn.com'
]

const DB_NAME = 'cache'
const STORE_NAME = 'config'

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

function isApiOrLandingPage (url) {
  if (!isMyHost(url)) return false

  return NOCACHE_PATHS.find(function (path) {
    return new RegExp('^' + path).test(url.pathname)
  })
}

function isMyHost (url) {
  return location.hostname === url.hostname
}

function isAsset (url) {
  if (THIRDPARTY_ASSET_HOSTS.includes(url.hostname)) return true

  return isMyHost(url) && ASSET_PATHS.find(function (path) {
    return url.pathname.indexOf(path) === 0
  })
}

function acceptHtml (req) {
  const accept = req.headers.get('Accept')
  return accept && accept.includes('text/html')
}

function isAppHtmlRequest (req) {
  const url = new URL(req.url)

  if (!isMyHost(url)) return false
  if (isAsset(url)) return false
  if (isApiOrLandingPage(url)) return false
  if (req.method !== 'GET') return false
  if (!acceptHtml(req)) return false

  return true
}

function shouldCache (req, res) {
  const url = new URL(req.url)

  if (!isAsset(url)) return false
  if (req.method !== 'GET') return false
  if (!res.ok && res.status !== 0) return false

  return true
}

let _db = null
function openDB () {
  const open = new Promise(function (resolve, reject) {
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
  const timeout = new Promise(function (resolve, reject) {
    setTimeout(reject, 10000)
  })
  return Promise.race([open, timeout])
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

  if (!isMyHost(url)) return false

  return (url.pathname === '/api/assets/cacheall')
}

function cacheAll (manifest) {
  return caches.open(manifest.version).then(function (cache) {
    return cache.addAll(manifest.cacheall).then(function () {
      return setVersion(manifest.version)
    })
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
          //return cacheAll(manifest).then(function () {
            console.log('sw: cache all done')
            return res
          //})
        })
      }).catch(function (err) {
        const init = {
          status: 500,
          statusText: 'Internal Server Error',
          headers: {'Content-Type': 'text/plain'}
        }
        return new Response('cache all failed: ' + err.message, init)
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
      if (err instanceof TypeError && err.message === 'Failed to fetch') return
      throw (err)
    })
  )
})

