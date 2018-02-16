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
    this.hasUpdate = false
    this.timerId = null
  }

  checkForUpdateAutomatically (options) {
    if (this.timerId) return
    this.timerId = setTimeout(
      this.checkForUpdate.bind(this),
      10 * 1000)
    this.checkForUpdate(options)
  }

  stop () {
    clearInterval(this.timerId)
    this.timerId = null
  }

  async checkForUpdate (options) {
    reportDone() // ここまで到達したことをマークする

    debug('checking...')
    let response
    try {
      response = await request
                        .get('/api/caches/update')
                        .query(options)
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
        this.timerId = setTimeout(
          this.checkForUpdate.bind(this),
          10 * 1000)
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
    if (cacheStatus === 'updated') {
      this.hasUpdate = true
    }
    this.emit('change')
  }
}()

