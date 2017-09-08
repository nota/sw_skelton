// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppVersionStore from '../stores/app-version-store'
import {enableServiceWorker, disableServiceWorker, isServiceWorkerEnabled} from '../lib/register-serviceworker'
import Setting from './setting'

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
  }

  onAppVersionChanged () {
    const {hasUpdate} = AppVersionStore
    this.setState({hasUpdate})
  }

  onClickUpdate () {
    window.location.reload()
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
