/* global caches self URL fetch */
/* eslint-env browser */

const isDebug = () => location && ['localhost', 'sw-skelton.herokuapp.com'].includes(location.hostname)
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

const {deleteAllCache, checkForUpdate} = require('./caches')
const {isSinglePageRequest, createSinglePageRequest} = require('./single-page-request')

debug('start')

self.addEventListener('install', function (event) {
  debug('install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  debug('activate')
  event.waitUntil(self.clients.claim())
})

function cacheIsOutdated (res) {
  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const cachePeriod = 30 * 24 * 60 * 60 * 1000 // isDebug() ? 60 * 1000
  // debug('cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - date > cachePeriod)
}

async function respondSinglePage (req) {
  req = createSinglePageRequest(req)
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
  let remoteRes
  try {
    remoteRes = await fetch(req)
    if (!remoteRes.ok) throw new Error(`Responded ${res.status}`)
  } catch (err) {
    console.error(err)
    debug('use cache anyway', req.url, req.cache)
    return res
  }

  const headerName = 'x-assets-version'
  const version = res.headers.get(headerName)
  if (version === remoteRes.headers.get(headerName)) {
    debug('version is not changed', 'so just replace cache to new one')
    const cache = await caches.open(version)
    await cache.put(req, remoteRes.clone())
  } else {
    debug('fetched different version')
    await deleteAllCache()
    setTimeout(checkForUpdate, 1000)
  }
  return remoteRes
}

async function respondCacheFirst (req) {
  const res = await caches.match(req)
  if (res) {
    debug('use cache', req.url, req.cache)
    return res
  }

  debug('fetch', req.url, req.cache)
  return fetch(req)
}

self.addEventListener('fetch', function (event) {
  event.respondWith(async function () {
    const req = event.request

    if (isSinglePageRequest(req)) {
      return respondSinglePage(req)
    }

    return respondCacheFirst(req)
  }())
})

self.addEventListener('message', function (event) {
  event.waitUntil(async function () {
    if (event.data !== 'checkForUpdate') return
    let ret
    try {
      ret = await checkForUpdate()
    } catch (err) {
      console.error(err)
      ret = {error: err.message}
    }
    event.ports[0].postMessage(ret)
  }())
})

