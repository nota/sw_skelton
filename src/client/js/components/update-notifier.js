const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppVersionStore from '../stores/app-version-store'
import {enableServiceWorker, disableServiceWorker, isServiceWorkerEnabled} from '../lib/register-serviceworker'
import Setting from './setting'
import {getLastUpdatedAt} from '../lib/version'

export default class UpdateNotifier extends Component {
  constructor (props) {
    super(props)

    const {hasUpdate} = AppVersionStore
    this.state = {hasUpdate}

    AppVersionStore.on('change', this.onAppVersionChanged.bind(this))
  }

  async componentDidMount () {
    if (isServiceWorkerEnabled()) {
      AppVersionStore.checkForUpdateAutomatically()
    }
    this.lastUpdated = await getLastUpdatedAt()
    debug('lastUpdated', this.lastUpdated)

    this.mountedAt = Date.now()
  }

  shouldReload() {
    // この前に更新したのが、1週間以上前で
    // かつ更新にかかった時間が3秒以内の速いネットワークに限定
    debug('time from mount (sec)', (Date.now() - this.mountedAt) / 1000)
    debug('time from last update (sec)', (Date.now() - this.lastUpdated) / 1000)

    if (Date.now() - this.mountedAt < 3000 /* &&
        Date.now() - this.lastUpdated > 7*24*60*60*1000*/)
    {
      return true
    }
    // または24時間以上開きっぱなしのWindowである
    if (Date.now() - this.mountedAt > 24*60*60*1000) {
      return true
    }
    // またはprotocol-versionがあがってる
    //if (AppVersionStore.protocolVersionMismatch()) {
    //  return true
    //}

  }

  onAppVersionChanged () {
    const {hasUpdate} = AppVersionStore
    this.setState({hasUpdate})

    if (!hasUpdate) return

    if (this.shouldReload()) {
      this.reload()
    }
  }

  reload () {
    const elm = document.getElementById('cont')
    elm.className = elm.className + ' reload'
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  onClickUpdate () {
    this.reload()
  }

  render () {
    if (!this.state.hasUpdate) return null

    return (
      <div className='update-alert-bar' onClick={this.onClickUpdate}>
        <a>Update found!</a>
      </div>
    )
  }
}
