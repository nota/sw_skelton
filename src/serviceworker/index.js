/* global caches self URL fetch */
/* eslint-env browser */

require('babel-polyfill')

const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

const {deleteAllCache, deleteOldCache, checkForUpdate} = require('./caches')
const {isAppHtmlRequest, createAppHtmlRequest} = require('./single-page-request')

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
  const url = new URL(res.url)

  const dateStr = res.headers.get('date')
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const cachePeriod = isDebug() ? 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  // debug('cache info', res.url, cachedDate, (now - cachedDate) / 1000)
  return (now - date > cachePeriod)
}

async function respondAppHtml (req) {
  req = createAppHtmlRequest(req)
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

