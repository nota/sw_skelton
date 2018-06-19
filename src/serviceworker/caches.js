/* eslint-env browser */

const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker:caches', 'color: gray', ...msg)

async function updateCache ({version, paths}) {
  debug('adding all cache...')
  const cache = await caches.open(version)
  await cache.addAll(paths)
  debug('add all cache done', version)
  await deleteOldCache(version)
  debug('updating cache done')
  return {version}
}

async function deleteAllCache () {
  debug('delete all cache')
  const keys = await caches.keys()
  return Promise.all(keys.map(key => caches.delete(key)))
}

async function deleteOldCache (currentVersion) {
  const keys = await caches.keys()
  return Promise.all(keys
    .filter(key => key !== currentVersion)
    .map(key => {
      debug('delete old cache', key)
      return caches.delete(key)
    })
  )
}

async function fetchAssetsJson () {
  debug('fetching assets.json...')
  const res = await fetch('/assets/assets.json')
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.clone().json()
}

async function checkForUpdate () {
  debug('checking for update...')
  if (!navigator.onLine) {
    debug('offline')
    return
  }

  const assets = await fetchAssetsJson()
  if (await caches.has(assets.version)) {
    debug('already up-to-date')
    return
  }
  return updateCache(assets)
}

module.exports = {deleteAllCache, checkForUpdate}
