const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

const POSTFIX = '-v1' // XXX 緊急時は、このpostfixを上げることで全キャッシュを無効化できる

function cacheKey (version) {
  return `app-${version}${POSTFIX}`
}

async function deleteAllCache () {
  debug('delete all cache')
  const keys = await caches.keys()
  return Promise.all(keys.map(key => caches.delete(key)))
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

module.exports = {deleteAllCache, deleteOldCache, updateCache}


