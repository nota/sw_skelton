/* eslint-env browser */

export async function hasNewVersionCache (version) {
  const date = getDateFromCacheKey(version)
  const keys = await caches.keys()
  for (const key of keys) {
    const cacheDate = getDateFromCacheKey(key)
    if (!cacheDate) continue
    if (cacheDate > date && await cacheExists(key)) return key
  }
  return false
}

export async function cacheExists (key) {
  if (!(await caches.has(key))) return false
  const cache = await caches.open(key)
  return (await cache.keys()).length > 0
}

function getDateFromCacheKey (key) {
  const m = key.match(/(\d{4})(\d{2})(\d{2})\-(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  const monthIndex = parseInt(m[2]) - 1
  return new Date(m[1], monthIndex, m[3], m[4], m[5], m[6])
}
