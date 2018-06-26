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
  event.waitUntil(Promise.all([
    self.clients.claim(),
    checkForUpdate()
  ]))
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
  // XXXX: app.html へのrequestを組み立てる
  req = createSinglePageRequest(req)
  const res = await caches.match(req)
  if (!res) {
    // XXXX: いまのscrapboxでは毎回ここが実行されている状態
    // そして、app.htmlが存在しないので404?
    // projectName="app.html" と解釈されているはず
    console.log("!res", req)
    return fetch(req)
  }

  // app.htmlを作れないとなると、以降の期限切れ処理をどこかに移さないといけない
  // respondCacheFirst の後に checkForUpdate しているので古いのは勝手に消えるから以下は不要?
  // app.htmlに相当するものをcacheしていないので、初期画面は毎回network accessになるので、古い可能性がない
  // const outdated = cacheIsOutdated(res)
  // if (!outdated) {
  //   debug('use cache', req.url, req.cache)
  //   setTimeout(checkForUpdate, 1000)
  //   return res
  // }

  // debug('cache is outdated', '(fetch remote)', req.url, req.cache)
  // let remoteRes
  // try {
  //   remoteRes = await fetch(req)
  //   if (!remoteRes.ok) throw new Error(`Responded ${res.status}`)
  // } catch (err) {
  //   console.error(err)
  //   debug('use cache anyway', req.url, req.cache)
  //   return res
  // }

  // const headerName = 'x-assets-version'
  // const version = res.headers.get(headerName)
  // if (version === remoteRes.headers.get(headerName)) {
  //   debug('version is not changed', 'so just replace cache to new one')
  //   const cache = await caches.open(version)
  //   await cache.put(req, remoteRes.clone())
  // } else {
  //   debug('fetched different version')
  //   await deleteAllCache()
  //   setTimeout(checkForUpdate, 1000)
  // }
  // return remoteRes
}

async function respondCacheFirst (req) {
  const res = await caches.match(req)
  if (res) {
    debug('* use cache', req.url, req.cache)
    if (req.url.match(/\/index\.js$/)) {
      debug('checkForUpdate')
      setTimeout(checkForUpdate, 2000)
    }
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
  const client = event.ports[0]
  // https://gyazo.com/9b77c7d2da7c9ab8e63c602cab220a18
  // debug(event.ports)

  event.waitUntil(async function () {
    if (event.data !== 'checkForUpdate') return
    let ret
    try {
      ret = await checkForUpdate()
    } catch (err) {
      console.error(err.stack || err)
      ret = {error: err.message}
    }
    client.postMessage(ret)
  }())
})

