/* global caches self URL fetch */
/* eslint-env browser */

require('babel-polyfill')

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

self.addEventListener('install', function (event) {
  console.log('sw: install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  console.log('sw: activate')
  event.waitUntil(self.clients.claim())
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

function isCheckForUpdateRequest (req) {
  const url = new URL(req.url)
  const path = '/_serviceworker/check_for_update'
  return isMyHost(url) && url.pathname === path
}

function cacheKey (version) {
  return version + POSTFIX
}

async function deleteOldCache (currentVersion) {
  const keys = await caches.keys()
  return Promise.all(keys
    .filter(key => key !== cacheKey(currentVersion))
    .map(key => {
      console.log('sw: delete old cache', key)
      caches.delete(key)}
    )
  )
}

async function deleteAllCache () {
  const keys = await caches.keys()
  return Promise.all(keys.map(key => caches.delete(key)))
}

async function cacheAddAll ({version, assets}) {
  const cache = await caches.open(cacheKey(version))
  await cache.addAll(assets)
  return deleteOldCache(version)
}

async function updateCache(manifest) {
  const {version} = manifest
  const keys = await caches.keys()
  if (keys && keys.includes(cacheKey(version))) {
    console.log('sw: has already latest cache', version)
    return 'latest'
  }
  console.log('sw: caching all assets...', version)
  await cacheAddAll(manifest)
  console.log('sw: cache all done', version)
  return (keys && keys.length > 0) ? 'updated' : 'installed'
}

async function respondCheckForUpdate () {
  console.log('sw: fetching manifest from server...')
  const url = location.origin + '/api/caches/manifest'
  const req = new Request(url, { method: 'get' })
  try {
    const res = await fetch(req)
    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    const manifest = await res.clone().json()
    const cacheStatus = await updateCache(manifest)
    return createJsonResponse(200, {version: manifest.version, cacheStatus})
  } catch (err) {
    const body = {
      name: err.name,
      message: err.message
    }
    console.error(err)
    return createJsonResponse(500, body)
  }
}

function createAppHtmlRequest (req) {
  const url = new URL(req.url).origin + '/app.html'
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    credentials: req.credentials,
    mode: 'same-origin', // need to set this properly
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

function cacheIsValid(res) {
  const url = new URL(res.url)
  if (!isMyHost(url)) return true

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const cachedDate = new Date(dateStr)
  const now = new Date()
  const cacheTime = 60 * 1000 // 60 sec
  console.log('sw: cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - cachedDate < cacheTime)
}

async function respondFetchFirst (req) {
  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }

  try {
    console.log('sw: fetch', req.url, req.cache)
    const res = await fetch(req)
    await deleteAllCache()
    return res
  } catch (err) {
    return caches.match(req)
  }
}

async function respondCacheFirst (req) {
  if (isAppHtmlRequest(req)) {
    req = createAppHtmlRequest(req)
  }

  let expiredCache
  const res = await caches.match(req)
  if (res) {
    if (cacheIsValid(res)) {
      return res
    } else {
      console.log('sw: cache expired', req.url)
      expiredCache = res
    }
  }

  try {
    console.log('sw: fetch', req.url, req.cache)
    const res = await fetch(req)
    if (expiredCache) await deleteAllCache()
    return res
  } catch (err) {
    if (expiredCache) return expiredCache
    throw err
  }
}

self.addEventListener('fetch', async function (event) {
  event.respondWith(async function () {
    const req = event.request

    if (isCheckForUpdateRequest(req)) {
      return respondCheckForUpdate(req)
    }

    const browserReloadFlags = ['reload', 'no-cache', 'no-store']
    if (browserReloadFlags.includes(req.cache)) {
      console.log('sw: reload fetch:', req.url, req.cache)
      return respondFetchFirst(req)
    }

    return respondCacheFirst(req)
  }())
})

