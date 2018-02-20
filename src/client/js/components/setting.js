/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppCacheStore from '../stores/app-cache-store'
import ServiceWorkerLauncher from '../lib/serviceworker-launcher'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    const state = this.initState()
    state.enabled = false

    this.state = state

    AppCacheStore.on('change', this.onAppCacheChanged.bind(this))
  }

  initState () {
    const {currentVersion, cachedVersion, timeOfUpdateFound} = AppCacheStore

    let message
    if (AppCacheStore.cachedVersion) {
      if (AppCacheStore.hasNewerVersion()) {
        message = 'Update is available'
      } else {
        message = 'It’s up to date :-)'
      }
    } else {
      message = 'no cache'
    }
    return {currentVersion, cachedVersion, timeOfUpdateFound, message}
  }

  async componentDidMount () {
    const currentVersion = AppCacheStore.currentVersion
    this.setState({currentVersion})
    this.checkEnabled()

    const enabled = await ServiceWorkerLauncher.getRegistration()
    if (enabled) {
      ServiceWorkerLauncher.postMessage('checkForUpdate')
    }
  }

  async checkEnabled () {
    const enabled = await ServiceWorkerLauncher.getRegistration()
    this.setState({enabled})
  }

  async onAppCacheChanged () {
    this.setState(this.initState())
  }

  async checkForUpdate () {
    this.setState({message: 'checking latest version...'})
    ServiceWorkerLauncher.update()
    ServiceWorkerLauncher.postMessage('checkForUpdate')
    this.setState(this.initState())
  }

  async enableServiceWorker () {
    try {
      await ServiceWorkerLauncher.enable()
    } catch (err) {
      alert('Cannot enable service worker\n' + err.message)
      throw (err)
    }
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
    this.checkEnabled()
  }

  render () {
    return (
      <div>
        <p>serviceWorker: {this.state.enabled ? 'on' : 'off'}</p>
        {
          this.state.message && (
            <p>
              <b>{this.state.message}</b>
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
          this.state.currentVersion && (
            <p>
              current version: {this.state.currentVersion}
            </p>
          )
        }
        {
          this.state.cachedVersion && (
            <p>
              cached version: {this.state.cachedVersion}
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
