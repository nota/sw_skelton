/* eslint-env browser */

export async function isNewCacheAvailable (version) {
  if (await caches.has(version)) return false
  const date = getDateFromCacheKey(version)
  const keys = await caches.keys()
  for (const key of keys) {
    const cacheDate = getDateFromCacheKey(key)
    if (!cacheDate) continue
    if (cacheDate > date) return key
  }
  return false
}

function getDateFromCacheKey (key) {
  const m = key.match(/(\d{4})(\d{2})(\d{2})\-(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  const monthIndex = parseInt(m[2]) - 1
  return new Date(m[1], monthIndex, m[3], m[4], m[5], m[6])
}
