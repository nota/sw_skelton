/* global caches self URL fetch */
/* eslint-env browser */

console.log('sw: hello')

const NOCACHE_PATHS = [
  '^/serviceworker\\.js',
  '^/api/'
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

const POSTFIX = '-v1' // XXX 緊急時は、このpostfixを上げることで全キャッシュを無効化できる

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

function isMyHost (url) {
  return location.hostname === url.hostname
}

function isApiOrLandingPage (url) {
  return isMyHost(url) && NOCACHE_PATHS.find(function (path) {
    return new RegExp(path).test(url.pathname)
  })
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

function isGetRequest (req) {
  return req.method === 'GET'
}

function isAppHtmlRequest (req) {
  const url = new URL(req.url)

  return (
    isMyHost(url) &&
    !isAsset(url) &&
    !isApiOrLandingPage(url) &&
    isGetRequest(req) &&
    acceptHtml(req)
  )
}

function shouldCache (req, res) {
  const url = new URL(req.url)
  const ok = res.ok || res.status === 0 // XXX: status=0でokのときがある

  return isAsset(url) && isGetRequest(req) && ok
}

function isCacheAllRequest (req) {
  const url = new URL(req.url)

  const path = '/api/app/cacheall'
  return isMyHost(url) && url.pathname === path
}

function cacheKey (version) {
  return version + POSTFIX
}

function deleteOldCache (currentVersion) {
  return caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key !== cacheKey(currentVersion)) {
        console.log('sw: delete old cache', key)
        return caches.delete(key)
      } else {
        return Promise.resolve()
      }
    }))
  })
}

function respondCacheAll (req) {
  return fetch(req).then(function (res) {
    return res.clone().json().then(function (manifest) {
      return getVersion({allowNull: true}).then(function ({version, updated}) {
        if (version === manifest.version) {
          const cacheStatus = 'latest'
          return createJsonResponse(200, {version, cacheStatus})
        }
        return cacheAll(manifest).then(function () {
          console.log('sw: cache all done')
          const body = manifest
          body.cacheStatus = 'updated'
          body.previousVersion = {version, updated}
          return createJsonResponse(200, body)
        })
      })
    })
  }).catch(function (err) {
    /*
    TODO: エラーのより細かい判定が必要

    最悪の状態: 一生アップデートできない
    indexdb周りのエラー、cache storageまわりのエラーが考えられる(setVersion, getVersion等)。
    これらが発生したら、とりあえず全部クリアする?

    エラー一覧
      cacheAllの途中でnot found
        TypeError, Request failed
      cacheAllの途中で、サーバーが落ちる
        TypeError, Failed to fetch
      他のエラー、JSのシンタックスエラー
      indexeddb周りのエラー
        DBを手動で削除した直後など
        InvalidStateError, Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.
        DBが完全にぶっ壊れたら？ わからない...
      cache.open周りのエラー
        書き込みできない -> まずいので、現cacheを全部削除して様子見？
        読み込みできない -> そもそもonFetchでネットワーク経由だけになってるはず
    その他の知見
      たまにservice worker経由のresponseが500ms程度にあがったりする。ブラウザを再起動するとなおる
      なにがボトルネックなのかまだわかっていない
    */
    const body = {
      name: err.name,
      message: err.message
    }
    console.error(err)
    return createJsonResponse(500, body)
  })
}

function cacheAll (manifest) {
  return caches.open(cacheKey(manifest.version)).then(function (cache) {
    return cache.addAll(manifest.cacheall).then(function () {
      return setVersion(manifest.version)
    })
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
    objectStore.put({key: key, value: value, updated: Date.now()})
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

function getVersion ({allowNull}={}) {
  return getItem('version').then(function (result) {
    if (!result) {
      if (allowNull) {
        return {version: null, updated: null}
      }
      throw new Error('cache version is not set')
    }
    const version = result.value
    const updated = result.updated
    return {version, updated}
  })
}

function createJsonResponse(status, body) {
  const statusText = function (status) {
    switch (status) {
      case 200:
        return 'OK'
      case 500:
        return 'Internal Server Error'
    }
  }
  const init = {
    status: status,
    statusText: statusText(status),
    headers: {'Content-Type': 'application/json'}
  }
  return new Response(JSON.stringify(body), init)
}

this.addEventListener('fetch', function (event) {
  let req = event.request

  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }

  if (isCacheAllRequest(req)) {
    console.log('sw: cache all')
    event.respondWith(respondCacheAll(req))
    return
  }

  let tryFetched = false

  event.respondWith(
    getVersion().then(function ({version}) {
      return caches.open(cacheKey(version)).then(function (cache) {
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

