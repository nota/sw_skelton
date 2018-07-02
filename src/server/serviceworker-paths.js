export const NOCACHE_PATHS = [
  '/serviceworker.js',
  '/api/'
]

export const ASSET_PATHS = [
  '/assets/',
  '/app.html',
  '/index.js'
]

// single-page-request.js から呼び出し可能にするため、
// browserifyにグローバル変数として扱ってもらう
global.NOCACHE_PATHS = NOCACHE_PATHS
global.ASSET_PATHS = ASSET_PATHS
