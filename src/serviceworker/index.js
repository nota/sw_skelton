/* global caches self URL fetch */
/* eslint-env browser */

console.log('sw: hello')

const NOCACHE_PATHS = [
  '/serviceworker.js',
  '/api/'
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
  console.log('sw: install')
  event.waitUntil(
    self.skipWaiting()
  )
})

this.addEventListener('activate', function (event) {
  console.log('sw: activate')
  event.waitUntil(
    self.clients.claim()
  )
})

function isMyHost (url) {
  return location.hostname === url.hostname
}

function isApiOrLandingPage (url) {
  return isMyHost(url) && NOCACHE_PATHS.find(function (path) {
    return url.pathname.indexOf(path) === 0
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
      return deleteOldCache(version)
    })
  })
}

function respondCacheUpdateApi (req) {
  const url = new URL(req.url)
  const forceAddAll = !!url.searchParams.get('addall')

  console.log('sw: fetching cache manifest from server...')
  return fetch(req).then(function (res) {
    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    return res.clone().json().then(function (manifest) {
      const {version} = manifest
      return caches.keys().then(function (keys) {
        if (keys && keys.includes(cacheKey(version))) {
          console.log('sw: has already latest cache', version)
          const cacheStatus = 'latest'
          if (forceAddAll) cacheAddAll(manifest)
          return createJsonResponse(200, {version, cacheStatus})
        }
        console.log('sw: caching all assets...', version)
        return cacheAddAll(manifest).then(function () {
          console.log('sw: cache all done', version)
          const body = manifest
          body.cacheStatus = (keys && keys.length > 0) ? 'updated' : 'installed'
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
      cache.open周りのエラー
        読み込みできない -> そもそもonFetchでネットワーク経由だけになってるはず
        書き込みできない -> ネットワークエラーかどうか、現cacheを全部削除して様子見？
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

function cacheIsFresh(res) {
  const url = new URL(res.url)
  if (!isMyHost(url)) return true

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const cachedDate = new Date(dateStr)
  const now = new Date()
  const cacheTime = 60 * 1000 // 60 sec
  const isFresh = (now - cachedDate < cacheTime)
  // console.log('sw: cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  if (!isFresh) {
    console.log('sw: cache is not fresh', res.url, cachedDate, (now - cachedDate) / 1000)
  }
  return isFresh
}

function respondFromCache ({req, fetchIfNotCached}) {
  let tryFetched = false

  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }
  return caches.match(req).then(function (res) {
    if (res) {
      if (cacheIsFresh(res)) {
        return res
      } else {
        deleteAllCache() // 古いキャッシュを全部クリア
        res = null
      }
    }
    if (!fetchIfNotCached) return res
    console.log('sw: fetch', req.url)
    tryFetched = true
    return fetch(req)
  }).catch(function (err) {
    if (!tryFetched && fetchIfNotCached) return fetch(req)
    if (err instanceof TypeError && err.message === 'Failed to fetch') return
    throw (err)
  })
}

this.addEventListener('fetch', function (event) {
  const req = event.request

  if (isCacheUpdateApiRequest(req)) {
    event.respondWith(respondCacheUpdateApi(req))
    return
  }

  if (['reload', 'no-cache', 'no-store'].includes(req.cache)) { // reloaded on browser
    console.log('sw: reload request', req.url, req.cache)
    event.respondWith(
      fetch(req).then(function (res) {
        console.log('sw: fetched, so clear all cache')
        deleteAllCache()
        return res
      }).catch(function (err) {
        return respondFromCache({req, fetchIfNotCached: false})
      })
    )
    return
  }

  event.respondWith(respondFromCache({req, fetchIfNotCached: true}))
})

