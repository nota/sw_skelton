/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import {EventEmitter} from 'events'
import {isNewCacheAvailable, cacheExists} from '../lib/cache-watch'

export default new class AssetsCacheStore extends EventEmitter {
  constructor () {
    super()
    this._newerVersion = null
    this._isMyVersionCached = false

    this.watchCacheStore = this.watchCacheStore.bind(this)
    setInterval(this.watchCacheStore, 1000)
  }

  get myVersion () {
    return document.documentElement.dataset.version
  }

  get isMyVersionCached () {
    return this._isMyVersionCached
  }

  get newerVersion () {
    return this._newerVersion
  }

  hasUpdate () {
    return !!this._newerVersion
  }

  async watchCacheStore () {
//    debug('watchCacheStore')
    const newKeys = await isNewCacheAvailable(this.myVersion)
    const isMyVersionCached = await cacheExists(this.myVersion)
    if (newKeys) {
      this._newerVersion = newKeys
      this._myVersionIsCached =
      this.emit('change')
    }
    if (this._isMyVersionCached !== isMyVersionCached) {
      this._isMyVersionCached = isMyVersionCached
      this.emit('change')
    }
  }
}()

