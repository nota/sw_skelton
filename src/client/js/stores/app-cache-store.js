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

  checkForUpdateAutomatically ({showAlert} = {showAlert: false}) {
    debug('checkForUpdateAutomatically')
    if (this.timerId) return
    this.timerId = setInterval(this.checkForUpdate, CHECK_INTERVAL)
    this.checkForUpdate({showAlert})
  }

  stop () {
    if (this.timerId) clearInterval(this.timerId)
    this.timerId = null
  }

  async checkForUpdate ({showAlert} = {showAlert: false}) {
    reportDone() // ここまで到達したことをマークする

    debug('checking...')

    ServiceWorkerLauncher.update()

    let response
    try {
      response = await request
                        .get('/_serviceworker/cache_update')
    } catch (err) {
      console.error(err)
      if (showAlert && confirm('Can not check lastest version. Do you want to reload?')) {
        location.reload()
      }
      return
    }

    const {version, cacheStatus} = response.body

    debug('cacheStatus', cacheStatus, ', version', version)
    this.version = version
    this.cacheStatus = cacheStatus
    if (cacheStatus === 'updated') {
      this.hasUpdate = true
    }
    this.emit('change')
  }
}()

