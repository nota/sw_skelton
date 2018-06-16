const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

function getDateFromCacheKey (key) {
  const m = key.match(/(\d{4})(\d{2})(\d{2})\-(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  const monthIndex = parseInt(m[2]) - 1
  return new Date(m[1], monthIndex, m[3], m[4], m[5], m[6])
}

async function updateCache ({version, assets}) {
  debug('updating cache...')
  const cache = await caches.open(version)
  await cache.addAll(assets)
  debug('add all cache done', version)
  await deleteOldCache(version)
  debug('updating cache done')
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
  if (!manifest) return null
  if (await caches.has(manifest.version)) {
    debug('already up-to-date')
    return null
  }
  return updateCache(manifest)
}

async function isNewCacheAvailable (version) {
  const date = getDateFromCacheKey(version)
  const keys = await caches.keys()
  for (const key of keys) {
    const cacheDate = getDateFromCacheKey(key)
    if (!cacheDate) continue
    if (cacheDate > date) return key
  }
  return false
}

module.exports = {deleteAllCache, deleteOldCache, checkForUpdate, isNewCacheAvailable}


