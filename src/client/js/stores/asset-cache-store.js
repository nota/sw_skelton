const debug = require('../lib/debug')(__filename)

import request from 'superagent'
import {setVersion, getVersion} from '../lib/version'
import {EventEmitter} from 'events'

export default new class AssetCacheStore extends EventEmitter {
  constructor () {
    super()
    this._newVersion = null
  }

  currentVersion () {
    return getVersion()
  }

  checkForUpdateAutomatically () {
    setInterval(this.checkForUpdate.bind(this), 10 * 1000)
    this.checkForUpdate()
  }

  async checkForUpdate () {
    // XXX: もしこのコードが正常に動いていない場合にservice worker自体を殺すためのフラグ
    const reportDone = () => { window.checkVersionDone = true }
    const reportError = () => { window.checkVersionDone = false }

    const currentVersion = await this.currentVersion()
    reportDone() // ここまで到達したことをマークする

    debug('checking...')
    let response
    try {
      response = await request
                        .get('/api/assets/version')
                        .timeout({response: 30000, deadline: 30000})
    } catch (err) {
      debug('Can not fetch the latest version')
      if (err.status) {
        reportError() // オフライン以外の理由ならヤバイ
        throw(err)
      }
      return
    }

    const newVersion = response.body.version
    this._newVersion = newVersion

    debug('remote:', newVersion, 'current:', currentVersion)

    const isUpdateFound = (newVersion !== currentVersion)
    if (!isUpdateFound) {
      return debug('no update')
    }

    debug('new updated is found')
    try {
      debug('cache all new version')
      await request.get('/api/assets/cacheall')
    } catch (err) {
      console.error('Can not cache all', err)
      if (err.status) {
        reportError() // オフライン以外の理由ならヤバイ
        throw(err)
      }
      return
    }

    debug('done')
    if (!currentVersion) return debug('save initial version in DB')

    this.emit('change')
  }

  async updateNow () {
    debug('update now')
    await setVersion(this._newVersion)
    window.location.reload()
  }
}()

