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

async function fetchManifest () {
  debug('fetching assets manifest...')
  const url = location.origin + '/json/assets-list.json'
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
  debug('check for update...')
  const manifest = await fetchManifest()
  if (manifest) return updateCache(manifest)
}

async function isNewCacheAvailable (version) {
  const date = getDateFromCacheKey(key)
  const keys = await caches.keys()
  for (const key of keys) {
    const cacheDate = getDateFromCacheKey(key)
    if (cacheDate > date) return true
  }
  return false
}

module.exports = {deleteAllCache, deleteOldCache, checkForUpdate}


