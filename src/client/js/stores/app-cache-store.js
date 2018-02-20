/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import request from 'superagent'
import {EventEmitter} from 'events'
import ServiceWorkerLauncher from '../lib/serviceworker-launcher'

export default new class AppCacheStore extends EventEmitter {
  constructor () {
    super()
    this.currentVersion = document.documentElement.dataset.version
    this.cachedVersion = null
    this.cacheStatus = null
    this.timeOfUpdateFound = null
    this.timerId = null

    setInterval(this.watchCacheStore.bind(this), 1000)
  }

  hasNewerVersion () {
    return this.cachedVersion && this.cachedVersion !== this.currentVersion
  }

  async watchCacheStore () {
    const keys = await caches.keys()
    const cachedKey = keys.find(key => key.indexOf('app-') === 0)
    const cachedVersion = cachedKey && cachedKey.match(/app\-(.*)\-.*/)[1]

    // debug('checkForUpdate', this.currentVersion, cachedKey, cachedVersion)

    if (this.cachedVersion != cachedVersion) {
      this.timeOfUpdateFound = cachedVersion ? new Date() : null
      this.cachedVersion = cachedVersion
      this.emit('change')
    }
  }
}()

