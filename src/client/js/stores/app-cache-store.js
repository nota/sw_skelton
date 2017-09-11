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
  }

  checkForUpdateAutomatically () {
    if (this.timerId) return
    this.timerId = setInterval(this.checkForUpdate.bind(this), 10 * 1000)
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
        const err = new Error(err.response.body.name)
        err.message = err.response.body.message
        throw err
      } else {
        throw err
      }
    }

    const {version, cacheStatus, previousVersion} = response.body

    this.version = version
    this.previousVersion = previousVersion

    debug('cacheStatus', cacheStatus, ', version', version)
    if (cacheStatus === 'updated'){
      if (previousVersion.version) {
        debug('updated', 'previousVersion', previousVersion)
        this.hasUpdate = true
      }
    }
    this.emit('change')
  }
}()

