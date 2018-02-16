/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppCacheStore from '../stores/app-cache-store'
import ServiceWorkerLauncher from '../lib/serviceworker-launcher'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    this.state = {
      version: null,
      enabled: false
    }

    AppCacheStore.on('change', this.onAppVersionChanged.bind(this))
  }

  async componentDidMount () {
    const version = await AppCacheStore.version
    this.setState({version})
    this.checkEnabled()
  }

  async checkEnabled () {
    const enabled = await ServiceWorkerLauncher.getRegistration()
    this.setState({enabled})
  }

  async onAppVersionChanged () {
    const version = await AppCacheStore.version
    this.setState({version})
  }

  async checkForUpdate () {
    await AppCacheStore.checkForUpdate()
  }

  async enableServiceWorker () {
    try {
      await ServiceWorkerLauncher.register()
    } catch (err) {
      alert('Cannot enable service worker\n' + err.message)
      throw (err)
    }
    AppCacheStore.checkForUpdateAutomatically({addall: true})
    this.checkEnabled()
  }

  async disableServiceWorker () {
    try {
      await ServiceWorkerLauncher.unregister()
    } catch (err) {
      alert('Cannot disable service worker\n' + err.message)
      throw (err)
    }
    AppCacheStore.stop()
    this.checkEnabled()
  }

  render () {
    return (
      <div>
        <p>serviceWorker: {this.state.enabled ? 'on' : 'off'}</p>
        {
          this.state.version && (
            <p>
              current version: {this.state.version}
            </p>
          )
        }
        <p>
          <button className='btn btn-default' onClick={this.checkForUpdate.bind(this)}>
            Check for update
          </button>
          &nbsp;
        </p>
        <p>
          {
            this.state.enabled
            ? <button className='btn btn-default btn-sm' onClick={this.disableServiceWorker.bind(this)}>
                Disable service worker
            </button>
            : <button className='btn btn-default btn-sm' onClick={this.enableServiceWorker.bind(this)}>
                Enable service worker
            </button>
          }
        </p>
      </div>
    )
  }
}
