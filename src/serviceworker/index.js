/* global caches self URL fetch */
/* eslint-env browser */

require('babel-polyfill')

const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

const {deleteAllCache, deleteOldCache, checkForUpdate} = require('./caches')

debug('start')

const NOCACHE_PATHS = [
  '/serviceworker.js',
  '/api/'
]

const ASSET_PATHS = [
  '/css/',
  '/img/',
  '/fonts/',
  '/json/',
  '/app.html',
  '/index.js'
]

const THIRDPARTY_ASSET_HOSTS = [
  'maxcdn.bootstrapcdn.com'
]

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

function cacheIsOutdated (res) {
  const url = new URL(res.url)

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const cachePeriod = isDebug() ? 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  // debug('cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - date > cachePeriod)
}

async function respondRemoteFirst (req) {
  const isAppHtml = isAppHtmlRequest(req)
  if (isAppHtml) {
    debug('app reload request', req.url, req.cache)
    req = appHtmlRequest(req)
  }

  try {
    debug('fetch remote', req.url, req.cache)
    const res = await fetch(req)
//    const version = res.headers.get('x-app-version')
//    if (version) await deleteOldCache(version)
    if (isAppHtml) checkForUpdate()
    return res
  } catch (err) {
    return caches.match(req)
  }
}

async function respondAppHtml (req) {
  req = appHtmlRequest(req)
  const res = await caches.match(req)
  if (!res) {
    setTimeout(checkForUpdate, 1000)
    return fetch(req)
  }
  const outdated = cacheIsOutdated(res)
  if (!outdated) {
    debug('use cache', req.url, req.cache)
    setTimeout(checkForUpdate, 1000)
    return res
  }
  debug('cache is outdated', '(fetch remote)', req.url, req.cache)
  let res2
  try {
    res2 = await fetch(req)
  } catch (err) {
    console.error(err)
    debug('use cache anyway', req.url, req.cache)
    return res
  }

  const version = res2.headers.get('x-app-version')
  const isNewVersionAvailable = res.headers.get('x-app-version') !== version
  if (isNewVersionAvailable) {
    debug('fetched new version')
    await deleteAllCache()
    setTimeout(checkForUpdate, 1000)
  } else if (res2.ok) {
    debug('version is not changed', 'so just replace cache to new one')
    const cache = await caches.open(version)
    await cache.put(req, res2.clone())
  }
  return res2
}

async function respondCacheFirst (req) {
  if (isAppHtmlRequest(req)) {
    return respondAppHtml(req)
  }

  const res = await caches.match(req)
  if (res) {
    debug('use cache', req.url, req.cache)
    return res
  }
  // XXX: ChromeのprerenderやFirefoxのaddAll時に呼ばれることがある
  // キャッシュが存在しないときに504を返すのは、RFCの既定
  if (req.cache === 'only-if-cached') {
    debug('use cache (only-if-cached)', req.url, req.cache, !!res)
    return res || new Response('No Cache', {status: 504, statusText: 'Gateway Timeout'})
  }

  debug('fetch', req.url, req.cache)
  return fetch(req)
}

self.addEventListener('fetch', async function (event) {
  event.respondWith(async function () {
    const req = event.request
//    debug(req)
//    const browserReloadFlags = ['reload', 'no-cache']
//    const browserReloadFlags = ['no-cache']
//    if (browserReloadFlags.includes(req.cache)) {
//      return respondRemoteFirst(req)
//    }

    return respondCacheFirst(req)
  }())
})

self.addEventListener('message', function (event) {
  if (event.data === 'checkForUpdate') {
    debug('message', event.data)
    checkForUpdate()
  }
})

