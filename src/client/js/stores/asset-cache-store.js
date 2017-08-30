const debug = require('../lib/debug')(__filename)

import request from 'superagent'
import {getVersion} from '../lib/version'
import {EventEmitter} from 'events'

// XXX: もしこのコードが正常に動いていない場合にservice worker自体を殺すためのフラグ
const reportDone = () => { window.checkVersionDone = true }
const reportError = () => { window.checkVersionDone = false }

export default new class AssetCacheStore extends EventEmitter {
  currentVersion () {
    return getVersion()
  }

  checkForUpdateAutomatically () {
    setInterval(this.checkForUpdate.bind(this), 10 * 1000)
    this.checkForUpdate()
  }

  async fetch () {
    debug('checking...')
    let response
    try {
      response = await request.get('/api/assets/version')
    } catch (err) {
      debug('Can not fetch the latest version')
      if (err.status) {
        reportError() // オフライン以外の理由ならヤバイ
        throw (err)
      }
      return
    }

    return response.body.version
  }

  async cacheall () {
    try {
      debug('cache all new version')
      await request.get('/api/assets/cacheall')
      debug('done')
    } catch (err) {
      console.error('Can not cache all', err)
      if (err.status) {
        reportError() // オフライン以外の理由ならヤバイ
        throw (err)
      }
      return false
    }
    return true
  }

  async checkForUpdate () {
    const currentVersion = await this.currentVersion()
    reportDone() // ここまで到達したことをマークする

    const newVersion = await this.fetch()
    if (!newVersion) return

    debug('remote:', newVersion, 'current:', currentVersion)
    if (newVersion === currentVersion) return

    debug('new updated is found')
    const result = await this.cacheall()
    if (!result) return
    if (currentVersion) this.emit('change')
  }

  // new versionが取得できてる場合に使う(web socketベースの実装とかによい)
  async updateNow (newVersion) {
    const currentVersion = await this.currentVersion()

    debug('remote:', newVersion, 'current:', currentVersion)
    if (newVersion === currentVersion) return

    debug('new updated is found')
    const result = await this.cacheall()
    if (!result) return
    if (currentVersion) this.emit('change')
  }
}()

