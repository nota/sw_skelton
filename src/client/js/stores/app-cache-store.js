/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import request from 'superagent'
import {EventEmitter} from 'events'

// XXX: もしこのコードが正常に動いていない場合にservice worker自体を殺すためのフラグ
const reportDone = () => { window.checkVersionDone = true }

export default new class AppCacheStore extends EventEmitter {
  constructor () {
    super()
    this.version = null
    this.previousVersion = null
    this.hasUpdate = false
    this.timerId = null
  }

  checkForUpdateAutomatically () {
    if (this.timerId) return
    this.timerId = setTimeout(this.checkForUpdate.bind(this), 10 * 1000)
    this.checkForUpdate()
  }

  stop () {
    clearInterval(this.timerId)
    this.timerId = null
  }

  async checkForUpdate () {
    reportDone() // ここまで到達したことをマークする

    debug('checking...')
    let response
    try {
      response = await request.get('/api/caches/update')
    } catch (err) {
      if (err.status === 500) {
        // service workerから渡されたエラー
        const {name, message} = err.response.body
        throw new Error(`${name}: ${message}`)
      } else {
        throw err
      }
    } finally {
      if (this.timerId) {
        this.timerId = setTimeout(this.checkForUpdate.bind(this), 10000)
      }
    }

    const {version, cacheStatus, previousVersion} = response.body

    if (!cacheStatus) {
      // service workerが動いていない（強制リロードか？）
      await this.deleteAllCache()
    }

    this.version = version

    debug('cacheStatus', cacheStatus, ', version', version)
    if (cacheStatus === 'updated') {
      if (previousVersion.version) {
        debug('updated', 'previousVersion', previousVersion)
        this.previousVersion = previousVersion
        this.hasUpdate = true
      }
    }
    this.emit('change')
  }

  async deleteAllCache () {
    debug('delete all cache')
    const keys = await caches.keys()
    await Promise.all(keys.map(key => caches.delete(key)))
  }
}()

