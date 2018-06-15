/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import {EventEmitter} from 'events'
import {checkForUpdate, isNewCacheAvailable} from '../../../serviceworker/caches'

export default new class AssetsCacheStore extends EventEmitter {
  constructor () {
    super()
    this._newerVersion = null
    this.timeOfUpdateFound = null
    this.forceUpdateTimer = null

    this.forceUpdate = this.forceUpdate.bind(this)
    this.watchCacheStore = this.watchCacheStore.bind(this)

    setInterval(this.watchCacheStore, 1000)
  }

  get myVersion() {
    return document.documentElement.dataset.version
  }

  get newerVersion() {
    return this._newerVersion
  }

  async checkForUpdate () {
    const newKeys = await checkForUpdate()
    if (newKeys) {
      this._newerVersion = newKeys
      this.emit('change')
    }
  }

  hasUpdate () {
    return this.newerVersion && this.newerVersion !== this.myVersion
  }

  async watchCacheStore () {
//    debug('watchCacheStore')
    const newKeys = await isNewCacheAvailable(this.myVersion)
    if (newKeys) {
      this._newerVersion = newKeys
      this.emit('change')
    }

//    if (this.hasUpdate() && !this.forceUpdateTimer) {
//      this.forceUpdateTimer = setTimeout(this.forceUpdate, 10 * 1000)
//    }
  }

  forceUpdate () {
    if (document.visibilityState === 'visible') {
      return setTimeout(this.forceUpdate, 1000)
    }
    debug('forceUpdate')
    location.reload()
  }
}()

