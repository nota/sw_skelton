/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import {EventEmitter} from 'events'
import {hasNewVersionCache, cacheExists} from '../lib/cache-watch'

export default new class AssetsCacheStore extends EventEmitter {
  constructor () {
    super()
    this._newVersion = null
    this._hasCache = false

    this.watchCacheStore = this.watchCacheStore.bind(this)
    this.watchCacheStore()
    setInterval(this.watchCacheStore, 1000)
  }

  get version () {
    return ASSETS_VERSION
  }

  hasCache () {
    return this._hasCache
  }

  get newVersion () {
    return this._newVersion
  }

  hasUpdate () {
    return !!this._newVersion
  }

  async watchCacheStore () {
//    debug('watchCacheStore')
    const newVersion = await hasNewVersionCache(this.version)
    const hasCache = await cacheExists(this.version)
    if (newVersion) {
      this._newVersion = newVersion
      this.emit('change')
    }
    if (this._hasCache !== hasCache) {
      this._hasCache = hasCache
      this.emit('change')
    }
  }
}()

