/* global caches self URL fetch */
/* eslint-env browser */

require('babel-polyfill')
const debug = (...msg) => location && location.hostname === 'localhost' && console.log('%cserviceworker', 'color: gray', ...msg)

debug('hello')

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
let timerId

self.addEventListener('install', function (event) {
  debug('install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  debug('activate')
  event.waitUntil(self.clients.claim())
})

function isDeactivated () {
  return !timerId
}

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

function cacheKey (version) {
  return `app-${version}${POSTFIX}`
}

async function deleteOldCache (currentVersion) {
  const keys = await caches.keys()
  return Promise.all(keys
    .filter(key => key !== cacheKey(currentVersion))
    .map(key => {
      debug('delete old cache', key)
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

async function updateCache (manifest) {
  const {version} = manifest
  const keys = await caches.keys()
  if (keys && keys.includes(cacheKey(version))) {
    debug('up to date', version)
    return
  }
  await cacheAddAll(manifest)
  debug('new cache added', version)
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
    if (err instanceof TypeError && err.message === 'Failed to fetch'){
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
    mode: 'same-origin', // need to set this properly
    redirect: 'manual'   // let browser handle redirects
  })
}

function cacheIsValid(res) {
  const url = new URL(res.url)
  if (!isMyHost(url)) return true

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const cachedDate = new Date(dateStr)
  const now = new Date()
  const cacheTime = 60 * 1000 // 60 sec
  // debug('cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - cachedDate < cacheTime)
}

async function respondFetchFirst (req) {
  debug('fetch on reload', req.url, req.cache)

  if (isAppHtmlRequest(req)) {
    req = appHtmlRequest(req)
  }

  try {
    debug('fetch', req.url, req.cache)
    const res = await fetch(req)
    await deleteAllCache()
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
      debug('use cache (valid)', req.url)
      return res
    } else {
      expiredCache = res
    }
  }

  try {
    debug('fetch', req.url, req.cache)
    const res = await fetch(req)
    if (expiredCache) await deleteAllCache()
    return res
  } catch (err) {
    if (expiredCache) {
      debug('use cache (expired)', req.url)
      return expiredCache
    }
    throw err
  }
}

self.addEventListener('fetch', async function (event) {
  event.respondWith(async function () {
    const req = event.request

    const browserReloadFlags = ['reload', 'no-cache', 'no-store']
    if (browserReloadFlags.includes(req.cache)) {
      return respondFetchFirst(req)
    }

    return respondCacheFirst(req)
  }())
})

function startAutoUpdate () {
  if (timerId) return
  timerId = setInterval(checkForUpdate, 10 * 1000)
}

async function stopAutoUpdate () {
  await deleteAllCache()
  if (timerId) clearInterval(timerId)
  timerId = null
}

self.addEventListener('message', function (event) {
  debug('message', event.data)
  switch (event.data) {
    case 'reactivate':
      startAutoUpdate()
      break
    case 'deactivate':
      stopAutoUpdate()
      break
    case 'checkForUpdate':
      if (isDeactivated()) return
      checkForUpdate()
      break
  }
})

startAutoUpdate()
