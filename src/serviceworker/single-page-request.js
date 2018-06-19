/* eslint-env browser */

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

function isMyHost (url) {
  return location.hostname === url.hostname
}

function isApiOrLandingPage (url) {
  return isMyHost(url) && NOCACHE_PATHS.find(function (path) {
    return url.pathname.indexOf(path) === 0
  })
}

function isAssetPath (url) {
  return isMyHost(url) && ASSET_PATHS.find(function (path) {
    return url.pathname.indexOf(path) === 0
  })
}

function isAcceptHtml (req) {
  const accept = req.headers.get('Accept')
  // req.cache=only-if-cachedのとき`*/*`が来るので注意
  return accept && (accept.includes('text/html') || accept === '*/*')
}

function isGetMethod (req) {
  return req.method === 'GET'
}

function isSinglePageRequest (req) {
  const url = new URL(req.url)

  return (
    isMyHost(url) &&
    !isAssetPath(url) &&
    !isApiOrLandingPage(url) &&
    isGetMethod(req) &&
    isAcceptHtml(req)
  )
}

function createSinglePageRequest (req) {
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

module.exports = {isSinglePageRequest, createSinglePageRequest}

