/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppCacheStore from '../stores/app-cache-store'

export default class UpdateNotifier extends Component {
  constructor (props) {
    super(props)

    const hasUpdate = AppCacheStore.hasUpdate()
    this.state = {hasUpdate}

    AppCacheStore.on('change', this.onAppVersionChanged.bind(this))
  }

  onAppVersionChanged () {
    const hasUpdate = AppCacheStore.hasUpdate()
    this.setState({hasUpdate})
  }

  render () {
    if (!this.state.hasUpdate) return null

    return (
      <div className='update-alert-bar'>
        <a href={location.href}>Update found!</a>
      </div>
    )
  }
}
