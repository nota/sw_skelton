const isDebug = () => location && location.hostname === 'localhost'
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

async function updateCache ({version, assets}) {
  debug('updating cache...')
  const cache = await caches.open(version)
  await cache.addAll(assets)
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

async function fetchManifest () {
  debug('fetching assets manifest...')
  const url = location.origin + '/json/assets-list.json'
  const req = new Request(url, { method: 'get' })
  const res = await fetch(req)
  if (!res.ok) throw new Error(`Server responded ${res.status}`)
  return res.clone().json()
}

async function checkForUpdate () {
  debug('check for update...')
  if (!navigator.onLine) {
    debug('offline')
    return
  }

  const manifest = await fetchManifest()
  if (await caches.has(manifest.version)) {
    debug('already up-to-date')
    return
  }
  return updateCache(manifest)
}

module.exports = {deleteAllCache, checkForUpdate}


