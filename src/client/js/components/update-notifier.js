/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AssetsCacheStore from '../stores/assets-cache-store'

export default class UpdateNotifier extends Component {
  constructor (props) {
    super(props)

    const hasUpdate = AssetsCacheStore.hasUpdate()
    this.state = {hasUpdate}

    AssetsCacheStore.on('change', this.onAppVersionChanged.bind(this))
  }

  onAppVersionChanged () {
    const hasUpdate = AssetsCacheStore.hasUpdate()
    this.setState({hasUpdate})
  }

  render () {
    if (!this.state.hasUpdate) return null

    return (
      <div className='update-alert-bar'>
        <a href={location.href}>New app version is ready!</a>
      </div>
    )
  }
}
