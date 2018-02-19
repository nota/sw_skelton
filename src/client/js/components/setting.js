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
      enabled: false,
      timeOfUpdateFound: null,
      message: ''
    }

    AppCacheStore.on('change', this.onAppCacheChanged.bind(this))
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

  async onAppCacheChanged () {
    const {version, timeOfUpdateFound} = await AppCacheStore

    if (AppCacheStore.hasUpdate) {
      this.setState({message: 'newer version is available (and it’s already downloaded)'})
    } else {
      switch (AppCacheStore.cacheStatus) {
        case 'installed':
          this.setState({message: 'lastest version is installed'})
          break
        case 'updated':
          this.setState({message: 'newer version is available (and it’s already downloaded)'})
          break
        case 'latest':
          this.setState({message: 'you are using latest version :-)'})
          break
      }
    }
    this.setState({version, timeOfUpdateFound})
  }

  async checkForUpdate () {
    this.setState({message: 'checking latest version...'})
    await AppCacheStore.checkForUpdate({showAlert: true})
  }

  async enableServiceWorker () {
    try {
      await ServiceWorkerLauncher.enable()
    } catch (err) {
      alert('Cannot enable service worker\n' + err.message)
      throw (err)
    }
    AppCacheStore.startAutoUpdate()
    this.checkEnabled()
  }

  async disableServiceWorker () {
    try {
      await ServiceWorkerLauncher.disable()
    } catch (err) {
      alert('Cannot disable service worker\n' + err.message)
      throw (err)
    }
    this.setState({message: ''})
    AppCacheStore.stopAutoUpdate()
    this.checkEnabled()
  }

  render () {
    return (
      <div>
        <p>serviceWorker: {this.state.enabled ? 'on' : 'off'}</p>
        {
          this.state.message && (
            <p>
              {this.state.message}
            </p>
          )
        }
        {
          this.state.timeOfUpdateFound && (
            <p>
              Update is downloaded: {this.state.timeOfUpdateFound.toString()}
            </p>
          )
        }
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
