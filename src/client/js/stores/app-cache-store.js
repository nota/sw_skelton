/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import request from 'superagent'
import {EventEmitter} from 'events'
import ServiceWorkerLauncher from '../lib/serviceworker-launcher'

// XXX: もしこのコードが正常に動いていない場合にservice worker自体を殺すためのフラグ
const reportDone = () => { window.checkVersionDone = true }
const CHECK_INTERVAL = 10 * 1000

export default new class AppCacheStore extends EventEmitter {
  constructor () {
    super()
    this.version = null
    this.hasUpdate = false
    this.cacheStatus = null
    this.timerId = null

    this.checkForUpdate = this.checkForUpdate.bind(this)
  }

  checkForUpdateAutomatically () {
    debug('checkForUpdateAutomatically')
    if (this.timerId) return
    this.timerId = setTimeout(this.checkForUpdate, CHECK_INTERVAL)
    this.checkForUpdate()
  }

  stop () {
    clearInterval(this.timerId)
    this.timerId = null
  }

  async checkForUpdate () {
    reportDone() // ここまで到達したことをマークする

    debug('checking...')

    ServiceWorkerLauncher.update()

    let response
    try {
      response = await request
                        .get('/api/caches/update')
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
        clearInterval(this.timerId)
        this.timerId = setTimeout(this.checkForUpdate, CHECK_INTERVAL)
      }
    }

    const {version, cacheStatus} = response.body

    debug('cacheStatus', cacheStatus, ', version', version)

    if (!cacheStatus) {
      // service workerが正しく動いていないので、このプロパティが欠けている
      if (confirm('Can not check lastest version. Do you want to reload?')) {
        location.reload()
        return
      }
      this.stop() // 次のcheckでdelete cacheし続けないように停止
    }

    this.version = version
    this.cacheStatus = cacheStatus
    if (cacheStatus === 'updated') {
      this.hasUpdate = true
    }
    this.emit('change')
  }
}()

