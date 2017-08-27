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
    const currentVersion = await getVersion()
    debug('checking...')
    let response
    try {
      response = await request.get('/api/assets/version')
    } catch (err) {
      return console.warn('Can not fetch the latest version')
    }
    const newVersion = response.body.version
    this._newVersion = newVersion

    debug('remote:', newVersion, 'current:', currentVersion)

    const isUpdateFound = (newVersion !== currentVersion)
    if (!isUpdateFound) return debug('no update')

    debug('new updated is found')
    try {
      debug('cache all new version')
      await request.get('/api/assets/cacheall')
    } catch (err) {
      return console.error('Can not cache all', err)
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

