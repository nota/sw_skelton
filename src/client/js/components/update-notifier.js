/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppCacheStore from '../stores/app-cache-store'
import ServiceWorker from '../lib/serviceworker-utils'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export default class UpdateNotifier extends Component {
  constructor (props) {
    super(props)

    const {hasUpdate} = AppCacheStore
    this.state = {hasUpdate}

    AppCacheStore.on('change', this.onAppVersionChanged.bind(this))
  }

  async componentDidMount () {
    if (ServiceWorker.isEnabled) {
      AppCacheStore.checkForUpdateAutomatically()
    }
    this.mountedAt = Date.now()
  }

  shouldReload () {
    const previousVersion = AppCacheStore.previousVersion
    const lastUpdated = previousVersion ? previousVersion.updated : Date.now()

    // この前に更新したのが、1週間以上前または
    // 更新にかかった時間が3秒以内の速いネットワークに限定
    debug('time from mount (sec)', (Date.now() - this.mountedAt) / SECOND)
    debug('time from last update (sec)', (Date.now() - lastUpdated) / SECOND)

    if (Date.now() - this.mountedAt < 3 * SECOND) {
      return true
    }
    if (Date.now() - lastUpdated > 7 * DAY) {
      return true
    }
    // または24時間以上開きっぱなしのWindowである
    if (Date.now() - this.mountedAt > DAY) {
      return true
    }
    // TODO: またはprotocol-versionがあがってる
    // if (AppCacheStore.protocolVersionMismatch()) {
    //   return true
    // }
  }

  onAppVersionChanged () {
    const {hasUpdate} = AppCacheStore
    this.setState({hasUpdate})

    if (!hasUpdate) return

    if (this.shouldReload()) {
      this.reload()
    }
  }

  reload () {
    const elm = document.getElementById('cont')
    elm.className = elm.className + ' reload'
    setTimeout(() => { window.location.reload() }, 1000)
  }

  onClickUpdate () {
    this.reload()
  }

  render () {
    if (!this.state.hasUpdate) return null

    return (
      <div className='update-alert-bar' onClick={this.onClickUpdate.bind(this)}>
        <a>Update found!</a>
      </div>
    )
  }
}
