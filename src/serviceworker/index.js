/* global caches self URL fetch */
/* eslint-env browser */

require('babel-polyfill')
const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

debug('start')

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

const POSTFIX = '-v1' // XXX 緊急時は、このpostfixを上げることで全キャッシュを無効化できる

self.addEventListener('install', function (event) {
  debug('install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  debug('activate')
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
  // req.cache=only-if-cachedのとき`*/*`が来るので注意
  return accept && (accept.includes('text/html') || accept === '*/*')
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

function cacheKey (version) {
  return `app-${version}${POSTFIX}`
}

async function deleteOldCache (currentVersion) {
  const keys = await caches.keys()
  return Promise.all(keys
    .filter(key => key !== cacheKey(currentVersion))
    .map(key => {
      debug('delete old cache', key)
      caches.delete(key)
    })
  )
}

async function deleteAllCache () {
  debug('delete all cache')
  const keys = await caches.keys()
  return Promise.all(keys.map(key => caches.delete(key)))
}

async function cacheAddAll ({version, assets}) {
  const cache = await caches.open(cacheKey(version))
  await cache.addAll(assets)
  return deleteOldCache(version)
}

async function updateCache (manifest) {
  const {version} = manifest
  const keys = await caches.keys()
  if (keys && keys.includes(cacheKey(version))) {
    debug('already up-to-date')
    return
  }
  debug('updating cache...')
  await cacheAddAll(manifest)
  debug('updating cache done', version)
}

async function fetchManifest () {
  debug('fetching manifest...')
  const url = location.origin + '/api/caches/manifest'
  const req = new Request(url, { method: 'get' })
  try {
    const res = await fetch(req)
    if (!res.ok) throw new Error(`Server responded ${res.status}`)
    return res.clone().json()
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      debug('failed to fetch manifest, offline?')
      return null
    }
    throw (err)
  }
}

async function checkForUpdate () {
  const manifest = await fetchManifest()
  if (manifest) return updateCache(manifest)
}

function appHtmlRequest (req) {
  const url = new URL(req.url).origin + '/app.html'
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    credentials: req.credentials,
    cache: req.cache,
    mode: 'same-origin', // need to set this properly
    redirect: 'manual'   // let browser handle redirects
  })
}

function cacheIsValid (res) {
  const url = new URL(res.url)
  if (!isMyHost(url)) return true

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const cachedDate = new Date(dateStr)
  const now = new Date()
  const cacheTime = isDebug() ? 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  // debug('cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - cachedDate < cacheTime)
}

async function respondRemoteFirst (req) {
  if (isAppHtmlRequest(req)) {
    debug('app reload request', req.url, req.cache)
    req = appHtmlRequest(req)
  }

  try {
    debug('fetch remote', req.url, req.cache)
    const res = await fetch(req)
    const version = res.headers.get('x-app-version')
    if (version) await deleteOldCache(version)
    return res
  } catch (err) {
    return caches.match(req)
  }
}

async function respondCacheFirst (req) {
  if (isAppHtmlRequest(req)) {
    req = appHtmlRequest(req)
  }

  let expiredCache
  const res = await caches.match(req)
  if (res) {
    if (cacheIsValid(res)) {
      debug('use cache (valid)', req.url, req.cache)
      return res
    } else {
      expiredCache = res
    }
  }
  if (req.cache === 'only-if-cached') {
    // XXX: ChromeのprerenderやFirefoxのaddAll時に呼ばれることがある
    // キャッシュが存在しないときに504を返すのは、RFCの既定
    debug('use cache (only-if-cached)', req.url, req.cache, !!res)
    return res || new Response('No Cache', {status: 504, statusText: 'Gateway Timeout'})
  }

  try {
    debug('fetch remote', req.url, req.cache)
    const res = await fetch(req)
    if (expiredCache) await deleteAllCache()
    return res
  } catch (err) {
    if (expiredCache) {
      debug('use cache (expired)', req.url, req.cache)
      return expiredCache
    }
    throw err
  }
}

self.addEventListener('fetch', async function (event) {
  event.respondWith(async function () {
    const req = event.request
    const browserReloadFlags = ['reload', 'no-cache']
    if (browserReloadFlags.includes(req.cache)) {
      return respondRemoteFirst(req)
    }

    return respondCacheFirst(req)
  }())
})

self.addEventListener('message', function (event) {
  if (event.data === 'checkForUpdate') {
    debug('message', event.data)
    checkForUpdate()
  }
})

setInterval(checkForUpdate, isDebug() ? 10 * 1000 : 10 * 60 * 1000)
