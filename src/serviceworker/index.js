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

function isCacheUpdateApiRequest (req) {
  const url = new URL(req.url)
  const path = '/api/caches/update'
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

function deleteAllCache () {
  return caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      return caches.delete(key)
    }))
  })
}

function cacheAddAll ({version, assets}) {
  return caches.open(cacheKey(version)).then(function (cache) {
    return cache.addAll(assets).then(function () {
      return setVersion(version).then(function () {
        return deleteOldCache(version)
      })
    })
  })
}

function respondCacheUpdateApi (req) {
  console.log('sw: cache update')
  const url = new URL(req.url)
  const forceAddAll = !!url.searchParams.get('addall')

  return fetch(req).then(function (res) {
    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    return res.clone().json().then(function (manifest) {
      return getVersion({allowNull: true}).then(function ({version, updated}) {
        if (version === manifest.version) {
          const cacheStatus = 'latest'
          if (forceAddAll) cacheAddAll(manifest)
          return createJsonResponse(200, {version, cacheStatus})
        }
        return cacheAddAll(manifest).then(function () {
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

    最悪の状態: 一生アップデートできない、を回避する

    エラー一覧
      cacheAllの途中でnot found
        TypeError, Request failed
      cacheAllの途中で、接続が切れる
        TypeError, Failed to fetch
      indexeddb周りのエラー
        DBを手動で削除した直後など
        読み込みできない:そもそもonFetchでネットワーク経由だけになってるはず
        書き込みできない:まずいので、cacheを全部消すのがよさそう
      cache.open周りのエラー
        読み込みできない -> そもそもonFetchでネットワーク経由だけになってるはず
        書き込みできない -> ネットワークエラーかどうか、現cacheを全部削除して様子見？
    その他の知見
      たまにservice worker経由のresponseが500ms程度にあがったりする。ブラウザを再起動するとなおる
      なにがボトルネックなのかまだわかっていない
    */

    // see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
    // https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/objectStore
    // InvalidStateError, Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.
    // Chromeで開発ツールからDBを削除したときに発生する
    // ただし、db.oncloseを適切に扱っていれば普通は問題はない

    // NotFoundError, Operation failed because the requested database object could not be found
    // Firefoxで開発ツールからDBを削除したときによく発生する
    // なぜか、object storeだけが消えてDBは残っている状態になる
    // 解決策は、もういちどDBを消すしかなさそう
    const indexdbErrors = ['InvalidStateError', 'NotFoundError', 'QuotaExceededError',
      'DataError', 'TransactionInactiveError', 'DataCloneError']

    if (indexdbErrors.includes(err.name)) {
      deleteAllCache()
    }
    const body = {
      name: err.name,
      message: err.message
    }
    console.error(err)
    return createJsonResponse(500, body)
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

    if (!indexedDB) throw new Error('IndexedDB is not available')

    // Open (or create) the database
    const req = indexedDB.open(DB_NAME, 1)

    // Create the schema
    req.onupgradeneeded = function () {
      const db = req.result
      db.createObjectStore(STORE_NAME, {keyPath: 'key'})
    }

    req.onsuccess = function () {
      const db = req.result
      oncloseDB(db)
      _db = db // save in global
      resolve(db)
    }

    const oncloseDB = function (db) {
      db.onclose = function () {
        console.log('sw: db closed')
        _db = null
      }
    }

    req.onblocked = function () { reject(req.error) }
    req.onerror = function () { reject(req.error) }
  })
  const timeout = new Promise(function (resolve, reject) {
    setTimeout(reject, 10000)
  })
  return Promise.race([open, timeout])
}

function setItem (key, value) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const objectStore = db.transaction(STORE_NAME, 'readwrite')
                            .objectStore(STORE_NAME)
      const updated = Date.now()
      const req = objectStore.put({key, value, updated})
      req.onsuccess = function () { resolve(req.result) }
      req.onerror = function () { reject(req.error) }
    })
  })
}

function getItem (key) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      const objectStore = db.transaction(STORE_NAME, 'readonly')
                            .objectStore(STORE_NAME)
      const req = objectStore.get(key)
      req.onsuccess = function () { resolve(req.result) }
      req.onerror = function () { reject(req.error) }
    })
  })
}

function setVersion (value) {
  return setItem('version', value)
}

function getVersion ({allowNull} = {}) {
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

function createJsonResponse (status, body) {
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

function respondFromCache ({req, fetchIfNotCached}) {
  let tryFetched = false

  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }
  return getVersion().then(function ({version}) {
    return caches.open(cacheKey(version)).then(function (cache) {
      return cache.match(req).then(function (res) {
        if (res) {
          console.log('sw: respond from cache', req.url)
          return res
        }
        if (!fetchIfNotCached) {
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
    if (!tryFetched && fetchIfNotCached) return fetch(req)
    if (err instanceof TypeError && err.message === 'Failed to fetch') return
    throw (err)
  })
}

this.addEventListener('fetch', function (event) {
  const req = event.request

  if (req.cache === 'no-cache') { // reloaded on browser
    console.log('sw: request with no-cache flag', req.url, req.cache)
    event.respondWith(
      fetch(req).then(function (res) {
        // 全キャッシュをクリアする
        // TODO: 最新のものも消してしまうのはちょっともったいない
        // TODO: クライアントからのアップデート時にlocation.reloadで一緒に消えてしまう問題
        console.log('sw: 6 successed to fetch so clear all cache')
        deleteAllCache()
        return res
      }).catch(function (err) {
        return respondFromCache({req, fetchIfNotCached: false})
      })
    )
    return
  }

  if (isCacheUpdateApiRequest(req)) {
    event.respondWith(respondCacheUpdateApi(req))
    return
  }

  event.respondWith(respondFromCache({req, fetchIfNotCached: true}))
})

